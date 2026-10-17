import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ApiService } from './api.service';
import { ApiResponse } from '../models/api.model';
import { Event, EventFilters, EventPayload } from '../models/event.model';

function isEvent(data: Event): boolean {
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

@Injectable({ providedIn: 'root' })
export class EventService {
  private readonly api = inject(ApiService);

  list(filters: EventFilters = {}): Observable<Event[]> {
    let params = new HttpParams();

    if (filters.status && filters.status !== 'all') {
      params = params.set('status', filters.status);
    }
    if (filters.categoryId) {
      params = params.set('categoryId', filters.categoryId);
    }
    if (filters.locationId) {
      params = params.set('locationId', filters.locationId);
    }
    if (filters.hostId) {
      params = params.set('hostId', filters.hostId);
    }
    if (filters.minDistance !== undefined) {
      params = params.set('minDistance', filters.minDistance);
    }
    if (filters.maxDistance !== undefined) {
      params = params.set('maxDistance', filters.maxDistance);
    }
    if (filters.fromDate) {
      params = params.set('fromDate', filters.fromDate);
    }
    if (filters.toDate) {
      params = params.set('toDate', filters.toDate);
    }

    return this.api
      .get<ApiResponse<Event[]>>('events', params)
      .pipe(map((response) => extractData<Event[]>(response, Array.isArray)));
  }

  getById(id: string): Observable<Event> {
    return this.api
      .get<ApiResponse<Event>>(`events/${encodeURIComponent(id)}`)
      .pipe(map((response) => extractData<Event>(response, isEvent)));
  }

  getBySlug(slug: string): Observable<Event> {
    return this.api
      .get<ApiResponse<Event>>(`events/slug/${encodeURIComponent(slug)}`)
      .pipe(map((response) => extractData<Event>(response, isEvent)));
  }

  create(payload: EventPayload): Observable<Event> {
    return this.api
      .post<ApiResponse<Event>>('events', payload)
      .pipe(map((response) => extractData<Event>(response, isEvent)));
  }

  update(id: string, payload: Partial<EventPayload>): Observable<Event> {
    return this.api
      .put<ApiResponse<Event>>(`events/${encodeURIComponent(id)}`, payload)
      .pipe(map((response) => extractData<Event>(response, isEvent)));
  }

  remove(id: string): Observable<Event> {
    return this.api
      .delete<ApiResponse<Event>>(`events/${encodeURIComponent(id)}`)
      .pipe(map((response) => extractData<Event>(response, isEvent)));
  }

  publish(id: string): Observable<Event> {
    return this.api
      .patch<ApiResponse<Event>>(`events/${encodeURIComponent(id)}/publish`)
      .pipe(map((response) => extractData<Event>(response, isEvent)));
  }

  unpublish(id: string): Observable<Event> {
    return this.api
      .patch<ApiResponse<Event>>(`events/${encodeURIComponent(id)}/unpublish`)
      .pipe(map((response) => extractData<Event>(response, isEvent)));
  }

  restore(id: string): Observable<Event> {
    return this.api
      .patch<ApiResponse<Event>>(`events/${encodeURIComponent(id)}/restore`)
      .pipe(map((response) => extractData<Event>(response, isEvent)));
  }

  listDeleted(): Observable<Event[]> {
    return this.api
      .get<ApiResponse<Event[]>>('events/deleted')
      .pipe(map((response) => extractData<Event[]>(response, Array.isArray)));
  }

  hardDelete(id: string): Observable<void> {
    return this.api
      .delete<ApiResponse<void>>(`events/${encodeURIComponent(id)}/permanent`)
      .pipe(map(() => undefined));
  }
}
