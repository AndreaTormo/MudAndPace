export type EventStatus = 'published' | 'draft';

export interface EventHost {
  _id: string;
  name: string;
  slug: string;
}

export interface EventCategory {
  _id: string;
  name: string;
  slug: string;
}

export interface EventLocation {
  _id: string;
  name: string;
  slug: string;
  city?: string;
}

export interface Event {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  hostId: string;
  categoryId: string;
  locationId: string;
  startDate: string;
  endDate: string;
  distanceKm: number;
  elevationGain: number;
  price: number;
  status: EventStatus;
  isActive: boolean;
  deleted_at?: string | null;
  created_At?: string;
  updated_at?: string;
  host?: EventHost;
  category?: EventCategory;
  location?: EventLocation;
}

export interface EventPayload {
  name: string;
  slug?: string;
  description?: string;
  hostId: string;
  categoryId: string;
  locationId: string;
  startDate: string;
  endDate: string;
  distanceKm: number;
  elevationGain: number;
  price: number;
  status?: EventStatus;
  isActive?: boolean;
}

export interface EventFilters {
  status?: 'published' | 'draft' | 'all';
  categoryId?: string;
  locationId?: string;
  hostId?: string;
  minDistance?: number;
  maxDistance?: number;
  fromDate?: string;
  toDate?: string;
}

export const STATUS_LABELS: Record<EventStatus, string> = {
  published: 'Publicado',
  draft: 'Borrador'
};
