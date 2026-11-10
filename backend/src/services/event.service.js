const mongoose = require('mongoose');
const repository = require('../repositories/event.repository');
const referenceRepository = require('../repositories/reference.repository');
const eventImageService = require('./eventImage.service');
const { AppError, normalizeAppError } = require('../utils/appError');
const { buildMongoFilter, mergeValues } = require('../utils/queryBuilder');
const { slugify } = require('../utils/slugify');
const { generateUniqueSku } = require('../utils/sku');
const {
  eventPayloadSchema, updateEventSchema, objectIdSchema, slugSchema, listQuerySchema, MIN_EVENT_VARIANTS
} = require('../validators/event.validator');

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;

const atLeast = (field) => (value) => ({
  $or: [
    { [field]: { $gte: value } },
    { [`variants.${field}`]: { $gte: value } }
  ]
});

const atMost = (field) => (value) => ({
  $or: [
    { [field]: { $lte: value } },
    { [`variants.${field}`]: { $lte: value } }
  ]
});

const EVENT_FILTERS = [
  { param: 'status', build: (value) => ({ status: value }) },
  { param: 'isActive', build: (value) => ({ isActive: value }) },
  { param: 'categorySlug', build: (value, context) => ({ categoryId: { $in: context.categoryIds } }) },
  { param: 'hostSlug', build: (value, context) => ({ hostId: { $in: context.hostIds } }) },
  { param: 'locationSlug', build: (value, context) => ({ locationId: { $in: context.locationIds } }) },
  { param: 'difficulty', build: (value) => ({ difficulty: { $in: value } }) },
  { param: 'surface', build: (value) => ({ surface: { $in: value } }) },
  { param: 'tags', build: (value) => ({ tags: { $in: value } }) },
  { param: 'minDistance', build: atLeast('distanceKm') },
  { param: 'maxDistance', build: atMost('distanceKm') },
  { param: 'minElevationGain', build: atLeast('elevationGain') },
  { param: 'maxElevationGain', build: atMost('elevationGain') },
  { param: 'minPrice', build: atLeast('price') },
  { param: 'maxPrice', build: atMost('price') },
  { param: 'fromDate', build: (value) => ({ startDate: { $gte: value } }) },
  { param: 'toDate', build: (value) => ({ startDate: { $lte: value } }) },
  { param: 'search', build: (value) => ({ $text: { $search: value } }) }
];

function normalizeEventQuery(input) {
  return {
    ...input,
    categorySlug: mergeValues(input.categorySlug, input.category_slug),
    hostSlug: mergeValues(input.hostSlug, input.host_slug),
    locationSlug: mergeValues(input.locationSlug, input.location_slug),
    status: input.status === 'all' ? undefined : input.status,
    isActive: input.isActive !== undefined ? input.isActive : input.is_active
  };
}

function paginationMeta(total, page, pageSize) {
  return {
    total,
    page,
    pageSize,
    totalPages: total === 0 ? 0 : Math.ceil(total / pageSize)
  };
}

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

  if (payload.variants !== undefined) {
    if (!Array.isArray(payload.variants)) {
      details.push({ path: 'variants', message: 'variants debe ser un array' });
    } else {
      payload.variants.forEach((variant, index) => {
        if (!variant || typeof variant !== 'object') {
          details.push({ path: `variants.${index}`, message: 'La modalidad no es válida' });
          return;
        }
        if (
          typeof variant.distanceKm !== 'number' ||
          !Number.isFinite(variant.distanceKm) ||
          variant.distanceKm <= 0
        ) {
          details.push({
            path: `variants.${index}.distanceKm`,
            message: 'distanceKm debe ser un número mayor que 0'
          });
        }
        if (
          typeof variant.elevationGain !== 'number' ||
          !Number.isFinite(variant.elevationGain) ||
          variant.elevationGain < 0
        ) {
          details.push({
            path: `variants.${index}.elevationGain`,
            message: 'elevationGain debe ser un número mayor o igual que 0'
          });
        }
        if (
          typeof variant.price !== 'number' ||
          !Number.isFinite(variant.price) ||
          variant.price < 0
        ) {
          details.push({
            path: `variants.${index}.price`,
            message: 'price debe ser un número mayor o igual que 0'
          });
        }
      });
    }
  }

  if (details.length) throw new AppError('Datos de negocio inválidos', 400, 'VALIDATION_ERROR', details);
  return payload;
}

function validateVariantsCount(variants) {
  if (!Array.isArray(variants) || variants.length < MIN_EVENT_VARIANTS) {
    throw new AppError('Datos de negocio inválidos', 400, 'VALIDATION_ERROR', [
      {
        path: 'variants',
        message: `El evento debe tener al menos ${MIN_EVENT_VARIANTS} modalidades`
      }
    ]);
  }
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

  async generateUniqueSku(name, excludeId) {
    if (!name || typeof name !== 'string') {
      throw new AppError('No se pudo generar el SKU', 400, 'INVALID_SKU');
    }
    let candidate = generateUniqueSku(name);
    if (!candidate) throw new AppError('No se pudo generar el SKU', 400, 'INVALID_SKU');
    let suffix = 2;
    while (await repository.existsBySku(candidate, excludeId)) {
      const base = candidate.replace(/-[A-Z0-9]+$/, '').replace(/-\d+$/, '');
      candidate = `${base}-${suffix}`;
      suffix += 1;
    }
    return candidate;
  }

  async list(query = {}) {
    try {
      const input = normalizeEventQuery(validateService(listQuerySchema, query));
      const page = input.page ?? DEFAULT_PAGE;
      const pageSize = input.pageSize ?? DEFAULT_PAGE_SIZE;

      const [categoryIds, hostIds, locationIds] = await Promise.all([
        input.categorySlug
          ? referenceRepository.findCategoryIdsBySlugs(input.categorySlug)
          : null,
        input.hostSlug
          ? referenceRepository.findHostIdsBySlugs(input.hostSlug)
          : null,
        input.locationSlug
          ? referenceRepository.findLocationIdsBySlugs(input.locationSlug)
          : null
      ]);

      const missingReference = (
        (input.categorySlug && categoryIds.length === 0) ||
        (input.hostSlug && hostIds.length === 0) ||
        (input.locationSlug && locationIds.length === 0)
      );

      if (missingReference) {
        return { data: [], pagination: paginationMeta(0, page, pageSize) };
      }

      const filters = buildMongoFilter(input, EVENT_FILTERS, {
        categoryIds,
        hostIds,
        locationIds
      });
      const { data, total } = await repository.findAll(filters, { page, pageSize });

      return { data, pagination: paginationMeta(total, page, pageSize) };
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
      let sku = input.sku;
      if (!sku) {
        sku = await this.generateUniqueSku(input.name);
      } else {
        sku = String(sku).toUpperCase().trim();
        let candidate = sku;
        let suffix = 2;
        while (await repository.existsBySku(candidate)) {
          candidate = `${sku.replace(/-\d+$/, '')}-${suffix}`;
          suffix += 1;
        }
        sku = candidate;
      }
      const payload = {
        ...input,
        slug,
        sku,
        isActive: input.isActive ?? true,
        status: input.status || 'draft',
        deleted_at: null
      };
      validateBusinessRules(payload);
      validateVariantsCount(payload.variants);
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

      if (payload.name) {
        payload.slug = await this.buildUniqueSlug(payload.name, id);
        payload.sku = await this.generateUniqueSku(payload.name, id);
      } else if (payload.slug) {
        payload.slug = await this.buildUniqueSlug(payload.slug, id);
      }

      if (payload.sku && !payload.name) {
        let sku = String(payload.sku).toUpperCase().trim();
        let candidate = sku;
        let suffix = 2;
        while (await repository.existsBySku(candidate, id)) {
          candidate = `${sku.replace(/-\d+$/, '')}-${suffix}`;
          suffix += 1;
        }
        payload.sku = candidate;
      }

      validateBusinessRules(payload);
      validateVariantsCount(payload.variants ?? existing.variants ?? []);

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
