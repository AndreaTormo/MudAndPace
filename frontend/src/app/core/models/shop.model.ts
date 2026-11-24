import {
  Event,
  EventCategory,
  EventHost,
  EventImage,
  EventLocation
} from './event.model';
import { PaginationMeta } from './pagination.model';
import { RatingSummary } from './rating.model';

export type ShopDistanceSlug = 'corta' | 'media' | 'larga' | 'ultra';

export type ShopSort =
  | 'date_asc'
  | 'date_desc'
  | 'price_asc'
  | 'price_desc'
  | 'distance_asc'
  | 'distance_desc'
  | 'name_asc';

export interface ShopFilters {
  categorySlug?: string | null;
  hostSlug?: string | null;
  locationSlug?: string | null;
  distanceSlug?: ShopDistanceSlug | null;
  minPrice?: number | null;
  maxPrice?: number | null;
  search?: string;
  sort?: ShopSort;
  page?: number;
  limit?: number;
}

export interface ShopEvent extends Event {
  images?: EventImage[];
  rating?: RatingSummary;
}

export type ShopPagination = PaginationMeta;

export interface ShopEventsResponse {
  success: boolean;
  message: string;
  data: ShopEvent[];
  pagination: ShopPagination;
}

export interface ShopCatalogue {
  categories: EventCategory[];
  hosts: EventHost[];
  locations: EventLocation[];
}

export interface ShopDistanceOption {
  value: ShopDistanceSlug;
  label: string;
  description: string;
}

export interface ShopSortOption {
  value: ShopSort;
  label: string;
}

export const SHOP_DEFAULT_LIMIT = 9;

export const DEFAULT_SHOP_SORT: ShopSort = 'date_asc';

export const SHOP_MIN_PRICE = 0;
export const SHOP_MAX_PRICE = 400;
export const SHOP_PRICE_STEP = 5;

export const DEFAULT_SHOP_FILTERS: ShopFilters = {
  categorySlug: null,
  hostSlug: null,
  locationSlug: null,
  distanceSlug: null,
  minPrice: SHOP_MIN_PRICE,
  maxPrice: SHOP_MAX_PRICE,
  search: '',
  sort: DEFAULT_SHOP_SORT,
  page: 1,
  limit: SHOP_DEFAULT_LIMIT
};

export const SHOP_DISTANCE_OPTIONS: ShopDistanceOption[] = [
  { value: 'corta', label: 'Corta', description: 'Menos de 10 km' },
  { value: 'media', label: 'Media', description: 'Entre 10 y 21 km' },
  { value: 'larga', label: 'Larga', description: 'Entre 21 y 42 km' },
  { value: 'ultra', label: 'Ultra', description: '42 km o más' }
];

export const SHOP_SORT_OPTIONS: ShopSortOption[] = [
  { value: 'date_asc', label: 'Fecha: próximos primero' },
  { value: 'date_desc', label: 'Fecha: más lejanos primero' },
  { value: 'price_asc', label: 'Precio: menor a mayor' },
  { value: 'price_desc', label: 'Precio: mayor a menor' },
  { value: 'distance_asc', label: 'Distancia: menor a mayor' },
  { value: 'distance_desc', label: 'Distancia: mayor a menor' },
  { value: 'name_asc', label: 'Nombre: A-Z' }
];
