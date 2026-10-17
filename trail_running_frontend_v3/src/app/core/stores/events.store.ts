import { Injectable, computed, effect, signal } from '@angular/core';
import { Event } from '../models/event.model';

@Injectable({ providedIn: 'root' })
export class EventsStore {
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _events = signal<Event[]>([]);
  private readonly _selectedEvent = signal<Event | null>(null);
  private readonly _loaded = signal(false);
  private readonly _stale = signal(false);
<<<<<<< HEAD
  private readonly _deletedLoading = signal(false);
  private readonly _deletedError = signal<string | null>(null);
  private readonly _deletedEvents = signal<Event[]>([]);
  private readonly _deletedLoaded = signal(false);
=======
>>>>>>> e6414492749754c86037fe5b22fe9940d3ddc0ce

  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly events = this._events.asReadonly();
  readonly selectedEvent = this._selectedEvent.asReadonly();
  readonly loaded = this._loaded.asReadonly();
  readonly stale = this._stale.asReadonly();
<<<<<<< HEAD
  readonly deletedLoading = this._deletedLoading.asReadonly();
  readonly deletedError = this._deletedError.asReadonly();
  readonly deletedEvents = this._deletedEvents.asReadonly();
  readonly deletedLoaded = this._deletedLoaded.asReadonly();
=======
>>>>>>> e6414492749754c86037fe5b22fe9940d3ddc0ce

  readonly isEmpty = computed(
    () => !this._loading() && !this._error() && this._events().length === 0
  );
  readonly count = computed(() => this._events().length);

  private readonly syncSelected = effect(() => {
    const events = this._events();
    const selected = this._selectedEvent();
    if (!selected || events.length === 0) {
      return;
    }
    const fresh = events.find((event) => event._id === selected._id);
    if (fresh && fresh !== selected) {
      this._selectedEvent.set(fresh);
    }
  });

  setLoading(value: boolean): void {
    this._loading.set(value);
  }

  setError(value: string | null): void {
    this._error.set(value);
  }

  setEvents(list: Event[]): void {
    this._events.set(list);
    this._loaded.set(true);
    this._stale.set(false);
  }

  setSelectedEvent(event: Event | null): void {
    this._selectedEvent.set(event);
  }

  patchEvent(updated: Event): void {
    this._events.update((list) =>
      list.map((event) => (event._id === updated._id ? updated : event))
    );
    if (this._selectedEvent()?._id === updated._id) {
      this._selectedEvent.set(updated);
    }
  }

  markStale(): void {
    this._stale.set(true);
  }

<<<<<<< HEAD
  setDeletedEvents(list: Event[]): void {
    this._deletedEvents.set(list);
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

  removeDeletedEvent(id: string): void {
    this._deletedEvents.update((list) => list.filter((event) => event._id !== id));
  }

  patchDeletedEvent(updated: Event): void {
    this._deletedEvents.update((list) =>
      list.map((event) => (event._id === updated._id ? updated : event))
    );
  }

=======
>>>>>>> e6414492749754c86037fe5b22fe9940d3ddc0ce
  reset(): void {
    this._loading.set(false);
    this._error.set(null);
    this._events.set([]);
    this._selectedEvent.set(null);
    this._loaded.set(false);
    this._stale.set(false);
<<<<<<< HEAD
    this._deletedLoading.set(false);
    this._deletedError.set(null);
    this._deletedEvents.set([]);
    this._deletedLoaded.set(false);
=======
>>>>>>> e6414492749754c86037fe5b22fe9940d3ddc0ce
  }
}
