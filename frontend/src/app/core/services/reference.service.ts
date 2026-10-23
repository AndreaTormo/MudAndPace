import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from './api.service';
import { ApiResponse } from '../models/api.model';
import { EventCategory, EventHost, EventLocation } from '../models/event.model';

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
export class ReferenceService {
  private readonly api = inject(ApiService);

  categories(): Observable<EventCategory[]> {
    return this.api
      .get<ApiResponse<EventCategory[]>>('references/categories')
      .pipe(map((response) => extractData<EventCategory[]>(response, Array.isArray)));
  }

  locations(): Observable<EventLocation[]> {
    return this.api
      .get<ApiResponse<EventLocation[]>>('references/locations')
      .pipe(map((response) => extractData<EventLocation[]>(response, Array.isArray)));
  }

  hosts(): Observable<EventHost[]> {
    return this.api
      .get<ApiResponse<EventHost[]>>('references/hosts')
      .pipe(map((response) => extractData<EventHost[]>(response, Array.isArray)));
  }
}
