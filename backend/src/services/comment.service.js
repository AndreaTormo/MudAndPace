const crypto = require('crypto');
const repository = require('../repositories/comment.repository');
const departureRepository = require('../repositories/departure.repository');
const eventRepository = require('../repositories/event.repository');
const userRepository = require('../repositories/user.repository');
const profileRepository = require('../repositories/profile.repository');
const { AppError, normalizeAppError } = require('../utils/appError');
const { resolveVariantName } = require('../utils/variant.util');
const {
  validateObjectId,
  loadDepartureContext,
  findDepartureOrThrow,
  ensureDepartureCommentable,
  ensureDepartureFinished
} = require('../utils/departureContext');
const { validateService } = require('../utils/validation');
const {
  createCommentSchema,
  updateCommentSchema,
  commentStatusSchema,
  commentListQuerySchema,
  commentAdminListQuerySchema,
  commentDeletedListQuerySchema
} = require('../validators/comment.validator');

const DEFAULT_PAGE_SIZE = 20;
const COOLDOWN_MS = 7000;
const DUPLICATE_WINDOW_MS = 10 * 60 * 1000;
const REPORT_THRESHOLD = 3;

function validateId(id, message = 'ID de comentario inválido') {
  return validateObjectId(id, message);
}

function isAdmin(actor) {
  return actor?.role === 'ADMIN';
}

function isAuthor(actor, comment) {
  return Boolean(
    actor?.userId && comment && String(actor.userId) === String(comment.userId)
  );
}

function canEditComment(actor, comment) {
  return isAuthor(actor, comment);
}

function canDeleteComment(actor, comment) {
  return isAdmin(actor) || isAuthor(actor, comment);
}

function canModerateComment(actor) {
  return isAdmin(actor);
}

function canReportComment(actor, comment) {
  return Boolean(actor?.userId && comment && !isAuthor(actor, comment));
}

function paginationMeta(total, page, pageSize) {
  return {
    total,
    page,
    pageSize,
    totalPages: total === 0 ? 0 : Math.ceil(total / pageSize)
  };
}

function contentFingerprint(content) {
  const normalized = String(content).toLowerCase().replace(/\s+/g, ' ').trim();
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

async function ensureCooldown(userId) {
  const latest = await repository.findLatestByUser(userId);
  if (!latest) return;

  const elapsed = Date.now() - new Date(latest.created_At).getTime();
  if (elapsed >= 0 && elapsed < COOLDOWN_MS) {
    throw new AppError('Espera unos segundos antes de volver a publicar un comentario', 429, 'COMMENT_COOLDOWN');
  }
}

async function ensureNotDuplicate(userId, contentHash, { excludeId } = {}) {
  const since = new Date(Date.now() - DUPLICATE_WINDOW_MS);
  const recent = await repository.findRecentByHash(userId, contentHash, since, { excludeId });
  if (recent) {
    throw new AppError('Ya has publicado un comentario idéntico recientemente', 409, 'DUPLICATE_COMMENT');
  }
}

function deletedAuthor(id, forAdmin) {
  return {
    _id: id,
    firstName: 'Usuario',
    lastName: forAdmin ? 'eliminado' : '',
    avatarUrl: null,
    deleted: true
  };
}

async function serializeAuthors(comments, { forAdmin = false } = {}) {
  const userIds = [...new Set(comments.map((comment) => String(comment.userId)))];
  const [users, profiles] = await Promise.all([
    userRepository.findByIdsIncludingDeleted(userIds),
    profileRepository.findByUserIds(userIds)
  ]);

  const userMap = new Map(users.map((user) => [String(user._id), user]));
  const profileMap = new Map(profiles.map((profile) => [String(profile.userId), profile]));

  return comments.map((comment) => {
    const id = String(comment.userId);
    const user = userMap.get(id);

    if (!user || user.deleted_at) {
      return deletedAuthor(id, forAdmin);
    }

    const profile = profileMap.get(id);
    const rawFirstName = String(profile?.firstName ?? user.name ?? '').trim();
    const rawLastName = String(profile?.lastName ?? '').trim();

    return {
      _id: id,
      firstName: forAdmin ? rawFirstName : (rawFirstName.split(/\s+/)[0] || 'Usuario'),
      lastName: forAdmin ? rawLastName : (rawLastName ? `${rawLastName.charAt(0).toUpperCase()}.` : ''),
      avatarUrl: profile?.avatarUrl ?? null,
      deleted: false
    };
  });
}

function serializeComment(comment, author, { actor } = {}) {
  const reportedBy = Array.isArray(comment.reportedBy) ? comment.reportedBy : [];

  return {
    _id: String(comment._id),
    departureId: String(comment.departureId),
    userId: String(comment.userId),
    content: comment.content,
    status: comment.status,
    reportCount: reportedBy.length,
    reportedByMe: Boolean(
      actor?.userId && reportedBy.some((id) => String(id) === String(actor.userId))
    ),
    author,
    deleted_at: comment.deleted_at,
    created_At: comment.created_At,
    updated_at: comment.updated_at
  };
}

async function serializeMany(comments, options = {}) {
  const authors = await serializeAuthors(comments, options);
  return comments.map((comment, index) => serializeComment(comment, authors[index], options));
}

async function serializeManyForAdmin(comments, actor = {}) {
  if (comments.length === 0) {
    return [];
  }

  const departureIds = [...new Set(comments.map((comment) => String(comment.departureId)))];
  const [serialized, departures] = await Promise.all([
    serializeMany(comments, { forAdmin: true, actor }),
    departureRepository.findByIdsIncludingDeleted(departureIds)
  ]);

  const departureMap = new Map(departures.map((departure) => [String(departure._id), departure]));
  const eventIds = [...new Set(departures.map((departure) => String(departure.eventId)))];
  const events = await eventRepository.findByIds(eventIds);
  const eventMap = new Map(events.map((event) => [String(event._id), event]));

  return serialized.map((comment) => {
    const departure = departureMap.get(comment.departureId);
    const event = departure ? eventMap.get(String(departure.eventId)) : null;

    return {
      ...comment,
      variant: resolveVariantName(departure, event),
      event: event ? { _id: String(event._id), name: event.name, slug: event.slug } : null,
      departureSlug: departure?.slug ?? null
    };
  });
}

async function findCommentOrThrow(id, { includeDeleted = false } = {}) {
  const comment = includeDeleted
    ? await repository.findByIdIncludingDeleted(id)
    : await repository.findById(id);

  if (!comment) {
    throw new AppError('Comment not found', 404, 'COMMENT_NOT_FOUND');
  }

  return comment;
}

class CommentService {
  async listByDeparture(rawDepartureId, rawQuery = {}, actor = {}) {
    try {
      const departureId = validateId(rawDepartureId, 'ID de salida inválido');
      const input = validateService(commentListQuerySchema, rawQuery);
      await findDepartureOrThrow(departureId);

      const page = input.page ?? 1;
      const pageSize = input.pageSize ?? DEFAULT_PAGE_SIZE;
      const { data, total } = await repository.findByDepartureId(departureId, {
        page,
        pageSize,
        includeHidden: isAdmin(actor)
      });

      return {
        data: await serializeMany(data, { forAdmin: isAdmin(actor), actor }),
        pagination: paginationMeta(total, page, pageSize)
      };
    } catch (error) {
      throw normalizeAppError(error);
    }
  }

  async listAll(rawQuery = {}, actor = {}) {
    try {
      if (!canModerateComment(actor)) {
        throw new AppError('You do not have permission to moderate comments', 403, 'COMMENT_FORBIDDEN');
      }
      const input = validateService(commentAdminListQuerySchema, rawQuery);
      const page = input.page ?? 1;
      const pageSize = input.pageSize ?? DEFAULT_PAGE_SIZE;
      const { data, total } = await repository.findAll({ page, pageSize, status: input.status });

      return {
        data: await serializeManyForAdmin(data, actor),
        pagination: paginationMeta(total, page, pageSize)
      };
    } catch (error) {
      throw normalizeAppError(error);
    }
  }

  async create(rawDepartureId, rawPayload, actor = {}) {
    try {
      const departureId = validateId(rawDepartureId, 'ID de salida inválido');
      const payload = validateService(createCommentSchema, rawPayload);
      const context = await loadDepartureContext(departureId);
      ensureDepartureCommentable(context);
      ensureDepartureFinished(context.departure);

      const contentHash = contentFingerprint(payload.content);
      await ensureCooldown(actor.userId);
      await ensureNotDuplicate(actor.userId, contentHash);

      const created = await repository.create({
        departureId,
        userId: actor.userId,
        content: payload.content,
        contentHash
      });

      return (await serializeMany([created], { forAdmin: isAdmin(actor), actor }))[0];
    } catch (error) {
      throw normalizeAppError(error);
    }
  }

  async update(rawId, rawPayload, actor = {}) {
    try {
      const id = validateId(rawId);
      const payload = validateService(updateCommentSchema, rawPayload);
      const current = await findCommentOrThrow(id);

      if (!canEditComment(actor, current)) {
        throw new AppError('You do not have permission to edit this comment', 403, 'COMMENT_FORBIDDEN');
      }

      const contentHash = contentFingerprint(payload.content);
      await ensureNotDuplicate(actor.userId, contentHash, { excludeId: id });

      const updated = await repository.updateContent(id, payload.content, contentHash);
      if (!updated) {
        throw new AppError('Comment not found', 404, 'COMMENT_NOT_FOUND');
      }

      return (await serializeMany([updated], { forAdmin: isAdmin(actor), actor }))[0];
    } catch (error) {
      throw normalizeAppError(error);
    }
  }

  async remove(rawId, actor = {}) {
    try {
      const id = validateId(rawId);
      const current = await findCommentOrThrow(id);

      if (!canDeleteComment(actor, current)) {
        throw new AppError('You do not have permission to delete this comment', 403, 'COMMENT_FORBIDDEN');
      }

      const deleted = await repository.softDeleteById(id);
      if (!deleted) {
        throw new AppError('Comment not found', 404, 'COMMENT_NOT_FOUND');
      }

      return (await serializeMany([deleted], { forAdmin: isAdmin(actor), actor }))[0];
    } catch (error) {
      throw normalizeAppError(error);
    }
  }

  async setStatus(rawId, rawPayload, actor = {}) {
    try {
      const id = validateId(rawId);
      const payload = validateService(commentStatusSchema, rawPayload);

      if (!canModerateComment(actor)) {
        throw new AppError('You do not have permission to moderate comments', 403, 'COMMENT_FORBIDDEN');
      }

      await findCommentOrThrow(id);
      const updated = await repository.setStatus(id, payload.status);
      if (!updated) {
        throw new AppError('Comment not found', 404, 'COMMENT_NOT_FOUND');
      }

      return (await serializeMany([updated], { forAdmin: isAdmin(actor), actor }))[0];
    } catch (error) {
      throw normalizeAppError(error);
    }
  }

  async listDeleted(rawQuery = {}, actor = {}) {
    try {
      if (!canModerateComment(actor)) {
        throw new AppError('You do not have permission to moderate comments', 403, 'COMMENT_FORBIDDEN');
      }
      const input = validateService(commentDeletedListQuerySchema, rawQuery);
      const page = input.page ?? 1;
      const pageSize = input.pageSize ?? DEFAULT_PAGE_SIZE;
      const { data, total } = await repository.findAllDeleted({ page, pageSize });

      return {
        data: await serializeMany(data, { forAdmin: true, actor }),
        pagination: paginationMeta(total, page, pageSize)
      };
    } catch (error) {
      throw normalizeAppError(error);
    }
  }

  async restore(rawId, actor = {}) {
    try {
      const id = validateId(rawId);

      if (!canModerateComment(actor)) {
        throw new AppError('You do not have permission to restore comments', 403, 'COMMENT_FORBIDDEN');
      }

      const current = await findCommentOrThrow(id, { includeDeleted: true });
      if (!current.deleted_at) {
        throw new AppError('Comment is not deleted', 409, 'COMMENT_ALREADY_ACTIVE');
      }

      const restored = await repository.restoreById(id);
      if (!restored) {
        throw new AppError('Comment not found', 404, 'COMMENT_NOT_FOUND');
      }

      return (await serializeMany([restored], { forAdmin: isAdmin(actor), actor }))[0];
    } catch (error) {
      throw normalizeAppError(error);
    }
  }

  async report(rawId, actor = {}) {
    try {
      const id = validateId(rawId);
      const current = await findCommentOrThrow(id);

      if (!canReportComment(actor, current)) {
        throw new AppError('You do not have permission to report this comment', 403, 'COMMENT_FORBIDDEN');
      }
      if (current.status === 'hidden') {
        throw new AppError('El comentario ya está oculto', 409, 'COMMENT_ALREADY_HIDDEN');
      }

      const reported = await repository.addReport(id, actor.userId);
      if (!reported) {
        const latest = await repository.findByIdIncludingDeleted(id);
        if (!latest || latest.deleted_at) {
          throw new AppError('Comment not found', 404, 'COMMENT_NOT_FOUND');
        }
        throw new AppError('Ya has reportado este comentario', 409, 'COMMENT_ALREADY_REPORTED');
      }

      const reportCount = Array.isArray(reported.reportedBy) ? reported.reportedBy.length : 0;
      const result =
        reportCount >= REPORT_THRESHOLD && reported.status !== 'hidden'
          ? (await repository.setStatus(id, 'hidden')) ?? reported
          : reported;

      return (await serializeMany([result], { forAdmin: isAdmin(actor), actor }))[0];
    } catch (error) {
      throw normalizeAppError(error);
    }
  }

  async deleteByDeparture(rawDepartureId) {
    try {
      const departureId = validateId(rawDepartureId, 'ID de salida inválido');
      return repository.deleteByDepartureId(departureId);
    } catch (error) {
      throw normalizeAppError(error);
    }
  }
}

module.exports = new CommentService();
