import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ApiResponse } from '../models/api.model';
import {
  Activity,
  ActivityEstimate,
  ActivityEstimatePayload,
  ActivityFilters,
  ActivityListResponse,
  ActivityPayload,
  ActivityStats
} from '../models/activity.model';
import { ApiService } from './api.service';

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

function isActivity(data: Activity): boolean {
  return typeof data === 'object' && data !== null && typeof data.id === 'string';
}

function isActivityEstimate(data: ActivityEstimate): boolean {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof data.durationSec === 'number' &&
    typeof data.calories === 'number'
  );
}

function isActivityStats(data: ActivityStats): boolean {
  return typeof data === 'object' && data !== null && typeof data.activities === 'number';
}

function isActivityList(data: ActivityListResponse): boolean {
  return (
    typeof data === 'object' &&
    data !== null &&
    Array.isArray(data.items) &&
    typeof data.total === 'number'
  );
}

@Injectable({ providedIn: 'root' })
export class ActivityService {
  private readonly api = inject(ApiService);

  estimate(payload: ActivityEstimatePayload): Observable<ActivityEstimate> {
    let params = new HttpParams().set('distanceKm', payload.distanceKm);

    if (payload.elevationGainM !== undefined) {
      params = params.set('elevationGainM', payload.elevationGainM);
    }
    if (payload.paceMinPerKm !== undefined) {
      params = params.set('paceMinPerKm', payload.paceMinPerKm);
    }
    if (payload.weightKg !== undefined) {
      params = params.set('weightKg', payload.weightKg);
    }

    return this.api
      .getAi<ApiResponse<ActivityEstimate>>('agent/activities/estimate', params)
      .pipe(map((response) => extractData(response, isActivityEstimate)));
  }

  list(userId: string, filters: ActivityFilters = {}): Observable<ActivityListResponse> {
    let params = new HttpParams().set('userId', userId);

    if (filters.eventId) {
      params = params.set('eventId', filters.eventId);
    }
    if (filters.status) {
      params = params.set('status', filters.status);
    }
    if (filters.from) {
      params = params.set('from', filters.from);
    }
    if (filters.to) {
      params = params.set('to', filters.to);
    }
    if (filters.page !== undefined) {
      params = params.set('page', filters.page);
    }
    if (filters.limit !== undefined) {
      params = params.set('limit', filters.limit);
    }

    return this.api
      .getAi<ApiResponse<ActivityListResponse>>('agent/activities', params)
      .pipe(map((response) => extractData(response, isActivityList)));
  }

  stats(userId: string, eventId?: string): Observable<ActivityStats> {
    let params = new HttpParams().set('userId', userId);
    if (eventId) {
      params = params.set('eventId', eventId);
    }

    return this.api
      .getAi<ApiResponse<ActivityStats>>('agent/activities/stats', params)
      .pipe(map((response) => extractData(response, isActivityStats)));
  }

  create(userId: string, payload: ActivityPayload): Observable<Activity> {
    return this.api
      .postAi<ApiResponse<Activity>>('agent/activities', { userId, ...payload })
      .pipe(map((response) => extractData(response, isActivity)));
  }

  update(id: string, userId: string, payload: Partial<ActivityPayload>): Observable<Activity> {
    return this.api
      .patchAi<ApiResponse<Activity>>(`agent/activities/${encodeURIComponent(id)}`, {
        userId,
        ...payload
      })
      .pipe(map((response) => extractData(response, isActivity)));
  }

  remove(id: string, userId: string): Observable<void> {
    const params = new HttpParams().set('userId', userId);

    return this.api
      .deleteAi<null>(`agent/activities/${encodeURIComponent(id)}`, params)
      .pipe(map(() => undefined));
  }
}
