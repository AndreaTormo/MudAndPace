export type EventStatus = 'published' | 'draft';

export type Difficulty = 'easy' | 'moderate' | 'hard' | 'expert';

export type Surface = 'trail' | 'rock' | 'dirt' | 'gravel' | 'asphalt' | 'mixed';

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
  coordinates?: [number, number] | null;
}

export interface EventImage {
  _id: string;
  eventId: string;
  url: string;
  filename: string;
  originalName?: string;
  mimeType?: string;
  size?: number;
  alt?: string;
  isCover: boolean;
  order: number;
  created_At?: string;
  updated_at?: string;
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
  elevationLossM?: number;
  difficulty?: Difficulty;
  surface?: Surface[];
  tags?: string[];
  gpxUrl?: string;
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
  elevationLossM?: number;
  difficulty?: Difficulty;
  surface?: Surface[];
  tags?: string[];
  gpxUrl?: string;
  price: number;
  status?: EventStatus;
  isActive?: boolean;
}

export interface EventEditPayload {
  name: string;
  description?: string;
  categoryId: string;
  locationId: string;
  distanceKm: number;
  elevationGain: number;
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

export interface EventFormValue {
  name: string;
  description: string;
  hostId: string;
  categoryId: string;
  locationId: string;
  startDate: string;
  endDate: string;
  distanceKm: number | null;
  elevationGain: number | null;
  price: number | null;
  status: EventStatus;
  isActive: boolean;
}

export const STATUS_LABELS: Record<EventStatus, string> = {
  published: 'Publicado',
  draft: 'Borrador'
};

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: 'Fácil',
  moderate: 'Moderado',
  hard: 'Difícil',
  expert: 'Experto'
};

export const SURFACE_LABELS: Record<Surface, string> = {
  trail: 'Trail',
  rock: 'Roca',
  dirt: 'Tierra',
  gravel: 'Grava',
  asphalt: 'Asfalto',
  mixed: 'Mixto'
};
