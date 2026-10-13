const mongoose = require('mongoose');
const repository = require('../repositories/trailRoute.repository');
const { AppError, normalizeAppError, slugify } = require('../utils/appError');
const { routePayloadSchema, updateRouteSchema, objectIdSchema, slugSchema, listQuerySchema, nearbyQuerySchema } = require('../validators/trailRoute.validator');

function validateService(schema, value) {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw new AppError('Datos de entrada inválidos', 400, 'VALIDATION_ERROR', result.error.issues);
  }
  return result.data;
}

function validateId(id) {
  const parsed = objectIdSchema.safeParse(id);
  if (!parsed.success || !mongoose.isValidObjectId(id)) throw new AppError('ID de ruta inválido', 400, 'INVALID_ID');
  return id;
}

class TrailRouteService {
  async list(query = {}) {
    try {
      const filtersInput = validateService(listQuerySchema, query);
      const { includeDeleted = false, isActive, status, isPublished, minDistance, maxDistance, ...rest } = filtersInput;
      const filters = { ...rest };
      if (isActive !== undefined) filters.isActive = isActive;
      if (isPublished !== undefined) filters.isPublished = isPublished;
      if (minDistance !== undefined || maxDistance !== undefined) {
        filters.distanceKm = {};
        if (minDistance !== undefined) filters.distanceKm.$gte = minDistance;
        if (maxDistance !== undefined) filters.distanceKm.$lte = maxDistance;
      }
      if (status === 'deleted') return await repository.findAll({ ...filters, status: 'deleted' }, { includeDeleted: true });
      if (status === undefined) filters.status = { $in: ['active', 'inactive'] };
      else if (status !== 'all') filters.status = status;
      return await repository.findAll(filters, { includeDeleted });
    } catch (error) { throw normalizeAppError(error); }
  }

  async getById(id) {
    try {
      validateId(id);
      const route = await repository.findById(id);
      if (!route) throw new AppError('Ruta no encontrada', 404, 'ROUTE_NOT_FOUND');
      return route;
    } catch (error) { throw normalizeAppError(error); }
  }

  async getBySlug(slug) {
    try {
      const parsed = validateService(slugSchema, slug);
      const route = await repository.findBySlug(parsed);
      if (!route) throw new AppError('Ruta no encontrada', 404, 'ROUTE_NOT_FOUND');
      return route;
    } catch (error) { throw normalizeAppError(error); }
  }

  async create(data) {
    try {
      const input = validateService(routePayloadSchema, data);
      const payload = { ...input, slug: input.slug || slugify(input.name), isActive: input.isActive ?? true, status: input.status || 'active', deleted_at: null };
      if (!payload.slug) throw new AppError('No se pudo generar el slug', 400, 'INVALID_SLUG');
      return await repository.create(payload);
    } catch (error) { throw normalizeAppError(error); }
  }

  async update(id, data) {
    try {
      validateId(id);
      const input = validateService(updateRouteSchema, data);
      const payload = { ...input };
      if (payload.name && !payload.slug) payload.slug = slugify(payload.name);
      if (payload.status === 'active') { payload.isActive = true; payload.deleted_at = null; }
      if (payload.status === 'inactive') { payload.isActive = false; payload.deleted_at = null; }
      const route = await repository.updateById(id, payload);
      if (!route) throw new AppError('Ruta no encontrada', 404, 'ROUTE_NOT_FOUND');
      return route;
    } catch (error) { throw normalizeAppError(error); }
  }

  async softDelete(id) {
    try {
      validateId(id);
      const route = await repository.softDeleteById(id);
      if (!route) {
        const existing = await repository.findById(id, { includeDeleted: true });
        if (!existing) throw new AppError('Ruta no encontrada', 404, 'ROUTE_NOT_FOUND');
        throw new AppError('La ruta ya está inactiva y no se puede volver a borrar', 409, 'ROUTE_ALREADY_INACTIVE');
      }
      return route;
    } catch (error) { throw normalizeAppError(error); }
  }

  async restore(id) {
    try {
      validateId(id);
      const route = await repository.restoreById(id);
      if (!route) {
        const existing = await repository.findById(id, { includeDeleted: true });
        if (!existing) throw new AppError('Ruta no encontrada', 404, 'ROUTE_NOT_FOUND');
        throw new AppError('La ruta ya está activa y no se puede restaurar', 409, 'ROUTE_ALREADY_ACTIVE');
      }
      return route;
    } catch (error) { throw normalizeAppError(error); }
  }

  async activate(id) {
    try {
      validateId(id);
      const route = await repository.activateById(id);
      if (!route) {
        const existing = await repository.findById(id, { includeDeleted: true });
        if (!existing) throw new AppError('Ruta no encontrada', 404, 'ROUTE_NOT_FOUND');
        throw new AppError('La ruta ya está activa', 409, 'ROUTE_ALREADY_ACTIVE');
      }
      return route;
    } catch (error) { throw normalizeAppError(error); }
  }

  async deactivate(id) {
    try {
      validateId(id);
      const route = await repository.deactivateById(id);
      if (!route) {
        const existing = await repository.findById(id, { includeDeleted: true });
        if (!existing) throw new AppError('Ruta no encontrada', 404, 'ROUTE_NOT_FOUND');
        throw new AppError('La ruta ya está inactiva', 409, 'ROUTE_ALREADY_INACTIVE');
      }
      return route;
    } catch (error) { throw normalizeAppError(error); }
  }

  async nearby(query) {
    try {
      const { longitude, latitude, radiusKm } = validateService(nearbyQuerySchema, query);
      return await repository.findNearby(longitude, latitude, radiusKm * 1000);
    } catch (error) { throw normalizeAppError(error); }
  }
}

module.exports = new TrailRouteService();
