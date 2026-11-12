import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable, forkJoin, map } from 'rxjs';
import { ApiService } from './api.service';
import { ApiResponse } from '../models/api.model';
import {
  EventCategory,
  EventHost,
  EventLocation
} from '../models/event.model';
import { Departure } from '../models/departure.model';
import {
  SHOP_MAX_PRICE,
  SHOP_MIN_PRICE,
  ShopCatalogue,
  ShopEvent,
  ShopEventsResponse,
  ShopFilters
} from '../models/shop.model';

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

function isShopEvent(data: ShopEvent): boolean {
  return typeof data === 'object' && data !== null && '_id' in data;
}

function extractEvents(
  response: ShopEventsResponse | null | undefined
): ShopEventsResponse {
  if (
    !response ||
    !Array.isArray(response.data) ||
    !response.pagination ||
    typeof response.pagination.total !== 'number'
  ) {
    throw new Error('INVALID_RESPONSE');
  }
  return response;
}

@Injectable({ providedIn: 'root' })
export class ShopService {
  private readonly api = inject(ApiService);

  listExperiences(filters: ShopFilters = {}): Observable<ShopEventsResponse> {
    let params = new HttpParams();

    if (filters.categorySlug) {
      params = params.set('categorySlug', filters.categorySlug);
    }
    if (filters.hostSlug) {
      params = params.set('hostSlug', filters.hostSlug);
    }
    if (filters.locationSlug) {
      params = params.set('locationSlug', filters.locationSlug);
    }
    if (filters.distanceSlug) {
      params = params.set('distanceSlug', filters.distanceSlug);
    }
    if (filters.minPrice !== undefined && filters.minPrice !== null && filters.minPrice > SHOP_MIN_PRICE) {
      params = params.set('minPrice', filters.minPrice);
    }
    if (filters.maxPrice !== undefined && filters.maxPrice !== null && filters.maxPrice < SHOP_MAX_PRICE) {
      params = params.set('maxPrice', filters.maxPrice);
    }
    if (filters.search?.trim()) {
      params = params.set('search', filters.search.trim());
    }
    if (filters.page !== undefined) {
      params = params.set('page', filters.page);
    }
    if (filters.limit !== undefined) {
      params = params.set('limit', filters.limit);
    }

    return this.api
      .get<ShopEventsResponse>('shop/events', params)
      .pipe(map((response) => extractEvents(response)));
  }

  listEvents(filters: ShopFilters = {}): Observable<ShopEventsResponse> {
    return this.listExperiences(filters);
  }

  getFeaturedEvents(limit = 6): Observable<ShopEvent[]> {
    return this.listExperiences({ page: 1, limit }).pipe(
      map((response) => response.data)
    );
  }

  getExperienceBySlug(slug: string): Observable<ShopEvent> {
    return this.api
      .get<ApiResponse<ShopEvent>>(`shop/events/${encodeURIComponent(slug)}`)
      .pipe(map((response) => extractData<ShopEvent>(response, isShopEvent)));
  }

  getEventBySlug(slug: string): Observable<ShopEvent> {
    return this.getExperienceBySlug(slug);
  }

  listDeparturesByExperienceSlug(slug: string): Observable<Departure[]> {
    return this.api
      .get<ApiResponse<Departure[]>>(
        `shop/events/${encodeURIComponent(slug)}/departures`
      )
      .pipe(map((response) => extractData<Departure[]>(response, Array.isArray)));
  }

  listDeparturesByEventSlug(slug: string): Observable<Departure[]> {
    return this.listDeparturesByExperienceSlug(slug);
  }

  getCatalogue(): Observable<ShopCatalogue> {
    return forkJoin({
      categories: this.api.get<ApiResponse<EventCategory[]>>('shop/categories'),
      hosts: this.api.get<ApiResponse<EventHost[]>>('shop/hosts'),
      locations: this.api.get<ApiResponse<EventLocation[]>>('shop/locations')
    }).pipe(
      map((response) => ({
        categories: extractData<EventCategory[]>(response.categories, Array.isArray),
        hosts: extractData<EventHost[]>(response.hosts, Array.isArray),
        locations: extractData<EventLocation[]>(response.locations, Array.isArray)
      }))
    );
  }
}
