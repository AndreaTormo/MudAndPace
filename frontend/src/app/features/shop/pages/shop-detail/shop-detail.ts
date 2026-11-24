import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subject, distinctUntilChanged, firstValueFrom, map, takeUntil } from 'rxjs';
import { Departure } from '../../../../core/models/departure.model';
import {
  DIFFICULTY_LABELS,
  EventVariant,
  SURFACE_LABELS
} from '../../../../core/models/event.model';
import { ShopFilters } from '../../../../core/models/shop.model';
import { ShopService } from '../../../../core/services/shop.service';
import { ShopStore } from '../../../../core/stores/shop.store';
import { CommentSection } from '../../../events/components/comment-section/comment-section';
import { ActivityPanel } from '../../../../shared/components/activity-panel/activity-panel';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state';
import { ErrorState } from '../../../../shared/components/error-state/error-state';
import { EventMap } from '../../../../shared/components/event-map/event-map';
import { WeatherCard } from '../../../../shared/components/weather-card/weather-card';
import { SkeletonLoader } from '../../../../shared/components/skeleton-loader/skeleton-loader';
import { StarRating } from '../../../../shared/components/star-rating/star-rating';
import { resolveAssetUrl } from '../../../../shared/utils/asset.util';
import { isHttpError } from '../../../../shared/utils/error.util';
import {
  formatDate,
  formatDateLong,
  formatDistance,
  formatElevation,
  formatPrice,
  formatTime
} from '../../../../shared/utils/format.util';
import { buildShopQueryParams, parseShopFilters } from '../../utils/shop-query.util';

@Component({
  selector: 'app-shop-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, EmptyState, ErrorState, EventMap, ActivityPanel, CommentSection, WeatherCard, SkeletonLoader, StarRating],
  template: `
    <div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      @if (store.detailLoading()) {
        <app-skeleton-loader [count]="4" />
      } @else if (notFound()) {
        <app-empty-state
          title="Experiencia no encontrada"
          message="No existe ninguna experiencia con ese enlace o ya no está disponible."
        >
          <a
            [routerLink]="['/shop/experiences']"
            [queryParams]="returnQueryParams()"
            class="button-primary"
          >
            Volver a las experiencias
          </a>
        </app-empty-state>
      } @else if (store.detailError()) {
        <app-error-state [message]="store.detailError()!" (retry)="reload()" />
      } @else {
        @if (event(); as ev) {
        <nav class="mb-6 flex items-center gap-2 overflow-hidden text-sm text-gray-500">
          <a
            [routerLink]="['/shop']"
            [queryParams]="returnQueryParams()"
            class="shrink-0 hover:text-gray-800 hover:underline"
          >
            Shop
          </a>
          <span>/</span>
          <a
            [routerLink]="['/shop/experiences']"
            [queryParams]="returnQueryParams()"
            class="shrink-0 hover:text-gray-800 hover:underline"
          >
            Experiencias
          </a>
          <span>/</span>
          <span class="truncate font-medium text-gray-800">{{ ev.name }}</span>
        </nav>

        <div class="grid gap-8 lg:grid-cols-3">
          <div class="space-y-12 lg:col-span-2">
            <section class="overflow-hidden rounded-2xl border border-gray-200 bg-surface shadow-sm">
              <div class="relative aspect-[16/10] bg-gradient-to-br from-brand/10 to-brand/25">
                @if (activeImageUrl(); as url) {
                  <img
                    [src]="url"
                    [alt]="ev.name"
                    class="h-full w-full object-cover"
                  />
                } @else {
                  <div class="flex h-full w-full items-center justify-center">
                    <svg class="h-16 w-16 text-brand/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.4">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                }

                @if (hasMultipleImages()) {
                  <button
                    type="button"
                    (click)="prevImage()"
                    aria-label="Imagen anterior"
                    class="overlay-control absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full"
                  >
                    <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    (click)="nextImage()"
                    aria-label="Imagen siguiente"
                    class="overlay-control absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full"
                  >
                    <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                }
              </div>

              @if (images().length > 1) {
                <div class="flex gap-2 overflow-x-auto p-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  @for (image of images(); track image._id; let index = $index) {
                    <button
                      type="button"
                      (click)="showImage(index)"
                      class="h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 transition"
                      [class]="index === imageIndex() ? 'border-brand' : 'border-transparent opacity-70 hover:opacity-100'"
                    >
                      <img
                        [src]="resolveAssetUrl(image.url)"
                        [alt]="image.alt || ev.name"
                        class="h-full w-full object-cover"
                      />
                    </button>
                  }
                </div>
              }
            </section>

            <section class="rounded-[16px] border border-gray-200 bg-white p-6 sm:p-8 dark:border-line dark:bg-night2" style="font-family: Inter, system-ui, sans-serif;">
              <div class="space-y-8">
                <header class="space-y-3">
                  <span class="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium uppercase tracking-[0.08em] text-gray-600 dark:border-line dark:bg-night2 dark:text-gray-500">
                    {{ ev.category?.name || 'Trail' }}
                  </span>
                  <div class="space-y-2">
                    <h1 class="text-3xl font-bold leading-tight text-gray-900 dark:text-gray-900 sm:text-4xl">{{ ev.name }}</h1>
                    <p class="text-sm text-gray-500 dark:text-gray-500 sm:text-base">
                      @if (eventYear()) { {{ eventYear() }} · }{{ locationText() }}
                    </p>
                    @if (store.ratingSummary(); as rating) {
                      <div class="flex flex-wrap items-center gap-2">
                        <app-star-rating
                          [value]="rating.average"
                          [readOnly]="true"
                          [showValue]="true"
                          label="Valoración media de la experiencia"
                        />
                        @if (rating.total > 0) {
                          <span class="text-xs text-gray-500">
                            {{ rating.total }} {{ rating.total === 1 ? 'valoración' : 'valoraciones' }}
                          </span>
                        }
                      </div>
                    }
                  </div>
                </header>

                <div class="space-y-3">
                  <h2 class="text-sm font-semibold uppercase tracking-[0.08em] text-gray-500 dark:text-gray-500">Descripción</h2>
                  @if (ev.description) {
                    <p class="max-w-3xl whitespace-pre-line text-base leading-relaxed text-gray-800 dark:text-gray-900">
                      {{ ev.description }}
                    </p>
                  } @else {
                    <p class="text-base text-gray-500 dark:text-gray-500">Este evento no tiene descripción.</p>
                  }
                </div>

                @if (ev.variants?.length) {
                  <section class="space-y-4">
                    <h2 class="text-sm font-semibold uppercase tracking-[0.08em] text-gray-500 dark:text-gray-500">Modalidades</h2>
                    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      @for (variant of ev.variants!; track $index) {
                        <button
                          type="button"
                          (click)="selectVariant(variant)"
                          [disabled]="!departureForVariant(variant)"
                          [attr.aria-pressed]="isVariantSelected(variant)"
                          class="flex h-full w-full flex-col rounded-[16px] border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-60 sm:p-6"
                          [class]="isVariantSelected(variant)
                            ? 'border-brand bg-brand/5 ring-1 ring-brand/20 dark:border-brand dark:bg-brand/10'
                            : 'border-gray-200 bg-gray-50 hover:border-brand/40 dark:border-line dark:bg-night2'"
                        >
                          <div class="flex items-start justify-between gap-4">
                            <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-900">{{ variant.name }}</h3>
                            <p class="shrink-0 text-lg font-semibold text-brand dark:text-accent">{{ formatPrice(variant.price) }}</p>
                          </div>
                          <div class="my-4 border-t border-gray-200 dark:border-line"></div>
                          <dl class="mt-auto space-y-3 text-sm">
                            <div class="flex items-center justify-between gap-4">
                              <dt class="text-gray-500 dark:text-gray-500">Distancia</dt>
                              <dd class="font-medium text-gray-900 dark:text-gray-900">{{ formatDistance(variant.distanceKm) }}</dd>
                            </div>
                            <div class="flex items-center justify-between gap-4">
                              <dt class="text-gray-500 dark:text-gray-500">Desnivel +</dt>
                              <dd class="font-medium text-gray-900 dark:text-gray-900">{{ formatElevation(variant.elevationGain) }}</dd>
                            </div>
                          </dl>
                        </button>
                      }
                    </div>
                  </section>
                }

                @if (hasCharacteristics()) {
                  <section class="rounded-[16px] border border-gray-200 bg-gray-50 p-4 sm:p-6 dark:border-line dark:bg-night2">
                    <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-900">Características</h2>
                    <div class="mt-4 border-t border-gray-200 dark:border-line"></div>
                    <div class="mt-4 space-y-6">
                      @if (difficultyLabel(); as difficulty) {
                        <div class="space-y-1">
                          <p class="text-sm text-gray-500 dark:text-gray-500">Dificultad</p>
                          <p class="text-base font-medium text-gray-900 dark:text-gray-900">{{ difficulty }}</p>
                        </div>
                      }
                      @if (ev.elevationLossM !== null && ev.elevationLossM !== undefined) {
                        <div class="space-y-1">
                          <p class="text-sm text-gray-500 dark:text-gray-500">Desnivel −</p>
                          <p class="text-base font-semibold text-brand dark:text-accent">{{ formatElevation(ev.elevationLossM) }}</p>
                        </div>
                      }
                      @if (ev.surface?.length || ev.tags?.length) {
                        <div class="space-y-3">
                          @if (ev.surface?.length) {
                            <div class="flex flex-wrap gap-2">
                              @for (surface of ev.surface!; track surface) {
                                <span class="inline-flex items-center rounded-full border border-gray-200 bg-white px-3 py-1 text-sm text-gray-700 dark:border-line dark:bg-night dark:text-gray-900">
                                  {{ surfaceLabels[surface] }}
                                </span>
                              }
                            </div>
                          }
                          @if (ev.tags?.length) {
                            <div class="flex flex-wrap gap-x-4 gap-y-2 text-sm text-gray-500 dark:text-gray-500">
                              @for (tag of ev.tags!; track tag) {
                                <span>#{{ tag }}</span>
                              }
                            </div>
                          }
                        </div>
                      }
                      @if (ev.gpxUrl) {
                        <a
                          [href]="ev.gpxUrl"
                          target="_blank"
                          rel="noopener noreferrer"
                          class="inline-block text-sm font-medium text-brand underline-offset-4 hover:underline dark:text-accent"
                        >
                          Descargar GPX
                        </a>
                      }
                    </div>
                  </section>
                }
              </div>
            </section>

            <app-event-map [location]="ev.location" />

            <app-weather-card class="block" [location]="ev.location" [date]="weatherDate()" />

            <app-activity-panel
              class="block"
              [eventId]="ev._id"
              [eventName]="ev.name"
              [eventDate]="ev.startDate"
            />

            @if (store.selectedDeparture(); as departure) {
              <app-comment-section
                class="block"
                [departureId]="departure._id"
                [canComment]="isDepartureFinished(departure)"
              />
            }
          </div>

          <aside class="space-y-4">
            <div class="sticky top-20 space-y-4 rounded-2xl border border-gray-200 bg-surface/80 p-5 backdrop-blur-sm">
              <div class="flex items-center gap-4">
                <div class="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-brand text-xl font-bold text-white shadow-sm dark:text-night">
                  {{ hostInitial() }}
                </div>
                <div class="min-w-0">
                  <p class="text-xs uppercase tracking-wide text-gray-400">Organiza</p>
                  <p class="truncate text-lg font-semibold text-gray-900">{{ hostText() }}</p>
                </div>
              </div>

              <dl class="space-y-2 border-t border-gray-100 pt-4 text-sm">
                <div class="flex justify-between gap-2">
                  <dt class="text-gray-500">Fecha</dt>
                  <dd class="text-gray-800">{{ formatDate(ev.startDate) }}</dd>
                </div>
                <div class="flex justify-between gap-2">
                  <dt class="text-gray-500">Ubicación</dt>
                  <dd class="text-right text-gray-800">{{ locationText() }}</dd>
                </div>
                <div class="flex justify-between gap-2">
                  <dt class="text-gray-500">Categoría</dt>
                  <dd class="text-gray-800">{{ categoryText() }}</dd>
                </div>
              </dl>

              <div class="border-t border-gray-100 pt-4">
                <p class="text-xs uppercase tracking-wide text-gray-400">Precio</p>
                <p class="text-2xl font-bold text-brand">{{ formatPrice(ev.price) }}</p>
              </div>

              <div class="border-t border-gray-100 pt-4">
                <div class="mb-3 flex items-center justify-between gap-2">
                  <p class="text-xs uppercase tracking-wide text-gray-400">Salidas</p>
                  @if (store.hasDepartures()) {
                    <span class="text-xs font-medium text-gray-400">
                      {{ store.departures().length }}
                    </span>
                  }
                </div>

                @if (store.departuresLoading()) {
                  <div class="space-y-2">
                    @for (item of [1, 2, 3]; track item) {
                      <div class="h-20 animate-pulse rounded-xl bg-gray-100"></div>
                    }
                  </div>
                } @else if (store.departuresError()) {
                  <div class="rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-700">
                    <p>{{ store.departuresError() }}</p>
                    <button
                      type="button"
                      class="mt-2 text-sm font-semibold text-brand hover:underline"
                      (click)="reloadDepartures()"
                    >
                      Reintentar
                    </button>
                  </div>
                } @else if (!store.hasDepartures()) {
                  <div class="rounded-xl border border-gray-100 bg-gray-50 px-3 py-6 text-center">
                    <p class="text-sm text-gray-500">No hay salidas disponibles para esta experiencia.</p>
                  </div>
                } @else {
                  <div class="max-h-80 space-y-2 overflow-y-auto pr-1">
                    @for (departure of store.departures(); track departure._id) {
                      <button
                        type="button"
                        (click)="selectDeparture(departure)"
                        class="w-full rounded-xl border-2 p-3 text-left transition"
                        [class]="isSelected(departure)
                          ? 'border-brand bg-brand/5'
                          : 'border-gray-200 bg-surface hover:border-brand/40'"
                      >
                        <div class="flex items-start justify-between gap-3">
                          <div class="min-w-0">
                            <p class="text-xs font-semibold uppercase tracking-wide text-brand">{{ variantLabel(departure) }}</p>
                            <p class="text-sm font-semibold text-gray-900">{{ formatDateLong(departure.startDatetime) }}</p>
                            <p class="mt-0.5 text-xs text-gray-500">
                              {{ formatTime(departure.startDatetime) }} → {{ formatTime(departure.endDatetime) }}
                            </p>
                            <p
                              class="mt-1 text-xs"
                              [class]="isDepartureFinished(departure)
                                ? 'text-brand'
                                : (departure.spotsLeft > 0 ? 'text-gray-500' : 'text-rose-600')"
                            >
                              @if (isDepartureFinished(departure)) {
                                Finalizada · puedes comentar
                              } @else if (departure.status === 'full' || departure.spotsLeft === 0) {
                                Sin plazas disponibles
                              } @else {
                                {{ departure.spotsLeft }}
                                {{ departure.spotsLeft === 1 ? 'plaza disponible' : 'plazas disponibles' }}
                              }
                            </p>
                          </div>
                          <div class="shrink-0 text-right">
                            <p class="text-base font-bold text-brand">{{ formatPrice(departure.price) }}</p>
                            <p class="text-[11px] text-gray-400">por persona</p>
                          </div>
                        </div>
                      </button>
                    }
                  </div>

                  @if (store.selectedDeparture(); as selected) {
                    <div class="mt-3 rounded-xl bg-brand/5 p-3">
                      <div class="flex justify-between gap-2 text-sm">
                        <span class="text-gray-500">Salida seleccionada</span>
                        <span class="text-right font-semibold text-gray-900">
                          {{ formatDate(selected.startDatetime) }}
                        </span>
                      </div>
                      <div class="mt-1 flex justify-between gap-2 text-sm">
                        <span class="text-gray-500">Precio</span>
                        <span class="font-semibold text-brand">{{ formatPrice(selected.price) }}</span>
                      </div>
                      <button
                        type="button"
                        disabled
                        class="button-primary mt-3 w-full opacity-60"
                        [title]="isDepartureFinished(selected)
                          ? 'Esta salida ya ha finalizado'
                          : 'La reserva estará disponible próximamente'"
                      >
                        {{ isDepartureFinished(selected) ? 'Salida finalizada' : 'Reserva próximamente' }}
                      </button>
                    </div>
                  }
                }
              </div>

              <div class="space-y-2 border-t border-gray-100 pt-4">
                <a
                  [routerLink]="['/shop/experiences']"
                  [queryParams]="returnQueryParams()"
                  class="button-secondary block text-center"
                >
                  Volver a las experiencias
                </a>
                @if (ev.host; as host) {
                  <button type="button" class="button-primary w-full" (click)="showHostEvents(host.slug)">
                    Ver experiencias de {{ host.name }}
                  </button>
                }
              </div>
            </div>
          </aside>
        </div>
        }
      }
    </div>
  `
})
export class ShopDetail implements OnInit, OnDestroy {
  protected readonly store = inject(ShopStore);
  private readonly shopService = inject(ShopService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroy$ = new Subject<void>();

  protected readonly notFound = signal(false);
  protected readonly imageIndex = signal(0);

  protected readonly event = this.store.event;
  protected readonly images = computed(() => this.event()?.images ?? []);

  protected readonly activeImage = computed(() => {
    const images = this.images();
    return images[this.imageIndex()] ?? images[0] ?? null;
  });

  protected readonly activeImageUrl = computed(() => {
    const image = this.activeImage();
    return image ? resolveAssetUrl(image.url) : null;
  });

  protected readonly hasMultipleImages = computed(() => this.images().length > 1);
  protected readonly locationText = computed(() => {
    const location = this.event()?.location;
    if (!location) {
      return 'Ubicación por confirmar';
    }
    return [location.name, location.city].filter(Boolean).join(' · ');
  });

  protected readonly categoryText = computed(() => this.event()?.category?.name ?? '-');
  protected readonly hostText = computed(() => this.event()?.host?.name ?? '-');
  protected readonly hostInitial = computed(() => {
    const name = this.event()?.host?.name?.trim();
    return name ? name.charAt(0).toUpperCase() : '?';
  });

  protected readonly eventYear = computed(() => {
    const date = this.event()?.startDate;
    if (!date) {
      return '';
    }
    const year = new Date(date).getFullYear();
    return Number.isFinite(year) ? String(year) : '';
  });

  protected readonly weatherDate = computed(
    () => this.store.selectedDeparture()?.startDatetime ?? this.event()?.startDate
  );

  protected readonly difficultyLabel = computed(() => {
    const difficulty = this.event()?.difficulty;
    return difficulty ? DIFFICULTY_LABELS[difficulty] : null;
  });

  protected readonly hasCharacteristics = computed(() => {
    const event = this.event();
    if (!event) {
      return false;
    }
    return Boolean(
      event.difficulty ||
        event.elevationLossM !== undefined ||
        event.elevationLossM !== null ||
        event.surface?.length ||
        event.tags?.length
    );
  });

  protected readonly surfaceLabels = SURFACE_LABELS;
  protected readonly formatDate = formatDate;
  protected readonly formatDateLong = formatDateLong;
  protected readonly formatDistance = formatDistance;
  protected readonly formatElevation = formatElevation;
  protected readonly formatPrice = formatPrice;
  protected readonly formatTime = formatTime;
  protected readonly resolveAssetUrl = resolveAssetUrl;

  private currentSlug = '';
  protected readonly returnFilters = signal<ShopFilters>(
    parseShopFilters(this.route.snapshot.queryParams)
  );
  protected readonly returnQueryParams = computed(() =>
    buildShopQueryParams(this.returnFilters())
  );

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        map((params) => params.get('slug') ?? ''),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe((slug) => {
        this.currentSlug = slug;
        void this.load(slug);
      });

    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe((params) => this.returnFilters.set(parseShopFilters(params)));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  protected reload(): void {
    if (this.currentSlug) {
      void this.load(this.currentSlug);
    }
  }

  protected showImage(index: number): void {
    this.imageIndex.set(index);
  }

  protected prevImage(): void {
    const total = this.images().length;
    if (total === 0) {
      return;
    }
    this.imageIndex.update((index) => (index - 1 + total) % total);
  }

  protected nextImage(): void {
    const total = this.images().length;
    if (total === 0) {
      return;
    }
    this.imageIndex.update((index) => (index + 1) % total);
  }

  protected isSelected(departure: Departure): boolean {
    return this.store.selectedDeparture()?._id === departure._id;
  }

  protected isVariantSelected(variant: EventVariant): boolean {
    const departure = this.departureForVariant(variant);
    return departure ? this.isSelected(departure) : false;
  }

  protected variantLabel(departure: Departure): string {
    const variant = this.store.event()?.variants?.find(
      (item) => this.departureForVariant(item)?._id === departure._id
    );
    return variant?.name ?? 'Salida';
  }

  protected departureForVariant(variant: EventVariant): Departure | undefined {
    const slugPart = this.slugifyVariantName(variant.name);
    const departures = this.store.departures();
    const bySlug = slugPart
      ? departures.find((departure) => departure.slug.includes(`-${slugPart}-`))
      : undefined;
    return bySlug ?? departures.find((departure) => departure.price === variant.price);
  }

  protected selectVariant(variant: EventVariant): void {
    const departure = this.departureForVariant(variant);
    if (departure) {
      this.selectDeparture(departure);
    }
  }

  protected isDepartureFinished(departure: Departure): boolean {
    const end = new Date(departure.endDatetime).getTime();
    return Number.isFinite(end) && end < Date.now();
  }

  protected selectDeparture(departure: Departure): void {
    this.store.selectDeparture(departure._id);
  }

  protected reloadDepartures(): void {
    if (this.currentSlug) {
      void this.loadDepartures(this.currentSlug);
    }
  }

  protected showHostEvents(hostSlug: string): void {
    const filters: ShopFilters = { ...this.returnFilters(), hostSlug, page: 1 };
    void this.router.navigate(['/shop/experiences'], {
      queryParams: buildShopQueryParams(filters)
    });
  }

  private slugifyVariantName(name: string): string {
    return name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private async load(slug: string): Promise<void> {
    if (!slug) {
      this.store.resetDetail();
      this.notFound.set(true);
      return;
    }

    this.notFound.set(false);
    this.imageIndex.set(0);
    this.store.resetDepartures();
    this.store.setDeparturesLoading(true);
    this.store.setDetailError(null);
    this.store.setDetailLoading(true);

    try {
      const event = await firstValueFrom(this.shopService.getExperienceBySlug(slug));
      if (slug !== this.currentSlug) {
        return;
      }
      this.store.setEvent(event);
      void this.loadDepartures(slug);
    } catch (error) {
      if (slug !== this.currentSlug) {
        return;
      }
      this.store.resetDepartures();
      if (isHttpError(error) && error.status === 404) {
        this.store.setEvent(null);
        this.notFound.set(true);
        return;
      }
      this.store.setDetailError('No se ha podido cargar la experiencia. Inténtalo de nuevo.');
    }
  }

  private async loadDepartures(slug: string): Promise<void> {
    this.store.setDeparturesLoading(true);
    this.store.setDeparturesError(null);

    try {
      const departures = await firstValueFrom(
        this.shopService.listDeparturesByExperienceSlug(slug)
      );
      if (slug !== this.currentSlug) {
        return;
      }
      this.store.setDepartures(departures);
    } catch {
      if (slug !== this.currentSlug) {
        return;
      }
      this.store.setDepartures([]);
      this.store.setDeparturesError(
        'No se han podido cargar las salidas. Inténtalo de nuevo.'
      );
    }
  }
}
