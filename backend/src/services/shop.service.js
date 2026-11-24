const repository = require('../repositories/shop.repository');
const referenceRepository = require('../repositories/reference.repository');
const departureService = require('./departure.service');
const ratingService = require('./rating.service');
const { AppError, normalizeAppError } = require('../utils/appError');
const { validateService } = require('../utils/validation');
const { combineClauses, mergeValues, prefixRegexOr } = require('../utils/queryBuilder');
const { slugSchema } = require('../validators/event.validator');
const { shopListQuerySchema } = require('../validators/shop.validator');

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 9;
const MAX_LIMIT = 100;
const DEFAULT_SORT = 'date_asc';

const SORT_OPTIONS = {
  date_asc: { startDate: 1, _id: 1 },
  date_desc: { startDate: -1, _id: 1 },
  price_asc: { price: 1, _id: 1 },
  price_desc: { price: -1, _id: 1 },
  distance_asc: { distanceKm: 1, _id: 1 },
  distance_desc: { distanceKm: -1, _id: 1 },
  name_asc: { name: 1, _id: 1 }
};

const DISTANCE_RANGES = {
  corta: { $lt: 10 },
  media: { $gte: 10, $lt: 21 },
  larga: { $gte: 21, $lt: 42 },
  ultra: { $gte: 42 }
};

function normalizeShopQuery(input) {
  return {
    ...input,
    categorySlug: mergeValues(input.categorySlug, input.category_slug),
    hostSlug: mergeValues(input.hostSlug, input.host_slug),
    locationSlug: mergeValues(input.locationSlug, input.location_slug),
    distanceSlug: input.distanceSlug ?? input.distance_slug,
    limit: input.limit ?? input.pageSize
  };
}

function paginationMeta(total, page, limit) {
  return {
    total,
    page,
    limit,
    totalPages: total === 0 ? 0 : Math.ceil(total / limit)
  };
}

function distanceClause(slug) {
  const range = DISTANCE_RANGES[slug];
  if (!range) {
    return null;
  }

  return {
    $or: [
      { distanceKm: range },
      { 'variants.distanceKm': range }
    ]
  };
}

function partialSearchClause(value) {
  return prefixRegexOr(['name', 'slug'], value);
}

function groupImages(images = []) {
  const byEvent = new Map();

  for (const image of images) {
    const key = String(image.eventId);
    const list = byEvent.get(key) ?? [];
    list.push(image);
    byEvent.set(key, list);
  }

  return byEvent;
}

function serializeEvent(event, imagesByEvent, rating = null) {
  const plain = typeof event.toObject === 'function'
    ? event.toObject({ virtuals: true })
    : event;

  return {
    ...plain,
    images: imagesByEvent.get(String(plain._id)) ?? [],
    rating: rating ?? { average: null, total: 0, mine: null }
  };
}

class ShopService {
  async getCategories() {
    return repository.findActiveCategories();
  }

  async getHosts() {
    return repository.findActiveHosts();
  }

  async getLocations() {
    return repository.findActiveLocations();
  }

  async getEvents(rawQuery = {}, actor = {}) {
    try {
      const input = normalizeShopQuery(validateService(shopListQuerySchema, rawQuery));
      const page = input.page ?? DEFAULT_PAGE;
      const limit = Math.min(MAX_LIMIT, input.limit ?? DEFAULT_LIMIT);
      const sort = SORT_OPTIONS[input.sort ?? DEFAULT_SORT] ?? SORT_OPTIONS[DEFAULT_SORT];

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
        return { data: [], pagination: paginationMeta(0, page, limit) };
      }

      const clauses = [];
      if (input.categorySlug) clauses.push({ categoryId: { $in: categoryIds } });
      if (input.hostSlug) clauses.push({ hostId: { $in: hostIds } });
      if (input.locationSlug) clauses.push({ locationId: { $in: locationIds } });
      if (input.distanceSlug) clauses.push(distanceClause(input.distanceSlug));
      if (input.minPrice !== undefined) clauses.push({ price: { $gte: input.minPrice } });
      if (input.maxPrice !== undefined) clauses.push({ price: { $lte: input.maxPrice } });
      if (input.search) clauses.push(partialSearchClause(input.search));

      const { data, total } = await repository.findPublishedEvents(
        combineClauses(clauses),
        { page, limit, sort }
      );

      const eventIds = data.map((event) => event._id);
      const [images, ratings] = await Promise.all([
        repository.findImagesByEventIds(eventIds),
        ratingService.getSummariesForEvents(eventIds, actor)
      ]);
      const imagesByEvent = groupImages(images);

      return {
        data: data.map((event) =>
          serializeEvent(event, imagesByEvent, ratings.get(String(event._id)))
        ),
        pagination: paginationMeta(total, page, limit)
      };
    } catch (error) {
      throw normalizeAppError(error);
    }
  }

  async getEventBySlug(rawSlug, actor = {}) {
    try {
      const slug = validateService(slugSchema, rawSlug);
      const event = await repository.findPublishedEventBySlug(slug);

      if (!event) {
        throw new AppError('Evento no encontrado', 404, 'EVENT_NOT_FOUND');
      }

      const [images, ratings] = await Promise.all([
        repository.findImagesByEventIds([event._id]),
        ratingService.getSummariesForEvents([event._id], actor)
      ]);
      return serializeEvent(event, groupImages(images), ratings.get(String(event._id)));
    } catch (error) {
      throw normalizeAppError(error);
    }
  }

  async getDeparturesByEventSlug(rawSlug, actor = {}) {
    return departureService.getShopDeparturesByEventSlug(rawSlug, actor);
  }
}

module.exports = new ShopService();
