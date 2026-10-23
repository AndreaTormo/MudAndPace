const mongoose = require('mongoose');
const repository = require('../repositories/event.repository');
const eventImageService = require('./eventImage.service');
const { AppError, normalizeAppError } = require('../utils/appError');
const { slugify } = require('../utils/slugify');
const {
  eventPayloadSchema, updateEventSchema, objectIdSchema, slugSchema, listQuerySchema
} = require('../validators/event.validator');

function validateService(schema, value) {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw new AppError('Datos de entrada inválidos', 400, 'VALIDATION_ERROR', result.error.issues);
  }
  return result.data;
}

function validateId(id) {
  const parsed = objectIdSchema.safeParse(id);
  if (!parsed.success || !mongoose.isValidObjectId(id)) throw new AppError('ID de evento inválido', 400, 'INVALID_ID');
  return id;
}

function validateBusinessRules(payload) {
  const details = [];

  if (payload.distanceKm !== undefined) {
    if (typeof payload.distanceKm !== 'number' || !Number.isFinite(payload.distanceKm) || payload.distanceKm <= 0) {
      details.push({ path: 'distanceKm', message: 'distanceKm debe ser un número mayor que 0' });
    }
  }
  if (payload.elevationGain !== undefined) {
    if (typeof payload.elevationGain !== 'number' || !Number.isFinite(payload.elevationGain) || payload.elevationGain < 0) {
      details.push({ path: 'elevationGain', message: 'elevationGain debe ser un número mayor o igual que 0' });
    }
  }
  if (payload.price !== undefined) {
    if (typeof payload.price !== 'number' || !Number.isFinite(payload.price) || payload.price < 0) {
      details.push({ path: 'price', message: 'price debe ser un número mayor o igual que 0' });
    }
  }

  if (details.length) throw new AppError('Datos de negocio inválidos', 400, 'VALIDATION_ERROR', details);
  return payload;
}

class EventService {
  async buildUniqueSlug(name, excludeId) {
    const base = slugify(name);
    if (!base) throw new AppError('No se pudo generar el slug', 400, 'INVALID_SLUG');

    let candidate = base;
    let suffix = 2;
    while (await repository.existsBySlug(candidate, excludeId)) {
      candidate = `${base}-${suffix}`;
      suffix += 1;
    }
    return candidate;
  }

  async list(query = {}) {
    try {
      const input = validateService(listQuerySchema, query);
      const {
        status, categoryId, locationId, hostId, minDistance, maxDistance, fromDate, toDate, isActive
      } = input;

      const filters = {};
      if (categoryId) filters.categoryId = categoryId;
      if (locationId) filters.locationId = locationId;
      if (hostId) filters.hostId = hostId;
      if (minDistance !== undefined || maxDistance !== undefined) {
        filters.distanceKm = {};
        if (minDistance !== undefined) filters.distanceKm.$gte = minDistance;
        if (maxDistance !== undefined) filters.distanceKm.$lte = maxDistance;
      }
      if (fromDate !== undefined || toDate !== undefined) {
        filters.startDate = {};
        if (fromDate !== undefined) filters.startDate.$gte = fromDate;
        if (toDate !== undefined) filters.startDate.$lte = toDate;
      }
      if (isActive !== undefined) filters.isActive = isActive;
      if (status === 'published' || status === 'draft') filters.status = status;

      return await repository.findAll(filters);
    } catch (error) { throw normalizeAppError(error); }
  }

  async getById(id) {
    try {
      validateId(id);
      const event = await repository.findById(id);
      if (!event) throw new AppError('Evento no encontrado', 404, 'EVENT_NOT_FOUND');
      return event;
    } catch (error) { throw normalizeAppError(error); }
  }

  async getBySlug(slug) {
    try {
      const parsed = validateService(slugSchema, slug);
      const event = await repository.findBySlug(parsed);
      if (!event) throw new AppError('Evento no encontrado', 404, 'EVENT_NOT_FOUND');
      return event;
    } catch (error) { throw normalizeAppError(error); }
  }

  async create(data) {
    try {
      const input = validateService(eventPayloadSchema, data);
      const slug = await this.buildUniqueSlug(input.name);
      const payload = {
        ...input,
        slug,
        isActive: input.isActive ?? true,
        status: input.status || 'draft',
        deleted_at: null
      };
      validateBusinessRules(payload);
      return await repository.create(payload);
    } catch (error) { throw normalizeAppError(error); }
  }

  async update(id, data) {
    try {
      validateId(id);
      const existing = await repository.findById(id);
      if (!existing) throw new AppError('Evento no encontrado', 404, 'EVENT_NOT_FOUND');

      const input = validateService(updateEventSchema, data);
      const payload = { ...input };

      if (payload.name) payload.slug = await this.buildUniqueSlug(payload.name, id);
      else if (payload.slug) payload.slug = await this.buildUniqueSlug(payload.slug, id);

      validateBusinessRules(payload);

      const event = await repository.updateById(id, payload);
      if (!event) throw new AppError('Evento no encontrado', 404, 'EVENT_NOT_FOUND');
      return event;
    } catch (error) { throw normalizeAppError(error); }
  }

  async softDelete(id) {
    try {
      validateId(id);
      const event = await repository.softDeleteById(id);
      if (!event) {
        const existing = await repository.findById(id, { includeDeleted: true });
        if (!existing) throw new AppError('Evento no encontrado', 404, 'EVENT_NOT_FOUND');
        throw new AppError('El evento ya está en la papelera y no se puede volver a borrar', 409, 'EVENT_ALREADY_DELETED');
      }
      return event;
    } catch (error) { throw normalizeAppError(error); }
  }

  async restore(id) {
    try {
      validateId(id);
      const event = await repository.restoreById(id);
      if (!event) {
        const existing = await repository.findById(id, { includeDeleted: true });
        if (!existing) throw new AppError('Evento no encontrado', 404, 'EVENT_NOT_FOUND');
        throw new AppError('El evento no está en la papelera y no se puede restaurar', 409, 'EVENT_ALREADY_ACTIVE');
      }
      return event;
    } catch (error) { throw normalizeAppError(error); }
  }

  async listDeleted() {
    try {
      return await repository.findAllDeleted();
    } catch (error) { throw normalizeAppError(error); }
  }

  async hardDelete(id) {
    try {
      validateId(id);
      const event = await repository.hardDeleteById(id);
      if (!event) {
        const existing = await repository.findById(id, { includeDeleted: true });
        if (!existing) throw new AppError('Evento no encontrado', 404, 'EVENT_NOT_FOUND');
        throw new AppError('Solo se puede eliminar definitivamente un evento de la papelera', 409, 'EVENT_NOT_DELETED');
      }

      try {
        await eventImageService.removeAllForEvent(id);
      } catch (error) {
        console.error('No se pudieron eliminar las imágenes del evento', id, error);
      }

      return event;
    } catch (error) { throw normalizeAppError(error); }
  }

  async publish(id) {
    try {
      validateId(id);
      const event = await repository.publishById(id);
      if (!event) {
        const existing = await repository.findById(id, { includeDeleted: true });
        if (!existing) throw new AppError('Evento no encontrado', 404, 'EVENT_NOT_FOUND');
        throw new AppError('El evento ya está publicado', 409, 'EVENT_ALREADY_PUBLISHED');
      }
      return event;
    } catch (error) { throw normalizeAppError(error); }
  }

  async unpublish(id) {
    try {
      validateId(id);
      const event = await repository.unpublishById(id);
      if (!event) {
        const existing = await repository.findById(id, { includeDeleted: true });
        if (!existing) throw new AppError('Evento no encontrado', 404, 'EVENT_NOT_FOUND');
        throw new AppError('El evento ya está en borrador', 409, 'EVENT_ALREADY_DRAFT');
      }
      return event;
    } catch (error) { throw normalizeAppError(error); }
  }
}

module.exports = new EventService();
