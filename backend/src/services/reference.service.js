const Category = require('../models/category.model');
const Location = require('../models/location.model');
const Host = require('../models/host.model');
const Event = require('../models/event.model');
const repository = require('../repositories/reference.repository');
const { AppError, normalizeAppError } = require('../utils/appError');
const { validateService } = require('../utils/validation');
const { buildMongoFilter, combineClauses, regexOr } = require('../utils/queryBuilder');
const {
  listCategoryQuerySchema,
  listHostQuerySchema,
  listLocationQuerySchema
} = require('../validators/reference.validator');
const mongoose = require('mongoose');

const CATEGORY_FILTERS = [
  { param: 'search', build: (value) => ({ $text: { $search: value } }) },
  { param: 'slug', build: (value) => ({ slug: value }) },
  { param: 'status', build: (value) => ({ status: value }) },
  { param: 'isActive', build: (value) => ({ isActive: value }) }
];

const HOST_FILTERS = CATEGORY_FILTERS;

const LOCATION_FILTERS = [
  ...CATEGORY_FILTERS,
  { param: 'city', build: (value) => regexOr(['city'], value) },
  { param: 'country', build: (value) => regexOr(['country'], value) }
];

function normalizeReferenceQuery(input) {
  return {
    ...input,
    isActive: input.isActive !== undefined ? input.isActive : input.is_active,
    status: input.status === 'all' ? undefined : input.status
  };
}

function buildReferenceFilter(input, definitions) {
  const normalized = normalizeReferenceQuery(input);
  const explicitAudience = (
    input.isActive !== undefined ||
    input.is_active !== undefined ||
    input.status !== undefined
  );

  const clauses = [];
  if (!explicitAudience) {
    clauses.push({ isActive: true }, { status: 'active' });
  }
  clauses.push(buildMongoFilter(normalized, definitions));

  return combineClauses(clauses);
}

function validateId(id) {
  if (!mongoose.isValidObjectId(id)) throw new AppError('ID inválido', 400, 'INVALID_ID');
  return id;
}

async function ensureNoActiveEvents(refField, id) {
  validateId(id);
  const count = await Event.countDocuments({ [refField]: id, deleted_at: null });
  if (count > 0) {
    throw new AppError('No se puede desactivar/eliminar: existen eventos asociados', 409, 'HAS_ASSOCIATED_EVENTS');
  }
}

class ReferenceService {
  async listCategories(query = {}) {
    try {
      const input = validateService(listCategoryQuerySchema, query);
      return await repository.findCategories(buildReferenceFilter(input, CATEGORY_FILTERS));
    } catch (error) { throw normalizeAppError(error); }
  }

  async listLocations(query = {}) {
    try {
      const input = validateService(listLocationQuerySchema, query);
      return await repository.findLocations(buildReferenceFilter(input, LOCATION_FILTERS));
    } catch (error) { throw normalizeAppError(error); }
  }

  async listHosts(query = {}) {
    try {
      const input = validateService(listHostQuerySchema, query);
      return await repository.findHosts(buildReferenceFilter(input, HOST_FILTERS));
    } catch (error) { throw normalizeAppError(error); }
  }

  async softDeleteHost(id) {
    await ensureNoActiveEvents('hostId', id);
    const host = await Host.findByIdAndUpdate(
      id,
      { $set: { isActive: false, status: 'inactive', deleted_at: new Date() } },
      { new: true }
    );
    if (!host) throw new AppError('Organizador no encontrado', 404, 'HOST_NOT_FOUND');
    return host;
  }

  async deactivateHost(id) {
    return this.softDeleteHost(id);
  }

  async softDeleteCategory(id) {
    await ensureNoActiveEvents('categoryId', id);
    const category = await Category.findByIdAndUpdate(
      id,
      { $set: { isActive: false, status: 'inactive', deleted_at: new Date() } },
      { new: true }
    );
    if (!category) throw new AppError('Categoría no encontrada', 404, 'CATEGORY_NOT_FOUND');
    return category;
  }

  async deactivateCategory(id) {
    return this.softDeleteCategory(id);
  }

  async softDeleteLocation(id) {
    await ensureNoActiveEvents('locationId', id);
    const location = await Location.findByIdAndUpdate(
      id,
      { $set: { isActive: false, status: 'inactive', deleted_at: new Date() } },
      { new: true }
    );
    if (!location) throw new AppError('Ubicación no encontrada', 404, 'LOCATION_NOT_FOUND');
    return location;
  }

  async deactivateLocation(id) {
    return this.softDeleteLocation(id);
  }
}

module.exports = new ReferenceService();
