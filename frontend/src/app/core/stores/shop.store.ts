import { Injectable, computed, signal } from '@angular/core';
import { Departure } from '../models/departure.model';
import { EventCategory, EventHost, EventLocation } from '../models/event.model';
import {
  DEFAULT_SHOP_FILTERS,
  SHOP_DEFAULT_LIMIT,
  SHOP_MAX_PRICE,
  SHOP_MIN_PRICE,
  ShopCatalogue,
  ShopEvent,
  ShopFilters,
  ShopPagination
} from '../models/shop.model';

const EMPTY_PAGINATION: ShopPagination = {
  total: 0,
  page: 1,
  limit: SHOP_DEFAULT_LIMIT,
  totalPages: 0
};

@Injectable({ providedIn: 'root' })
export class ShopStore {
  private readonly _categories = signal<EventCategory[]>([]);
  private readonly _hosts = signal<EventHost[]>([]);
  private readonly _locations = signal<EventLocation[]>([]);
  private readonly _catalogueLoading = signal(false);
  private readonly _catalogueError = signal<string | null>(null);
  private readonly _catalogueLoaded = signal(false);

  private readonly _featuredEvents = signal<ShopEvent[]>([]);
  private readonly _featuredLoading = signal(false);
  private readonly _featuredError = signal<string | null>(null);
  private readonly _featuredLoaded = signal(false);

  private readonly _events = signal<ShopEvent[]>([]);
  private readonly _pagination = signal<ShopPagination>(EMPTY_PAGINATION);
  private readonly _filters = signal<ShopFilters>({ ...DEFAULT_SHOP_FILTERS });
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  private readonly _event = signal<ShopEvent | null>(null);
  private readonly _detailLoading = signal(false);
  private readonly _detailError = signal<string | null>(null);
  private readonly _detailLoaded = signal(false);

  private readonly _departures = signal<Departure[]>([]);
  private readonly _departuresLoading = signal(false);
  private readonly _departuresError = signal<string | null>(null);
  private readonly _departuresLoaded = signal(false);
  private readonly _selectedDepartureId = signal<string | null>(null);

  readonly categories = this._categories.asReadonly();
  readonly hosts = this._hosts.asReadonly();
  readonly locations = this._locations.asReadonly();
  readonly catalogueLoading = this._catalogueLoading.asReadonly();
  readonly catalogueError = this._catalogueError.asReadonly();
  readonly catalogueLoaded = this._catalogueLoaded.asReadonly();

  readonly featuredEvents = this._featuredEvents.asReadonly();
  readonly featuredLoading = this._featuredLoading.asReadonly();
  readonly featuredError = this._featuredError.asReadonly();
  readonly featuredLoaded = this._featuredLoaded.asReadonly();

  readonly events = this._events.asReadonly();
  readonly pagination = this._pagination.asReadonly();
  readonly filters = this._filters.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  readonly event = this._event.asReadonly();
  readonly ratingSummary = computed(() => this._event()?.rating ?? null);
  readonly detailLoading = this._detailLoading.asReadonly();
  readonly detailError = this._detailError.asReadonly();
  readonly detailLoaded = this._detailLoaded.asReadonly();

  readonly departures = this._departures.asReadonly();
  readonly departuresLoading = this._departuresLoading.asReadonly();
  readonly departuresError = this._departuresError.asReadonly();
  readonly departuresLoaded = this._departuresLoaded.asReadonly();
  readonly hasDepartures = computed(() => this._departures().length > 0);
  readonly selectedDeparture = computed(() => {
    const selectedId = this._selectedDepartureId();
    if (selectedId) {
      const selected = this._departures().find((item) => item._id === selectedId);
      if (selected) {
        return selected;
      }
    }
    return this._departures()[0] ?? null;
  });

  readonly isEmpty = computed(
    () => !this._loading() && !this._error() && this._events().length === 0
  );

  readonly hasActiveFilters = computed(() => {
    const filters = this._filters();
    return Boolean(
      filters.categorySlug ||
      filters.hostSlug ||
      filters.locationSlug ||
      filters.distanceSlug ||
      (filters.minPrice ?? SHOP_MIN_PRICE) > SHOP_MIN_PRICE ||
      (filters.maxPrice ?? SHOP_MAX_PRICE) < SHOP_MAX_PRICE ||
      filters.search?.trim()
    );
  });

  readonly activeFilterCount = computed(() => {
    const filters = this._filters();
    let count = 0;

    if (filters.categorySlug) count += 1;
    if (filters.hostSlug) count += 1;
    if (filters.locationSlug) count += 1;
    if (filters.distanceSlug) count += 1;
    if (
      (filters.minPrice ?? SHOP_MIN_PRICE) > SHOP_MIN_PRICE ||
      (filters.maxPrice ?? SHOP_MAX_PRICE) < SHOP_MAX_PRICE
    ) {
      count += 1;
    }

    return count;
  });

  setCatalogue(catalogue: ShopCatalogue): void {
    this._categories.set(catalogue.categories);
    this._hosts.set(catalogue.hosts);
    this._locations.set(catalogue.locations);
    this._catalogueLoaded.set(true);
    this._catalogueLoading.set(false);
    this._catalogueError.set(null);
  }

  setCatalogueLoading(value: boolean): void {
    this._catalogueLoading.set(value);
  }

  setCatalogueError(value: string | null): void {
    this._catalogueError.set(value);
    this._catalogueLoading.set(false);
  }

  setFeaturedEvents(events: ShopEvent[]): void {
    this._featuredEvents.set(events);
    this._featuredLoaded.set(true);
    this._featuredLoading.set(false);
    this._featuredError.set(null);
  }

  setFeaturedLoading(value: boolean): void {
    this._featuredLoading.set(value);
  }

  setFeaturedError(value: string | null): void {
    this._featuredError.set(value);
    this._featuredLoading.set(false);
    this._featuredLoaded.set(true);
  }

  setEvents(events: ShopEvent[]): void {
    this._events.set(events);
    this._error.set(null);
  }

  setPagination(pagination: ShopPagination): void {
    this._pagination.set(pagination);
  }

  setFilters(filters: ShopFilters): void {
    this._filters.set({ ...DEFAULT_SHOP_FILTERS, ...filters });
  }

  patchFilters(patch: ShopFilters): void {
    this._filters.update((filters) => ({ ...filters, ...patch }));
  }

  resetFilters(): void {
    this._filters.set({ ...DEFAULT_SHOP_FILTERS });
  }

  setLoading(value: boolean): void {
    this._loading.set(value);
  }

  setError(value: string | null): void {
    this._error.set(value);
    this._loading.set(false);
  }

  setEvent(event: ShopEvent | null): void {
    this._event.set(event);
    this._detailLoaded.set(true);
    this._detailLoading.set(false);
    this._detailError.set(null);
  }

  setDetailLoading(value: boolean): void {
    this._detailLoading.set(value);
  }

  setDetailError(value: string | null): void {
    this._detailError.set(value);
    this._detailLoading.set(false);
    this._detailLoaded.set(true);
  }

  setDepartures(departures: Departure[]): void {
    this._departures.set(departures);
    const selectedId = this._selectedDepartureId();
    if (!selectedId || !departures.some((item) => item._id === selectedId)) {
      this._selectedDepartureId.set(departures[0]?._id ?? null);
    }
    this._departuresLoading.set(false);
    this._departuresError.set(null);
    this._departuresLoaded.set(true);
  }

  setDeparturesLoading(value: boolean): void {
    this._departuresLoading.set(value);
  }

  setDeparturesError(value: string | null): void {
    this._departuresError.set(value);
    this._departuresLoading.set(false);
    this._departuresLoaded.set(true);
  }

  selectDeparture(id: string | null): void {
    this._selectedDepartureId.set(id);
  }

  resetDepartures(): void {
    this._departures.set([]);
    this._departuresLoading.set(false);
    this._departuresError.set(null);
    this._departuresLoaded.set(false);
    this._selectedDepartureId.set(null);
  }

  resetDetail(): void {
    this._event.set(null);
    this._detailLoading.set(false);
    this._detailError.set(null);
    this._detailLoaded.set(false);
    this.resetDepartures();
  }

  reset(): void {
    this._categories.set([]);
    this._hosts.set([]);
    this._locations.set([]);
    this._catalogueLoading.set(false);
    this._catalogueError.set(null);
    this._catalogueLoaded.set(false);
    this._featuredEvents.set([]);
    this._featuredLoading.set(false);
    this._featuredError.set(null);
    this._featuredLoaded.set(false);
    this._events.set([]);
    this._pagination.set({ ...EMPTY_PAGINATION });
    this._filters.set({ ...DEFAULT_SHOP_FILTERS });
    this._loading.set(false);
    this._error.set(null);
    this.resetDetail();
  }
}
