jest.mock('../repositories/shop.repository', () => ({
  findPublishedEvents: jest.fn(),
  findImagesByEventIds: jest.fn(),
  findPublishedEventBySlug: jest.fn()
}));

jest.mock('../repositories/reference.repository', () => ({
  findCategoryIdsBySlugs: jest.fn(),
  findHostIdsBySlugs: jest.fn(),
  findLocationIdsBySlugs: jest.fn()
}));

jest.mock('./departure.service', () => ({
  getShopDeparturesByEventSlug: jest.fn()
}));

const shopRepository = require('../repositories/shop.repository');
const referenceRepository = require('../repositories/reference.repository');
const shopService = require('./shop.service');

function findSearchClause(filter) {
  const clauses = filter.$and ?? [filter];
  return clauses.find((clause) =>
    clause.$or?.some((item) => Object.prototype.hasOwnProperty.call(item, 'name'))
  );
}

describe('ShopService.getEvents', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    shopRepository.findPublishedEvents.mockResolvedValue({ data: [], total: 0 });
    shopRepository.findImagesByEventIds.mockResolvedValue([]);
    referenceRepository.findCategoryIdsBySlugs.mockResolvedValue([]);
    referenceRepository.findHostIdsBySlugs.mockResolvedValue([]);
    referenceRepository.findLocationIdsBySlugs.mockResolvedValue([]);
  });

  test('usa prefijo anclado sobre name y slug', async () => {
    await shopService.getEvents({ search: 't' });

    expect(shopRepository.findPublishedEvents).toHaveBeenCalledTimes(1);
    const [filter, options] = shopRepository.findPublishedEvents.mock.calls[0];
    const searchClause = findSearchClause(filter);

    expect(searchClause).toBeDefined();
    expect(searchClause.$or.map((item) => Object.keys(item))).toEqual([['name'], ['slug']]);
    expect(searchClause.$or[0].name.source).toBe('^t');
    expect(searchClause.$or[0].name.flags).toBe('i');
    expect(searchClause.$or[1].slug.source).toBe('^t');
    expect(options).toEqual({ page: 1, limit: 9, sort: { startDate: 1, _id: 1 } });
  });

  test('conserva filtros, orden y paginación al buscar por prefijo', async () => {
    referenceRepository.findCategoryIdsBySlugs.mockResolvedValue(['cat-1']);
    referenceRepository.findHostIdsBySlugs.mockResolvedValue(['host-1']);
    referenceRepository.findLocationIdsBySlugs.mockResolvedValue(['loc-1']);

    await shopService.getEvents({
      search: 'utm',
      categorySlug: 'utmb-world-series',
      hostSlug: 'utmb',
      locationSlug: 'chamonix',
      distanceSlug: 'ultra',
      minPrice: 100,
      maxPrice: 300,
      sort: 'price_desc',
      page: 2,
      limit: 12
    });

    expect(referenceRepository.findCategoryIdsBySlugs).toHaveBeenCalledWith(['utmb-world-series']);
    expect(referenceRepository.findHostIdsBySlugs).toHaveBeenCalledWith(['utmb']);
    expect(referenceRepository.findLocationIdsBySlugs).toHaveBeenCalledWith(['chamonix']);

    const [filter, options] = shopRepository.findPublishedEvents.mock.calls[0];
    const searchClause = findSearchClause(filter);

    expect(searchClause.$or[0].name.source).toBe('^utm');
    expect(filter.$and).toEqual(
      expect.arrayContaining([
        { categoryId: { $in: ['cat-1'] } },
        { hostId: { $in: ['host-1'] } },
        { locationId: { $in: ['loc-1'] } },
        {
          $or: [
            { distanceKm: { $gte: 42 } },
            { 'variants.distanceKm': { $gte: 42 } }
          ]
        },
        { price: { $gte: 100 } },
        { price: { $lte: 300 } }
      ])
    );
    expect(options).toEqual({ page: 2, limit: 12, sort: { price: -1, _id: 1 } });
  });

  test('rechaza parámetros desconocidos', async () => {
    await expect(shopService.getEvents({ q: 't' })).rejects.toMatchObject({
      statusCode: 400,
      code: 'VALIDATION_ERROR'
    });
    await expect(shopService.getEvents({ status: 'published' })).rejects.toMatchObject({
      statusCode: 400,
      code: 'VALIDATION_ERROR'
    });
  });
});
