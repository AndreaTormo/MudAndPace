import { EventStatus } from './event.model';

export type DepartureStatus = 'scheduled' | 'full' | 'cancelled' | 'completed';

export interface DepartureEventSummary {
  _id?: string;
  name: string;
  slug: string;
  startDate: string;
  endDate: string;
  status: EventStatus;
  isActive: boolean;
}

export interface Departure {
  _id: string;
  eventId: string;
  slug: string;
  startDatetime: string;
  endDatetime: string;
  capacity: number;
  price: number;
  bookedParticipants: number;
  spotsLeft: number;
  status: DepartureStatus;
  isActive: boolean;
  deleted_at?: string | null;
  created_At?: string;
  updated_at?: string;
  event?: DepartureEventSummary;
}

export interface DeparturePayload {
  eventId?: string;
  startDatetime: string;
  endDatetime: string;
  capacity: number;
  price: number;
  bookedParticipants?: number;
  status?: DepartureStatus;
  isActive?: boolean;
}

export type DepartureUpdatePayload = Partial<DeparturePayload>;

export interface DepartureFilters {
  eventId?: string;
  status?: DepartureStatus;
  isActive?: boolean;
  fromDate?: string;
  toDate?: string;
}

export interface DepartureFormValue {
  eventId: string;
  startDatetime: string;
  endDatetime: string;
  capacity: number | null;
  price: number | null;
  bookedParticipants: number | null;
  status: DepartureStatus;
  isActive: boolean;
}

export interface DepartureStatusOption {
  value: DepartureStatus;
  label: string;
}

export const DEPARTURE_STATUS_LABELS: Record<DepartureStatus, string> = {
  scheduled: 'Programada',
  full: 'Completa',
  cancelled: 'Cancelada',
  completed: 'Completada'
};

export const DEPARTURE_STATUS_OPTIONS: DepartureStatusOption[] = [
  { value: 'scheduled', label: DEPARTURE_STATUS_LABELS.scheduled },
  { value: 'full', label: DEPARTURE_STATUS_LABELS.full },
  { value: 'cancelled', label: DEPARTURE_STATUS_LABELS.cancelled },
  { value: 'completed', label: DEPARTURE_STATUS_LABELS.completed }
];

export const DEFAULT_DEPARTURE_FILTERS: DepartureFilters = {};
