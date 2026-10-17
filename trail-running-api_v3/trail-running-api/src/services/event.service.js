const mongoose = require('mongoose');
const repository = require('../repositories/event.repository');
const { AppError, normalizeAppError, slugify } = require('../utils/appError');
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

class EventService {
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
      const payload = {
        ...input,
        slug: input.slug || slugify(input.name),
        isActive: input.isActive ?? true,
        status: input.status || 'draft',
        deleted_at: null
      };
      if (!payload.slug) throw new AppError('No se pudo generar el slug', 400, 'INVALID_SLUG');
      return await repository.create(payload);
    } catch (error) { throw normalizeAppError(error); }
  }

  async update(id, data) {
    try {
      validateId(id);
      const input = validateService(updateEventSchema, data);
      const payload = { ...input };
      if (payload.name && !payload.slug) payload.slug = slugify(payload.name);
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
        throw new AppError('El evento ya está inactivo y no se puede volver a borrar', 409, 'EVENT_ALREADY_INACTIVE');
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
