const repository = require('../repositories/rating.repository');
const { AppError, normalizeAppError } = require('../utils/appError');
const {
  validateObjectId,
  loadDepartureContext,
  findDepartureOrThrow,
  ensureDepartureCommentable,
  ensureDepartureFinished
} = require('../utils/departureContext');
const { validateService } = require('../utils/validation');
const { createRatingSchema } = require('../validators/rating.validator');

function validateId(id, message = 'ID de salida inválido') {
  return validateObjectId(id, message);
}

function isOwner(actor, rating) {
  return Boolean(
    actor?.userId && rating && String(actor.userId) === String(rating.userId)
  );
}

function canModifyRating(actor, rating) {
  return isOwner(actor, rating);
}

function roundAverage(scoreSum, total) {
  if (!total) return null;
  return Math.round((scoreSum / total) * 10) / 10;
}

function summaryFromAggregate(row = null, mine = null) {
  return {
    average: roundAverage(row?.scoreSum ?? 0, row?.total ?? 0),
    total: row?.total ?? 0,
    mine: mine?.score ?? null
  };
}

function emptySummary() {
  return { average: null, total: 0, mine: null };
}

function serializeRating(rating, { actor } = {}) {
  return {
    _id: String(rating._id),
    userId: String(rating.userId),
    departureId: String(rating.departureId),
    eventId: String(rating.eventId),
    score: rating.score,
    review: rating.review || '',
    mine: isOwner(actor, rating),
    created_At: rating.created_At,
    updated_at: rating.updated_at
  };
}

function requireUser(actor) {
  if (!actor?.userId) {
    throw new AppError('Authentication required', 401, 'RATING_UNAUTHENTICATED');
  }
}

class RatingService {
  async getForDeparture(rawDepartureId, actor = {}) {
    try {
      const departureId = validateId(rawDepartureId);
      await findDepartureOrThrow(departureId);

      const [rows, mine] = await Promise.all([
        repository.aggregateByDepartureIds([departureId]),
        actor.userId
          ? repository.findMineByUserAndDeparture(actor.userId, departureId)
          : Promise.resolve(null)
      ]);

      return summaryFromAggregate(rows[0], mine);
    } catch (error) {
      throw normalizeAppError(error);
    }
  }

  async upsert(rawDepartureId, rawPayload, actor = {}) {
    try {
      requireUser(actor);
      const departureId = validateId(rawDepartureId);
      const payload = validateService(createRatingSchema, rawPayload);
      const context = await loadDepartureContext(departureId);
      ensureDepartureCommentable(context);
      ensureDepartureFinished(context.departure);

      const rating = await repository.upsert({
        userId: actor.userId,
        departureId,
        eventId: context.departure.eventId,
        score: payload.score,
        review: payload.review || ''
      });

      if (!rating) {
        throw new AppError('No se ha podido guardar la valoración', 500, 'RATING_SAVE_FAILED');
      }

      const summary = await this.getForDeparture(departureId, actor);
      return { rating: serializeRating(rating, { actor }), summary };
    } catch (error) {
      throw normalizeAppError(error);
    }
  }

  async remove(rawDepartureId, actor = {}) {
    try {
      requireUser(actor);
      const departureId = validateId(rawDepartureId);
      const mine = await repository.findMineByUserAndDeparture(actor.userId, departureId);

      if (!mine) {
        throw new AppError('Rating not found', 404, 'RATING_NOT_FOUND');
      }
      if (!canModifyRating(actor, mine)) {
        throw new AppError('You do not have permission to modify this rating', 403, 'RATING_FORBIDDEN');
      }

      const removed = await repository.softDeleteForUser(actor.userId, departureId);
      if (!removed) {
        throw new AppError('Rating not found', 404, 'RATING_NOT_FOUND');
      }

      const summary = await this.getForDeparture(departureId, actor);
      return { rating: null, summary };
    } catch (error) {
      throw normalizeAppError(error);
    }
  }

  async getSummariesForEvents(eventIds = [], actor = {}) {
    try {
      const ids = [...new Set(eventIds.map(String))];
      if (!ids.length) return new Map();

      const [rows, mine] = await Promise.all([
        repository.aggregateByEventIds(ids),
        actor.userId
          ? repository.findMineByUserAndEventIds(actor.userId, ids)
          : Promise.resolve([])
      ]);

      const rowMap = new Map(rows.map((row) => [String(row._id), row]));
      const mineMap = new Map(mine.map((rating) => [String(rating.eventId), rating]));

      return new Map(
        ids.map((id) => [
          id,
          summaryFromAggregate(rowMap.get(id), mineMap.get(id))
        ])
      );
    } catch (error) {
      throw normalizeAppError(error);
    }
  }

  async getSummariesForDepartures(departureIds = [], actor = {}) {
    try {
      const ids = [...new Set(departureIds.map(String))];
      if (!ids.length) return new Map();

      const [rows, mine] = await Promise.all([
        repository.aggregateByDepartureIds(ids),
        actor.userId
          ? repository.findMineByUserAndDepartureIds(actor.userId, ids)
          : Promise.resolve([])
      ]);

      const rowMap = new Map(rows.map((row) => [String(row._id), row]));
      const mineMap = new Map(mine.map((rating) => [String(rating.departureId), rating]));

      return new Map(
        ids.map((id) => [
          id,
          summaryFromAggregate(rowMap.get(id), mineMap.get(id))
        ])
      );
    } catch (error) {
      throw normalizeAppError(error);
    }
  }

  async deleteByDeparture(rawDepartureId) {
    try {
      const departureId = validateId(rawDepartureId);
      return repository.deleteByDepartureId(departureId);
    } catch (error) {
      throw normalizeAppError(error);
    }
  }
}

module.exports = new RatingService();
module.exports.emptySummary = emptySummary;
module.exports.serializeRating = serializeRating;
