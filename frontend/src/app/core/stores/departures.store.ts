import { Injectable, computed, signal } from '@angular/core';
import {
  DEFAULT_DEPARTURE_FILTERS,
  Departure,
  DepartureFilters
} from '../models/departure.model';

@Injectable({ providedIn: 'root' })
export class DeparturesStore {
  private readonly _departures = signal<Departure[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _loaded = signal(false);
  private readonly _stale = signal(false);
  private readonly _filters = signal<DepartureFilters>({ ...DEFAULT_DEPARTURE_FILTERS });
  private readonly _selectedDeparture = signal<Departure | null>(null);

  private readonly _deletedDepartures = signal<Departure[]>([]);
  private readonly _deletedLoading = signal(false);
  private readonly _deletedError = signal<string | null>(null);
  private readonly _deletedLoaded = signal(false);

  readonly departures = this._departures.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly loaded = this._loaded.asReadonly();
  readonly stale = this._stale.asReadonly();
  readonly filters = this._filters.asReadonly();
  readonly selectedDeparture = this._selectedDeparture.asReadonly();

  readonly deletedDepartures = this._deletedDepartures.asReadonly();
  readonly deletedLoading = this._deletedLoading.asReadonly();
  readonly deletedError = this._deletedError.asReadonly();
  readonly deletedLoaded = this._deletedLoaded.asReadonly();

  readonly count = computed(() => this._departures().length);
  readonly isEmpty = computed(
    () => !this._loading() && !this._error() && this._departures().length === 0
  );
  readonly hasActiveFilters = computed(() => {
    const filters = this._filters();
    return Boolean(
      filters.eventId ||
      filters.status ||
      filters.isActive !== undefined ||
      filters.fromDate ||
      filters.toDate
    );
  });

  setLoading(value: boolean): void {
    this._loading.set(value);
  }

  setError(value: string | null): void {
    this._error.set(value);
    this._loading.set(false);
  }

  setDepartures(departures: Departure[]): void {
    this._departures.set(departures);
    this._loaded.set(true);
    this._stale.set(false);
    this._loading.set(false);
    this._error.set(null);
  }

  setFilters(filters: DepartureFilters): void {
    this._filters.set({ ...DEFAULT_DEPARTURE_FILTERS, ...filters });
  }

  patchFilters(patch: DepartureFilters): void {
    this._filters.update((filters) => ({ ...filters, ...patch }));
  }

  resetFilters(): void {
    this._filters.set({ ...DEFAULT_DEPARTURE_FILTERS });
  }

  setSelectedDeparture(departure: Departure | null): void {
    this._selectedDeparture.set(departure);
  }

  patchDeparture(updated: Departure): void {
    this._departures.update((list) =>
      list.map((departure) => (departure._id === updated._id ? updated : departure))
    );
    if (this._selectedDeparture()?._id === updated._id) {
      this._selectedDeparture.set(updated);
    }
  }

  upsertDeparture(updated: Departure): void {
    this._departures.update((list) => {
      const exists = list.some((departure) => departure._id === updated._id);
      const next = exists
        ? list.map((departure) => (departure._id === updated._id ? updated : departure))
        : [...list, updated];
      return next.sort(
        (a, b) => new Date(a.startDatetime).getTime() - new Date(b.startDatetime).getTime()
      );
    });
    if (this._selectedDeparture()?._id === updated._id) {
      this._selectedDeparture.set(updated);
    }
  }

  removeDeparture(id: string): void {
    this._departures.update((list) => list.filter((departure) => departure._id !== id));
    if (this._selectedDeparture()?._id === id) {
      this._selectedDeparture.set(null);
    }
  }

  markStale(): void {
    this._stale.set(true);
  }

  setDeletedDepartures(departures: Departure[]): void {
    this._deletedDepartures.set(departures);
    this._deletedLoaded.set(true);
    this._deletedLoading.set(false);
    this._deletedError.set(null);
  }

  setDeletedLoading(value: boolean): void {
    this._deletedLoading.set(value);
  }

  setDeletedError(value: string | null): void {
    this._deletedError.set(value);
    this._deletedLoading.set(false);
  }

  removeDeletedDeparture(id: string): void {
    this._deletedDepartures.update((list) => list.filter((departure) => departure._id !== id));
  }

  reset(): void {
    this._departures.set([]);
    this._loading.set(false);
    this._error.set(null);
    this._loaded.set(false);
    this._stale.set(false);
    this._filters.set({ ...DEFAULT_DEPARTURE_FILTERS });
    this._selectedDeparture.set(null);
    this._deletedDepartures.set([]);
    this._deletedLoading.set(false);
    this._deletedError.set(null);
    this._deletedLoaded.set(false);
  }
}
