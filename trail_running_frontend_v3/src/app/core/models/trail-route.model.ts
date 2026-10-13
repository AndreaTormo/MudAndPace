export type Difficulty = 'easy' | 'moderate' | 'hard' | 'expert';

export type Surface = 'trail' | 'rock' | 'dirt' | 'gravel' | 'asphalt' | 'mixed';

export type RouteStatus = 'active' | 'inactive' | 'deleted';

export interface TrailLocation {
  country: string;
  region?: string;
  province?: string;
  municipality?: string;
}

export interface GeoPoint {
  type: 'Point';
  coordinates: [number, number];
}

export interface TrailRoute {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  location: TrailLocation;
  startPoint: GeoPoint;
  distanceKm: number;
  elevationGainM: number;
  elevationLossM?: number;
  difficulty?: Difficulty;
  surface?: Surface[];
  tags?: string[];
  imageUrl?: string;
  gpxUrl?: string;
  isActive: boolean;
  status: RouteStatus;
  isPublished: boolean;
  deleted_at?: string | null;
  created_At?: string;
  updated_at?: string;
}

export interface TrailRoutePayload {
  name: string;
  location: TrailLocation;
  startPoint: GeoPoint;
  distanceKm: number;
  elevationGainM: number;
  description?: string;
  elevationLossM?: number;
  difficulty?: Difficulty;
  surface?: Surface[];
  tags?: string[];
  imageUrl?: string;
  gpxUrl?: string;
  isPublished?: boolean;
}

export interface RouteFilters {
  difficulty?: Difficulty;
  country?: string;
  region?: string;
  minDistance?: number;
  maxDistance?: number;
  status?: 'active' | 'inactive' | 'all';
  isPublished?: boolean;
}

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

export const STATUS_LABELS: Record<RouteStatus, string> = {
  active: 'Activa',
  inactive: 'Inactiva',
  deleted: 'Borrada'
};
