import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ApiService } from './api.service';
import { ApiResponse } from '../models/api.model';
import { RouteFilters, TrailRoute, TrailRoutePayload } from '../models/trail-route.model';

function isRoute(data: TrailRoute): boolean {
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
export class TrailRouteService {
  private readonly api = inject(ApiService);

  list(filters: RouteFilters = {}): Observable<TrailRoute[]> {
    let params = new HttpParams();

    if (filters.difficulty) {
      params = params.set('difficulty', filters.difficulty);
    }
    if (filters.country) {
      params = params.set('country', filters.country);
    }
    if (filters.region) {
      params = params.set('region', filters.region);
    }
    if (filters.minDistance !== undefined) {
      params = params.set('minDistance', filters.minDistance);
    }
    if (filters.maxDistance !== undefined) {
      params = params.set('maxDistance', filters.maxDistance);
    }
    if (filters.status && filters.status !== 'all') {
      params = params.set('status', filters.status);
    }

    return this.api
      .get<ApiResponse<TrailRoute[]>>('routes', params)
      .pipe(map((response) => extractData<TrailRoute[]>(response, Array.isArray)));
  }

  getById(id: string): Observable<TrailRoute> {
    return this.api
      .get<ApiResponse<TrailRoute>>(`routes/${encodeURIComponent(id)}`)
      .pipe(map((response) => extractData<TrailRoute>(response, isRoute)));
  }

  create(payload: TrailRoutePayload): Observable<TrailRoute> {
    return this.api
      .post<ApiResponse<TrailRoute>>('routes', payload)
      .pipe(map((response) => extractData<TrailRoute>(response, isRoute)));
  }

  update(id: string, payload: Partial<TrailRoutePayload>): Observable<TrailRoute> {
    return this.api
      .put<ApiResponse<TrailRoute>>(`routes/${encodeURIComponent(id)}`, payload)
      .pipe(map((response) => extractData<TrailRoute>(response, isRoute)));
  }

  remove(id: string): Observable<TrailRoute> {
    return this.api
      .delete<ApiResponse<TrailRoute>>(`routes/${encodeURIComponent(id)}`)
      .pipe(map((response) => extractData<TrailRoute>(response, isRoute)));
  }

  setStatus(id: string, status: 'active' | 'inactive'): Observable<TrailRoute> {
    const action = status === 'active' ? 'activate' : 'deactivate';
    return this.api
      .patch<ApiResponse<TrailRoute>>(`routes/${encodeURIComponent(id)}/${action}`)
      .pipe(map((response) => extractData<TrailRoute>(response, isRoute)));
  }

  restore(id: string): Observable<TrailRoute> {
    return this.api
      .patch<ApiResponse<TrailRoute>>(`routes/${encodeURIComponent(id)}/restore`)
      .pipe(map((response) => extractData<TrailRoute>(response, isRoute)));
  }

  listDeleted(): Observable<TrailRoute[]> {
    return this.api
      .get<ApiResponse<TrailRoute[]>>('routes/deleted')
      .pipe(map((response) => extractData<TrailRoute[]>(response, Array.isArray)));
  }

  hardDelete(id: string): Observable<void> {
    return this.api
      .delete<ApiResponse<void>>(`routes/${encodeURIComponent(id)}/permanent`)
      .pipe(map(() => undefined));
  }
}
