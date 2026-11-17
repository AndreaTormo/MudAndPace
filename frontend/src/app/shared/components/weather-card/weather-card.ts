import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  untracked
} from '@angular/core';
import { EventLocation } from '../../../core/models/event.model';
import { WeatherDay } from '../../../core/models/weather.model';
import { WeatherStore } from '../../../core/stores/weather.store';
import { formatDateLong } from '../../utils/format.util';

type WeatherKind = 'sun' | 'cloud' | 'fog' | 'rain' | 'snow' | 'storm';

@Component({
  selector: 'app-weather-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="rounded-2xl border border-gray-200 bg-surface/80 p-5 backdrop-blur-sm">
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <h2 class="text-base font-semibold text-gray-900">Clima</h2>
          @if (locationLabel()) {
            <p class="truncate text-sm text-gray-500">{{ locationLabel() }}</p>
          }
        </div>
        @if (coordinates()) {
          @if (mode() === 'event-date') {
            <span class="badge shrink-0 bg-brand/10 text-brand">Día del evento</span>
          } @else {
            <span class="badge shrink-0 bg-gray-100 text-gray-600">Próximos 3 días</span>
          }
        }
      </div>

      @if (!coordinates()) {
        <p class="mt-3 text-sm text-gray-400">Clima no disponible para esta ubicación.</p>
      } @else if (loading()) {
        <div class="mt-4 space-y-2">
          <div class="h-20 animate-pulse rounded-xl bg-gray-100"></div>
          <div class="h-20 animate-pulse rounded-xl bg-gray-100"></div>
        </div>
      } @else if (error()) {
        <div class="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-700">
          <p>{{ error() }}</p>
          <button
            type="button"
            class="mt-2 text-sm font-semibold text-brand hover:underline"
            (click)="retry()"
          >
            Reintentar
          </button>
        </div>
      } @else {
        @if (forecast(); as weather) {
          @if (mode() === 'current' && eventDate() && availableFrom()) {
          <p class="mt-3 rounded-xl bg-brand/5 px-3 py-2 text-xs leading-relaxed text-gray-600">
            La previsión para el {{ formatDateLong(eventDate()!) }} estará disponible a partir del
            {{ formatDateLong(availableFrom()!) }}. Mientras tanto, estos son los próximos días en la
            ubicación.
          </p>
        }

        <div class="mt-4 space-y-3">
          @for (day of weather.days; track day.date) {
            <article class="rounded-xl border border-gray-100 bg-gradient-to-br from-gray-50 to-white p-4 dark:border-line dark:from-night2 dark:to-night">
              <div class="flex items-start justify-between gap-3">
                <div class="flex min-w-0 items-center gap-3">
                  <span class="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-brand shadow-sm dark:bg-night dark:text-accent">
                    @switch (weatherKind(day.code)) {
                      @case ('sun') {
                        <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                          <circle cx="12" cy="12" r="4" />
                          <path stroke-linecap="round" d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.66 6.34l1.41-1.41" />
                        </svg>
                      }
                      @case ('cloud') {
                        <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M7 18h10a4 4 0 0 0 .6-7.96A5.5 5.5 0 0 0 7.1 9.1 4.5 4.5 0 0 0 7 18z" />
                        </svg>
                      }
                      @case ('fog') {
                        <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                          <path stroke-linecap="round" d="M4 9h16M6 13h12M4 17h16" />
                        </svg>
                      }
                      @case ('rain') {
                        <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M7 15h10a4 4 0 0 0 .6-7.96A5.5 5.5 0 0 0 7.1 6.1 4.5 4.5 0 0 0 7 15z" />
                          <path stroke-linecap="round" d="M8 18l-1 2M12 18l-1 2M16 18l-1 2" />
                        </svg>
                      }
                      @case ('snow') {
                        <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M7 15h10a4 4 0 0 0 .6-7.96A5.5 5.5 0 0 0 7.1 6.1 4.5 4.5 0 0 0 7 15z" />
                          <path stroke-linecap="round" d="M8 18h.01M12 19h.01M16 18h.01M10 21h.01M14 21h.01" />
                        </svg>
                      }
                      @default {
                        <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M7 15h10a4 4 0 0 0 .6-7.96A5.5 5.5 0 0 0 7.1 6.1 4.5 4.5 0 0 0 7 15z" />
                          <path stroke-linecap="round" stroke-linejoin="round" d="M12 13l-2 4h2l-1 4 4-5h-2l1-3z" />
                        </svg>
                      }
                    }
                  </span>
                  <div class="min-w-0">
                    <p class="text-sm font-semibold text-gray-900">{{ dayLabel(day) }}</p>
                    <p class="truncate text-sm text-gray-500">{{ day.summary }}</p>
                  </div>
                </div>
                <div class="shrink-0 text-right">
                  <p class="text-lg font-semibold text-gray-900">{{ temperature(day.tempMax) }}</p>
                  <p class="text-xs text-gray-500">mín. {{ temperature(day.tempMin) }}</p>
                </div>
              </div>

              <dl class="mt-3 grid grid-cols-3 gap-2 text-xs">
                <div>
                  <dt class="text-gray-500">Lluvia</dt>
                  <dd class="font-medium text-gray-800">{{ precipProbability(day) }}</dd>
                </div>
                <div>
                  <dt class="text-gray-500">Viento</dt>
                  <dd class="font-medium text-gray-800">{{ wind(day.windMaxKmh) }}</dd>
                </div>
                <div>
                  <dt class="text-gray-500">UV</dt>
                  <dd class="font-medium text-gray-800">{{ uv(day.uvIndexMax) }}</dd>
                </div>
              </dl>

              @if (day.alerts.length) {
                <div class="mt-3 flex flex-wrap gap-1.5">
                  @for (alert of day.alerts; track alert) {
                    <span class="badge bg-amber-100 text-amber-800">{{ alert }}</span>
                  }
                </div>
              }
            </article>
          }
        </div>
        }
      }
    </section>
  `
})
export class WeatherCard {
  private readonly store = inject(WeatherStore);

  readonly location = input<EventLocation | null | undefined>(null);
  readonly date = input<string | undefined>(undefined);

  protected readonly forecast = this.store.forecast;
  protected readonly loading = this.store.loading;
  protected readonly error = this.store.error;
  protected readonly mode = this.store.mode;
  protected readonly eventDate = this.store.eventDate;
  protected readonly availableFrom = this.store.availableFrom;
  protected readonly formatDateLong = formatDateLong;

  protected readonly coordinates = computed(() => {
    const raw = this.location()?.coordinates;
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
  });

  protected readonly locationLabel = computed(() => {
    const location = this.location();
    if (!location) {
      return '';
    }
    return [location.name, location.city].filter((part): part is string => Boolean(part)).join(' · ');
  });

  private readonly loadWeather = effect(() => {
    const location = this.location();
    const date = this.date();
    untracked(() => this.store.load(location, date));
  }, { allowSignalWrites: true });

  protected retry(): void {
    this.store.load(this.location(), this.date());
  }

  protected dayLabel(day: WeatherDay): string {
    return formatDateLong(`${day.date}T00:00:00`);
  }

  protected temperature(value: number | null | undefined): string {
    return typeof value === 'number' && Number.isFinite(value)
      ? `${Math.round(value)}°C`
      : '-';
  }

  protected wind(value: number | null | undefined): string {
    return typeof value === 'number' && Number.isFinite(value)
      ? `${Math.round(value)} km/h`
      : '-';
  }

  protected uv(value: number | null | undefined): string {
    return typeof value === 'number' && Number.isFinite(value) ? value.toFixed(1) : '-';
  }

  protected precipProbability(day: WeatherDay): string {
    return typeof day.precipitationProbability === 'number'
      ? `${Math.round(day.precipitationProbability)}%`
      : '-';
  }

  protected weatherKind(code: number): WeatherKind {
    if (code >= 95) {
      return 'storm';
    }
    if (code >= 85) {
      return 'snow';
    }
    if (code >= 80) {
      return 'rain';
    }
    if (code >= 71) {
      return 'snow';
    }
    if (code >= 51) {
      return 'rain';
    }
    if (code >= 45) {
      return 'fog';
    }
    if (code >= 2) {
      return 'cloud';
    }
    return 'sun';
  }
}
