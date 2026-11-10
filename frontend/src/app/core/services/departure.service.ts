import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ApiService } from './api.service';
import { ApiResponse } from '../models/api.model';
import {
  Departure,
  DepartureFilters,
  DeparturePayload,
  DepartureUpdatePayload
} from '../models/departure.model';

function isDeparture(data: Departure): boolean {
  return typeof data === 'object' && data !== null && '_id' in data;
}

function extractData<T>(
  response: ApiResponse<T> | null | undefined,
  isValid: (data: T) => boolean
): T {
  const data = response?.data;
  if (data === undefined || data === null || !isValid(data)) {
    throw new Error('INVALID_RESPONSE');
  }
  return data;
}

function buildParams(filters: DepartureFilters, includeEventId: boolean): HttpParams {
  let params = new HttpParams();

  if (includeEventId && filters.eventId) {
    params = params.set('eventId', filters.eventId);
  }
  if (filters.status) {
    params = params.set('status', filters.status);
  }
  if (filters.isActive !== undefined) {
    params = params.set('isActive', String(filters.isActive));
  }
  if (filters.fromDate) {
    params = params.set('fromDate', filters.fromDate);
  }
  if (filters.toDate) {
    params = params.set('toDate', filters.toDate);
  }

  return params;
}

@Injectable({ providedIn: 'root' })
export class DepartureService {
  private readonly api = inject(ApiService);

  list(filters: DepartureFilters = {}): Observable<Departure[]> {
    return this.api
      .get<ApiResponse<Departure[]>>('departures', buildParams(filters, true))
      .pipe(map((response) => extractData<Departure[]>(response, Array.isArray)));
  }

  listByEvent(eventId: string, filters: DepartureFilters = {}): Observable<Departure[]> {
    return this.api
      .get<ApiResponse<Departure[]>>(
        `events/${encodeURIComponent(eventId)}/departures`,
        buildParams(filters, false)
      )
      .pipe(map((response) => extractData<Departure[]>(response, Array.isArray)));
  }

  getById(id: string): Observable<Departure> {
    return this.api
      .get<ApiResponse<Departure>>(`departures/${encodeURIComponent(id)}`)
      .pipe(map((response) => extractData<Departure>(response, isDeparture)));
  }

  create(payload: DeparturePayload): Observable<Departure> {
    return this.api
      .post<ApiResponse<Departure>>('departures', payload)
      .pipe(map((response) => extractData<Departure>(response, isDeparture)));
  }

  createForEvent(
    eventId: string,
    payload: Omit<DeparturePayload, 'eventId'>
  ): Observable<Departure> {
    return this.api
      .post<ApiResponse<Departure>>(
        `events/${encodeURIComponent(eventId)}/departures`,
        payload
      )
      .pipe(map((response) => extractData<Departure>(response, isDeparture)));
  }

  update(id: string, payload: DepartureUpdatePayload): Observable<Departure> {
    return this.api
      .patch<ApiResponse<Departure>>(`departures/${encodeURIComponent(id)}`, payload)
      .pipe(map((response) => extractData<Departure>(response, isDeparture)));
  }

  setActivation(id: string, isActive: boolean): Observable<Departure> {
    return this.api
      .patch<ApiResponse<Departure>>(`departures/${encodeURIComponent(id)}/activation`, {
        isActive
      })
      .pipe(map((response) => extractData<Departure>(response, isDeparture)));
  }

  remove(id: string): Observable<Departure> {
    return this.api
      .delete<ApiResponse<Departure>>(`departures/${encodeURIComponent(id)}`)
      .pipe(map((response) => extractData<Departure>(response, isDeparture)));
  }

  restore(id: string): Observable<Departure> {
    return this.api
      .patch<ApiResponse<Departure>>(`departures/${encodeURIComponent(id)}/restore`)
      .pipe(map((response) => extractData<Departure>(response, isDeparture)));
  }

  listDeleted(): Observable<Departure[]> {
    return this.api
      .get<ApiResponse<Departure[]>>('departures/deleted')
      .pipe(map((response) => extractData<Departure[]>(response, Array.isArray)));
  }

  hardDelete(id: string): Observable<void> {
    return this.api
      .delete<ApiResponse<void>>(`departures/${encodeURIComponent(id)}/permanent`)
      .pipe(map(() => undefined));
  }
}
