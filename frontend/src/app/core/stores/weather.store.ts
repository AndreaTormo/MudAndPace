import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { EventLocation } from '../models/event.model';
import { WeatherForecast, WeatherMode } from '../models/weather.model';
import { WeatherService } from '../services/weather.service';
import { toDateInputValue } from '../../shared/utils/format.util';

const FORECAST_WINDOW_DAYS = 15;
const FALLBACK_DAYS = 3;
const CACHE_MAX_ENTRIES = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

interface Coordinates {
  lat: number;
  lng: number;
}

function extractCoordinates(location: EventLocation | null | undefined): Coordinates | null {
  const raw = location?.coordinates;
  if (!Array.isArray(raw) || raw.length !== 2) {
    return null;
  }

  const [lng, lat] = raw;
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) {
    return null;
  }
  if (Math.abs(lng) > 180 || Math.abs(lat) > 90) {
    return null;
  }

  return { lat, lng };
}

function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function daysUntil(dateOnly: string): number | null {
  const target = new Date(`${dateOnly}T00:00:00`);
  if (Number.isNaN(target.getTime())) {
    return null;
  }
  return Math.round((target.getTime() - startOfDay(new Date()).getTime()) / DAY_MS);
}

function toDateOnly(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function subtractDays(dateOnly: string, days: number): string | null {
  const date = new Date(`${dateOnly}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  date.setDate(date.getDate() - days);
  return toDateOnly(date);
}

function buildKey(
  coordinates: Coordinates,
  mode: WeatherMode,
  date: string | undefined,
  days: number | undefined
): string {
  return `${coordinates.lat.toFixed(3)},${coordinates.lng.toFixed(3)}|${mode}|${date ?? ''}|${days ?? ''}`;
}

function errorCode(error: unknown): string | null {
  if (error instanceof HttpErrorResponse) {
    const body = error.error as { error?: { code?: string } } | null | undefined;
    return body?.error?.code ?? null;
  }
  return null;
}

@Injectable({ providedIn: 'root' })
export class WeatherStore {
  private readonly weatherService = inject(WeatherService);
  private readonly cache = new Map<string, WeatherForecast>();
  private currentKey = '';

  private readonly _forecast = signal<WeatherForecast | null>(null);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _mode = signal<WeatherMode>('current');
  private readonly _eventDate = signal<string | null>(null);
  private readonly _availableFrom = signal<string | null>(null);

  readonly forecast = this._forecast.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly mode = this._mode.asReadonly();
  readonly eventDate = this._eventDate.asReadonly();
  readonly availableFrom = this._availableFrom.asReadonly();
  readonly hasForecast = computed(() => this._forecast() !== null);

  load(location: EventLocation | null | undefined, date?: string): void {
    const coordinates = extractCoordinates(location);
    if (!coordinates) {
      this.reset();
      return;
    }

    const eventDate = date ? toDateInputValue(date) : '';
    const difference = eventDate ? daysUntil(eventDate) : null;
    const withinWindow = difference !== null && difference >= 0 && difference <= FORECAST_WINDOW_DAYS;

    if (withinWindow) {
      this.request(coordinates, 'event-date', eventDate, undefined, eventDate);
      return;
    }

    this.request(coordinates, 'current', undefined, FALLBACK_DAYS, eventDate || null);
  }

  reset(): void {
    this.currentKey = '';
    this._forecast.set(null);
    this._loading.set(false);
    this._error.set(null);
    this._mode.set('current');
    this._eventDate.set(null);
    this._availableFrom.set(null);
  }

  private request(
    coordinates: Coordinates,
    mode: WeatherMode,
    date: string | undefined,
    days: number | undefined,
    eventDate: string | null
  ): void {
    const cacheKey = buildKey(coordinates, mode, date, days);
    const requestKey = `${cacheKey}|${eventDate ?? ''}`;

    if (requestKey === this.currentKey && (this._loading() || this._forecast() !== null)) {
      return;
    }

    this.currentKey = requestKey;
    this._mode.set(mode);
    this._eventDate.set(eventDate);
    this._availableFrom.set(this.resolveAvailableFrom(mode, eventDate));

    const cached = this.cache.get(cacheKey);
    if (cached) {
      this._forecast.set(cached);
      this._loading.set(false);
      this._error.set(null);
      return;
    }

    this._forecast.set(null);
    this._error.set(null);
    this._loading.set(true);

    this.weatherService
      .getForecast({ latitude: coordinates.lat, longitude: coordinates.lng, date, days })
      .subscribe({
        next: (forecast) => {
          if (requestKey !== this.currentKey) {
            return;
          }
          this.cache.set(cacheKey, forecast);
          this.trimCache();
          this._forecast.set(forecast);
          this._loading.set(false);
          this._error.set(null);
        },
        error: (error: unknown) => {
          if (requestKey !== this.currentKey) {
            return;
          }
          if (date && errorCode(error) === 'WEATHER_DATE_OUT_OF_RANGE') {
            this.request(coordinates, 'current', undefined, FALLBACK_DAYS, eventDate);
            return;
          }
          this._loading.set(false);
          this._error.set('No se ha podido cargar el clima.');
        }
      });
  }

  private resolveAvailableFrom(mode: WeatherMode, eventDate: string | null): string | null {
    if (mode !== 'current' || !eventDate) {
      return null;
    }

    const difference = daysUntil(eventDate);
    if (difference === null || difference <= FORECAST_WINDOW_DAYS) {
      return null;
    }

    return subtractDays(eventDate, FORECAST_WINDOW_DAYS);
  }

  private trimCache(): void {
    while (this.cache.size > CACHE_MAX_ENTRIES) {
      const oldest = this.cache.keys().next().value;
      if (oldest === undefined) {
        return;
      }
      this.cache.delete(oldest);
    }
  }
}
