import {
  Event,
  EventCategory,
  EventHost,
  EventImage,
  EventLocation
} from './event.model';

export type ShopDistanceSlug = 'corta' | 'media' | 'larga' | 'ultra';

export interface ShopFilters {
  categorySlug?: string | null;
  hostSlug?: string | null;
  locationSlug?: string | null;
  distanceSlug?: ShopDistanceSlug | null;
  search?: string;
  page?: number;
  limit?: number;
}

export interface ShopEvent extends Event {
  images?: EventImage[];
}

export interface ShopPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

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

export const SHOP_DEFAULT_LIMIT = 9;

export const DEFAULT_SHOP_FILTERS: ShopFilters = {
  categorySlug: null,
  hostSlug: null,
  locationSlug: null,
  distanceSlug: null,
  search: '',
  page: 1,
  limit: SHOP_DEFAULT_LIMIT
};

export const SHOP_DISTANCE_OPTIONS: ShopDistanceOption[] = [
  { value: 'corta', label: 'Corta', description: 'Menos de 10 km' },
  { value: 'media', label: 'Media', description: 'Entre 10 y 21 km' },
  { value: 'larga', label: 'Larga', description: 'Entre 21 y 42 km' },
  { value: 'ultra', label: 'Ultra', description: '42 km o más' }
];
