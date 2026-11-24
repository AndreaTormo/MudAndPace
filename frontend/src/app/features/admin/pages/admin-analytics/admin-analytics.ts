import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { SentimentLabel } from '../../../../core/models/aiAnalysis.model';
import { Departure } from '../../../../core/models/departure.model';
import { Event as EventItem } from '../../../../core/models/event.model';
import { DepartureService } from '../../../../core/services/departure.service';
import { EventService } from '../../../../core/services/event.service';
import { SentimentQuery } from '../../../../core/services/aiAnalysis.service';
import { AdminSentimentStore } from '../../../../core/stores/adminSentiment.store';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state';
import { ErrorState } from '../../../../shared/components/error-state/error-state';
import { SkeletonLoader } from '../../../../shared/components/skeleton-loader/skeleton-loader';
import { AdminSentimentRanking } from '../../components/admin-sentiment-ranking/admin-sentiment-ranking';

@Component({
  selector: 'app-admin-analytics',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [AdminSentimentStore],
  imports: [RouterLink, EmptyState, ErrorState, SkeletonLoader, AdminSentimentRanking],
  template: `
    <div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div class="mb-8">
        <nav class="mb-4 flex flex-wrap items-center gap-2 text-sm text-gray-500">
          <a routerLink="/events" class="hover:text-gray-800 hover:underline">Eventos</a>
          <span>/</span>
          <span>Administración</span>
          <span>/</span>
          <span class="font-medium text-gray-800">Análisis de sentimiento</span>
        </nav>
        <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 class="text-2xl font-semibold text-gray-900">Análisis de sentimiento</h1>
            <p class="mt-0.5 text-sm text-gray-500">
              Revisa la opinión global, por salida y por evento a partir de los comentarios publicados.
            </p>
          </div>
          <span class="badge bg-brand/10 text-brand">Administración</span>
        </div>
      </div>

      <section class="glass-panel mb-6 rounded-2xl p-4" aria-label="Filtros del análisis">
        <div class="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:items-end">
          <fieldset class="min-w-0 lg:col-span-3">
            <legend class="form-label mb-2">Ámbito</legend>
            <div role="group" aria-label="Ámbito del análisis" class="flex flex-wrap gap-2">
              @for (option of scopeOptions; track option.value) {
                <button
                  type="button"
                  [class]="scopeChipClass(option.value)"
                  [attr.aria-pressed]="scope() === option.value"
                  [disabled]="store.loading()"
                  (click)="onScopeChange(option.value)"
                >
                  {{ option.label }}
                </button>
              }
            </div>
          </fieldset>

          @if (scope() === 'departure') {
            <div class="min-w-0 lg:col-span-4">
              <label class="form-label mb-1 block" for="analytics-event">Evento de la salida</label>
              <select
                id="analytics-event"
                class="form-input w-full"
                [value]="selectedEventId()"
                [disabled]="store.loading()"
                (change)="onEventChange($event)"
              >
                <option value="">Selecciona un evento</option>
                @for (event of events(); track event._id) {
                  <option [value]="event._id">{{ eventLabel(event) }}</option>
                }
              </select>
            </div>
            <div class="min-w-0 lg:col-span-3">
              <label class="form-label mb-1 block" for="analytics-departure">Salida</label>
              <select
                id="analytics-departure"
                class="form-input w-full"
                [value]="selectedDepartureId()"
                [disabled]="store.loading() || departuresLoading() || !selectedEventId()"
                (change)="onDepartureChange($event)"
              >
                <option value="">Selecciona una salida</option>
                @if (departuresLoading()) {
                  <option value="" disabled>Cargando salidas…</option>
                } @else {
                  @for (departure of departures(); track departure._id) {
                    <option [value]="departure._id">{{ departureLabel(departure) }}</option>
                  }
                  @if (!departures().length && selectedEventId()) {
                    <option value="" disabled>No hay salidas para este evento</option>
                  }
                }
              </select>
            </div>
          } @else if (scope() === 'event') {
            <div class="min-w-0 lg:col-span-7">
              <label class="form-label mb-1 block" for="analytics-event-only">Evento</label>
              <select
                id="analytics-event-only"
                class="form-input w-full"
                [value]="selectedEventId()"
                [disabled]="store.loading()"
                (change)="onEventChange($event)"
              >
                <option value="">Selecciona un evento</option>
                @for (event of events(); track event._id) {
                  <option [value]="event._id">{{ eventLabel(event) }}</option>
                }
              </select>
            </div>
          } @else {
            <p class="self-center text-xs text-gray-500 lg:col-span-7">
              El análisis global reúne los comentarios y valoraciones de todas las salidas.
            </p>
          }

          <div class="flex flex-wrap items-center gap-3 lg:col-span-2 lg:justify-end">
            <label class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <input
                type="checkbox"
                class="h-4 w-4 accent-brand"
                [checked]="store.includeDeleted()"
                [disabled]="store.loading()"
                (change)="onIncludeDeletedChange($event)"
              />
              Incluir borrados
            </label>
            <button type="button" class="button-primary w-full sm:w-auto" [disabled]="store.loading()" (click)="load()">
              {{ store.loading() ? 'Analizando…' : 'Actualizar' }}
            </button>
            <button type="button" class="button-secondary w-full sm:w-auto" [disabled]="store.loading()" (click)="clearFilters()">
              Limpiar
            </button>
          </div>
        </div>
        @if (filterError()) {
          <p class="form-error mt-3" role="alert">{{ filterError() }}</p>
        }
      </section>

      @if (store.loading()) {
        <app-skeleton-loader [count]="4" />
      } @else if (store.error()) {
        <app-error-state [message]="store.error()!" (retry)="load()" />
      } @else if (store.report().state === 'no_data') {
        <app-empty-state
          title="No hay comentarios para analizar"
          message="Cuando haya comentarios publicados aparecerá aquí el análisis de sentimiento."
        >
          <button type="button" class="button-secondary" (click)="load()">Volver a intentar</button>
        </app-empty-state>
      } @else {
        <div class="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div class="glass-panel rounded-2xl p-4">
            <p class="text-xs font-semibold uppercase tracking-wider text-gray-400">Comentarios</p>
            <p class="mt-2 text-2xl font-semibold text-gray-900">{{ store.report().total }}</p>
          </div>
          <div class="glass-panel rounded-2xl p-4">
            <p class="text-xs font-semibold uppercase tracking-wider text-gray-400">Puntuación</p>
            <p class="mt-2 text-2xl font-semibold" [class]="scoreClass(store.report().score)">
              {{ store.report().score }} / 100
            </p>
          </div>
          <div class="glass-panel rounded-2xl p-4">
            <p class="text-xs font-semibold uppercase tracking-wider text-gray-400">Ámbito</p>
            <p class="mt-2 truncate text-lg font-semibold text-gray-900">{{ store.report().target.name }}</p>
            @if (store.report().target.variant) {
              <p class="mt-1 truncate text-xs font-semibold text-brand">{{ store.report().target.variant }}</p>
            }
          </div>
          <div class="glass-panel rounded-2xl p-4">
            <p class="text-xs font-semibold uppercase tracking-wider text-gray-400">Generado</p>
            <p class="mt-2 text-sm text-gray-700">{{ generatedLabel() }}</p>
            <p class="mt-1 text-xs text-gray-400">{{ store.report().model }}</p>
          </div>
        </div>

        <div class="grid gap-6 lg:grid-cols-2">
          <section class="glass-panel rounded-2xl p-5">
            <h2 class="text-sm font-semibold text-gray-900">Distribución</h2>
            <div class="mt-4 space-y-3">
              @for (row of sentimentRows; track row.key) {
                <div>
                  <div class="flex justify-between text-xs text-gray-600">
                    <span>{{ row.label }}</span>
                    <span>{{ store.report().distribution[row.key].count }} · {{ store.report().distribution[row.key].percentage }}%</span>
                  </div>
                  <div class="mt-1 h-2 overflow-hidden rounded-full bg-gray-200">
                    <div
                      class="h-full rounded-full"
                      [class]="row.color"
                      [style.width.%]="store.report().distribution[row.key].percentage"
                    ></div>
                  </div>
                </div>
              }
            </div>
          </section>

          <section class="glass-panel rounded-2xl p-5">
            <h2 class="text-sm font-semibold text-gray-900">Temas más mencionados</h2>
            @if (store.report().topThemes.length === 0) {
              <p class="mt-3 text-sm text-gray-500">No se han detectado temas recurrentes.</p>
            } @else {
              <div class="mt-4 flex flex-wrap gap-2">
                @for (theme of store.report().topThemes; track theme.theme) {
                  <span class="badge bg-brand/10 text-brand">{{ theme.theme }} · {{ theme.count }}</span>
                }
              </div>
            }
            @if (store.report().trendSummary) {
              <p class="mt-4 rounded-xl bg-gray-50 p-3 text-sm text-gray-600 dark:bg-night2 dark:text-gray-800">
                {{ store.report().trendSummary }}
              </p>
            }
          </section>
        </div>

        <section class="glass-panel mt-6 rounded-2xl p-5">
          <div class="flex flex-wrap items-baseline justify-between gap-2">
            <h2 class="text-sm font-semibold text-gray-900">Valoraciones y opiniones</h2>
            <p class="text-sm text-gray-500">
              {{ store.report().ratings.total }} valoraciones · media
              {{ store.report().ratings.average ?? '—' }} / 5
            </p>
          </div>
          @if (store.report().ratings.total === 0) {
            <p class="mt-3 text-sm text-gray-500">No hay valoraciones para este filtro.</p>
          } @else {
            <div class="mt-4 grid gap-5 sm:grid-cols-2">
              <div>
                <p class="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Notas</p>
                <div class="space-y-2">
                  @for (row of ratingRows; track row) {
                    <div class="flex items-center gap-3 text-xs text-gray-600">
                      <span class="w-8 font-semibold">{{ row }} ★</span>
                      <div class="h-2 flex-1 overflow-hidden rounded-full bg-gray-200">
                        <div
                          class="h-full rounded-full bg-amber-400"
                          [style.width.%]="store.report().ratings.distribution[row].percentage"
                        ></div>
                      </div>
                      <span class="w-16 text-right">{{ store.report().ratings.distribution[row].count }}</span>
                    </div>
                  }
                </div>
              </div>
              <div>
                <p class="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Sentimiento de las opiniones ({{ store.report().ratings.reviewCount }})
                </p>
                <div class="space-y-2">
                  @for (row of sentimentRows; track row.key) {
                    <div class="flex justify-between text-xs text-gray-600">
                      <span>{{ row.label }}</span>
                      <span>
                        {{ store.report().ratings.sentiment.distribution[row.key].count }} ·
                        {{ store.report().ratings.sentiment.distribution[row.key].percentage }}%
                      </span>
                    </div>
                  }
                </div>
              </div>
            </div>
            @if (store.report().ratings.byVariant.length > 0) {
              <div class="mt-5 overflow-x-auto">
                <table class="w-full text-left text-sm">
                  <thead class="text-xs uppercase tracking-wide text-gray-400">
                    <tr>
                      <th class="pb-2">Modalidad</th>
                      <th class="pb-2 text-right">Valoraciones</th>
                      <th class="pb-2 text-right">Media</th>
                      <th class="pb-2 text-right">Opiniones</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-100">
                    @for (variant of store.report().ratings.byVariant; track variant.name) {
                      <tr>
                        <td class="py-2 pr-3 text-gray-800">{{ variant.name }}</td>
                        <td class="py-2 text-right text-gray-500">{{ variant.total }}</td>
                        <td class="py-2 text-right font-semibold text-brand">{{ variant.average ?? '—' }}</td>
                        <td class="py-2 text-right text-gray-500">{{ variant.reviewCount }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          }
        </section>

        <section class="glass-panel mt-6 rounded-2xl p-5">
          <h2 class="text-sm font-semibold text-gray-900">Evolución mensual</h2>
          @if (store.report().trend.length === 0) {
            <p class="mt-3 text-sm text-gray-500">Todavía no hay suficientes meses para mostrar la evolución.</p>
          } @else {
            <div class="mt-4 space-y-2">
              @for (point of store.report().trend; track point.month) {
                <div class="grid grid-cols-4 items-center gap-3 text-xs sm:grid-cols-5">
                  <span class="font-medium text-gray-700">{{ point.month }}</span>
                  <span class="text-gray-500">{{ point.total }} comentarios</span>
                  <span class="font-semibold" [class]="scoreClass(point.score)">{{ point.score }}</span>
                  <div class="col-span-1 h-2 overflow-hidden rounded-full bg-gray-200 sm:col-span-2">
                    <div class="h-full rounded-full bg-brand" [style.width.%]="point.score"></div>
                  </div>
                </div>
              }
            </div>
          }
        </section>

        <div class="mt-6 grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
          <section class="glass-panel rounded-2xl p-5">
            <h2 class="text-sm font-semibold text-gray-900">Mejores salidas</h2>
            <p class="mt-1 text-xs text-gray-500">Mínimo 5 comentarios</p>
            <app-admin-sentiment-ranking [items]="store.report().rankings.departures" />
          </section>
          <section class="glass-panel rounded-2xl p-5">
            <h2 class="text-sm font-semibold text-gray-900">Mejores eventos</h2>
            <p class="mt-1 text-xs text-gray-500">Mínimo 5 comentarios</p>
            <app-admin-sentiment-ranking [items]="store.report().rankings.events" />
          </section>
          <section class="glass-panel rounded-2xl p-5">
            <h2 class="text-sm font-semibold text-gray-900">Mejores modalidades</h2>
            <p class="mt-1 text-xs text-gray-500">Mínimo 5 comentarios</p>
            <app-admin-sentiment-ranking [items]="store.report().rankings.variants" />
          </section>
        </div>
      }
    </div>
  `
})
export class AdminAnalyticsPage implements OnInit {
  private readonly eventService = inject(EventService);
  private readonly departureService = inject(DepartureService);

  protected readonly store = inject(AdminSentimentStore);

  protected readonly scope = signal<SentimentQuery['scope']>('global');
  protected readonly selectedEventId = signal('');
  protected readonly selectedDepartureId = signal('');
  protected readonly events = signal<EventItem[]>([]);
  protected readonly departures = signal<Departure[]>([]);
  protected readonly departuresLoading = signal(false);
  protected readonly filterError = signal('');

  private departureRequestId = 0;

  protected readonly scopeOptions: { value: SentimentQuery['scope']; label: string }[] = [
    { value: 'global', label: 'Global' },
    { value: 'departure', label: 'Salida' },
    { value: 'event', label: 'Evento' }
  ];

  protected readonly ratingRows: (1 | 2 | 3 | 4 | 5)[] = [1, 2, 3, 4, 5];

  protected readonly sentimentRows: { key: SentimentLabel; label: string; color: string }[] = [
    { key: 'positive', label: 'Positivo', color: 'bg-emerald-500' },
    { key: 'neutral', label: 'Neutro', color: 'bg-amber-500' },
    { key: 'negative', label: 'Negativo', color: 'bg-red-500' }
  ];

  ngOnInit(): void {
    void this.loadEvents();
    this.load();
  }

  protected onScopeChange(scope: SentimentQuery['scope']): void {
    this.scope.set(scope);
    this.store.setError(null);
    if (scope === 'departure' && this.selectedEventId() && !this.departures().length) {
      void this.loadDepartures();
    }
  }

  protected onEventChange(event: Event): void {
    const eventId = (event.target as HTMLSelectElement).value;
    this.departureRequestId += 1;
    this.selectedEventId.set(eventId);
    this.selectedDepartureId.set('');
    this.departures.set([]);
    this.departuresLoading.set(false);
    this.filterError.set('');
    if (eventId) {
      void this.loadDepartures();
    }
  }

  protected onDepartureChange(event: Event): void {
    this.selectedDepartureId.set((event.target as HTMLSelectElement).value);
  }

  protected onIncludeDeletedChange(event: Event): void {
    this.store.setIncludeDeleted((event.target as HTMLInputElement).checked);
  }

  protected clearFilters(): void {
    this.departureRequestId += 1;
    this.scope.set('global');
    this.selectedEventId.set('');
    this.selectedDepartureId.set('');
    this.departures.set([]);
    this.departuresLoading.set(false);
    this.filterError.set('');
    this.store.reset();
    this.store.setIncludeDeleted(false);
    this.load();
  }

  protected load(): void {
    this.store.setError(null);
    const scope = this.scope();
    const selectedEventId = this.selectedEventId();
    const selectedDepartureId = this.selectedDepartureId();

    if (scope === 'departure' && !selectedEventId) {
      this.store.setError('Selecciona el evento de la salida.');
      return;
    }
    if (scope === 'departure' && !selectedDepartureId) {
      this.store.setError('Selecciona una salida.');
      return;
    }
    if (scope === 'event' && !selectedEventId) {
      this.store.setError('Selecciona un evento.');
      return;
    }

    void this.store.load({
      scope,
      departureId: scope === 'departure' ? selectedDepartureId : undefined,
      eventId: scope === 'event' ? selectedEventId : undefined,
      includeDeleted: this.store.includeDeleted(),
      includeRatings: true
    });
  }

  protected scopeChipClass(value: SentimentQuery['scope']): string {
    const base = 'rounded-full border px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50';
    if (value === this.scope()) {
      return `${base} border-brand bg-brand text-white dark:text-night`;
    }
    return `${base} border-gray-300 bg-surface text-gray-600 hover:border-brand hover:text-brand dark:border-line dark:bg-night2 dark:text-gray-300`;
  }

  protected eventLabel(event: EventItem): string {
    const date = this.formatDate(event.startDate);
    return date ? `${event.name} · ${date}` : event.name;
  }

  protected departureLabel(departure: Departure): string {
    const date = this.formatDate(departure.startDatetime);
    return date ? `${departure.slug} · ${date}` : departure.slug;
  }

  protected scoreClass(score: number): string {
    if (score >= 65) return 'text-emerald-600';
    if (score >= 40) return 'text-amber-600';
    return 'text-red-600';
  }

  protected generatedLabel(): string {
    const value = this.store.report().generatedAt;
    if (!value) return '—';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('es-ES');
  }

  private async loadEvents(): Promise<void> {
    try {
      this.events.set(await firstValueFrom(this.eventService.list({ pageSize: 100 })));
    } catch {
      this.filterError.set('No se han podido cargar los eventos.');
    }
  }

  private async loadDepartures(): Promise<void> {
    const eventId = this.selectedEventId();
    if (!eventId) return;

    const requestId = ++this.departureRequestId;
    this.departuresLoading.set(true);
    this.filterError.set('');
    try {
      const items = await firstValueFrom(this.departureService.list({ eventId }));
      if (requestId === this.departureRequestId) {
        this.departures.set(items);
      }
    } catch {
      if (requestId === this.departureRequestId) {
        this.filterError.set('No se han podido cargar las salidas de este evento.');
      }
    } finally {
      if (requestId === this.departureRequestId) {
        this.departuresLoading.set(false);
      }
    }
  }

  private formatDate(value: string): string {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('es-ES');
  }
}
