import { Params } from '@angular/router';
import {
  DEFAULT_SHOP_FILTERS,
  DEFAULT_SHOP_SORT,
  SHOP_MAX_PRICE,
  SHOP_MIN_PRICE,
  ShopDistanceSlug,
  ShopFilters,
  ShopSort
} from '../../../core/models/shop.model';

const DISTANCE_SLUGS = new Set<ShopDistanceSlug>(['corta', 'media', 'larga', 'ultra']);

const SORT_VALUES = new Set<ShopSort>([
  'date_asc',
  'date_desc',
  'price_asc',
  'price_desc',
  'distance_asc',
  'distance_desc',
  'name_asc'
]);

function toText(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : null;
}

function toPositiveInt(value: unknown): number | undefined {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : undefined;
}

function toDistanceSlug(value: unknown): ShopDistanceSlug | null {
  return typeof value === 'string' && DISTANCE_SLUGS.has(value as ShopDistanceSlug)
    ? (value as ShopDistanceSlug)
    : null;
}

function toSort(value: unknown): ShopSort {
  return typeof value === 'string' && SORT_VALUES.has(value as ShopSort)
    ? (value as ShopSort)
    : DEFAULT_SHOP_SORT;
}

function toPrice(value: unknown, fallback: number): number {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return fallback;
  }
  return Math.min(SHOP_MAX_PRICE, Math.max(SHOP_MIN_PRICE, number));
}

export function parseShopFilters(params: Params): ShopFilters {
  const minPrice = toPrice(params['minPrice'], SHOP_MIN_PRICE);
  const maxPrice = toPrice(params['maxPrice'], SHOP_MAX_PRICE);

  return {
    categorySlug: toText(params['categorySlug']),
    hostSlug: toText(params['hostSlug']),
    locationSlug: toText(params['locationSlug']),
    distanceSlug: toDistanceSlug(params['distanceSlug']),
    minPrice: Math.min(minPrice, maxPrice),
    maxPrice: Math.max(minPrice, maxPrice),
    search: toText(params['search']) ?? '',
    sort: toSort(params['sort']),
    page: toPositiveInt(params['page']) ?? 1,
    limit: toPositiveInt(params['limit']) ?? DEFAULT_SHOP_FILTERS.limit
  };
}

export function buildShopQueryParams(filters: ShopFilters): Record<string, string> {
  const params: Record<string, string> = {};

  if (filters.categorySlug) params['categorySlug'] = filters.categorySlug;
  if (filters.hostSlug) params['hostSlug'] = filters.hostSlug;
  if (filters.locationSlug) params['locationSlug'] = filters.locationSlug;
  if (filters.distanceSlug) params['distanceSlug'] = filters.distanceSlug;
  if (filters.search?.trim()) params['search'] = filters.search.trim();
  if ((filters.sort ?? DEFAULT_SHOP_SORT) !== DEFAULT_SHOP_SORT) {
    params['sort'] = filters.sort!;
  }

  const minPrice = filters.minPrice ?? SHOP_MIN_PRICE;
  const maxPrice = filters.maxPrice ?? SHOP_MAX_PRICE;
  if (minPrice > SHOP_MIN_PRICE) params['minPrice'] = String(minPrice);
  if (maxPrice < SHOP_MAX_PRICE) params['maxPrice'] = String(maxPrice);

  const page = filters.page ?? 1;
  if (page > 1) params['page'] = String(page);

  const limit = filters.limit ?? DEFAULT_SHOP_FILTERS.limit!;
  if (limit !== DEFAULT_SHOP_FILTERS.limit) params['limit'] = String(limit);

  return params;
}
