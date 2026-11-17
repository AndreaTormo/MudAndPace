export type ActivityStatus = 'planned' | 'completed';

export interface ActivityEstimated {
  time: boolean;
  calories: boolean;
}

export interface Activity {
  id: string;
  userId: string;
  eventId?: string;
  title: string;
  date: string;
  status: ActivityStatus;
  distanceKm: number;
  elevationGainM: number;
  durationSec: number;
  duration: string;
  paceMinPerKm: string;
  calories: number;
  estimated: ActivityEstimated;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ActivityEstimate {
  distanceKm: number;
  elevationGainM: number;
  kmEffort: number;
  durationSec: number;
  duration: string;
  durationRange: {
    minSec: number;
    maxSec: number;
    min: string;
    max: string;
  };
  calories: number;
  assumptions: {
    paceMinPerKm: string;
    weightKg: number;
  };
}

export interface ActivityStats {
  activities: number;
  totalDistanceKm: number;
  totalElevationGainM: number;
  totalDurationSec: number;
  totalDuration: string;
  totalCalories: number;
  avgPaceMinPerKm: string | null;
}

export interface ActivityListResponse {
  items: Activity[];
  page: number;
  limit: number;
  total: number;
}

export interface ActivityFilters {
  eventId?: string;
  status?: ActivityStatus;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

export interface ActivityEstimatePayload {
  distanceKm: number;
  elevationGainM?: number;
  paceMinPerKm?: string | number;
  weightKg?: number;
}

export interface ActivityPayload {
  title: string;
  date: string;
  status: ActivityStatus;
  distanceKm: number;
  elevationGainM?: number;
  duration?: string;
  calories?: number;
  notes?: string;
  eventId?: string;
}

export const ACTIVITY_STATUS_LABELS: Record<ActivityStatus, string> = {
  planned: 'Planificada',
  completed: 'Completada'
};

export const ACTIVITY_STATUS_OPTIONS: Array<{ value: ActivityStatus; label: string }> = [
  { value: 'completed', label: ACTIVITY_STATUS_LABELS.completed },
  { value: 'planned', label: ACTIVITY_STATUS_LABELS.planned }
];
