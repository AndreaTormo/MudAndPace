import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, finalize, forkJoin, tap } from 'rxjs';
import {
  Activity,
  ActivityEstimate,
  ActivityEstimatePayload,
  ActivityPayload,
  ActivityStats
} from '../models/activity.model';
import { ActivityService } from '../services/activity.service';
import { AuthStore } from './auth.store';

const EMPTY_STATS: ActivityStats = {
  activities: 0,
  totalDistanceKm: 0,
  totalElevationGainM: 0,
  totalDurationSec: 0,
  totalDuration: '0:00:00',
  totalCalories: 0,
  avgPaceMinPerKm: null
};

function sortActivities(activities: Activity[]): Activity[] {
  return [...activities].sort((a, b) => {
    const byDate = new Date(b.date).getTime() - new Date(a.date).getTime();
    if (byDate !== 0) {
      return byDate;
    }
    return b.id.localeCompare(a.id);
  });
}

@Injectable({ providedIn: 'root' })
export class ActivityStore {
  private readonly activityService = inject(ActivityService);
  private readonly auth = inject(AuthStore);
  private requestId = 0;

  private readonly _activities = signal<Activity[]>([]);
  private readonly _stats = signal<ActivityStats>(EMPTY_STATS);
  private readonly _eventId = signal<string | null>(null);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _saving = signal(false);
  private readonly _estimate = signal<ActivityEstimate | null>(null);
  private readonly _estimateLoading = signal(false);
  private readonly _estimateError = signal<string | null>(null);

  readonly activities = this._activities.asReadonly();
  readonly stats = this._stats.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly saving = this._saving.asReadonly();
  readonly estimatePreview = this._estimate.asReadonly();
  readonly estimateLoading = this._estimateLoading.asReadonly();
  readonly estimateError = this._estimateError.asReadonly();

  readonly hasActivities = computed(() => this._activities().length > 0);
  readonly isEmpty = computed(
    () => !this._loading() && !this._error() && this._activities().length === 0
  );

  load(eventId: string | null): void {
    const userId = this.auth.user()?._id;
    this._eventId.set(eventId);

    if (!userId) {
      this.reset();
      return;
    }

    const requestId = ++this.requestId;
    this._loading.set(true);
    this._error.set(null);

    forkJoin({
      list: this.activityService.list(userId, { eventId: eventId ?? undefined, limit: 50 }),
      stats: this.activityService.stats(userId, eventId ?? undefined)
    }).subscribe({
      next: ({ list, stats }) => {
        if (requestId !== this.requestId) {
          return;
        }
        this._activities.set(sortActivities(list.items));
        this._stats.set(stats);
        this._loading.set(false);
      },
      error: () => {
        if (requestId !== this.requestId) {
          return;
        }
        this._activities.set([]);
        this._stats.set(EMPTY_STATS);
        this._loading.set(false);
        this._error.set('No se han podido cargar tus actividades.');
      }
    });
  }

  create(payload: ActivityPayload): Observable<Activity> {
    const userId = this.requireUserId();
    this._saving.set(true);

    return this.activityService.create(userId, payload).pipe(
      tap((activity) => {
        this._activities.update((activities) => sortActivities([activity, ...activities]));
        this.refreshStats();
      }),
      finalize(() => this._saving.set(false))
    );
  }

  update(id: string, payload: Partial<ActivityPayload>): Observable<Activity> {
    const userId = this.requireUserId();
    this._saving.set(true);

    return this.activityService.update(id, userId, payload).pipe(
      tap((activity) => {
        this._activities.update((activities) =>
          sortActivities(activities.map((item) => (item.id === activity.id ? activity : item)))
        );
        this.refreshStats();
      }),
      finalize(() => this._saving.set(false))
    );
  }

  remove(id: string): Observable<void> {
    const userId = this.requireUserId();
    this._saving.set(true);

    return this.activityService.remove(id, userId).pipe(
      tap(() => {
        this._activities.update((activities) => activities.filter((item) => item.id !== id));
        this.refreshStats();
      }),
      finalize(() => this._saving.set(false))
    );
  }

  estimate(payload: ActivityEstimatePayload): void {
    this._estimateLoading.set(true);
    this._estimateError.set(null);
    this._estimate.set(null);

    this.activityService.estimate(payload).subscribe({
      next: (estimate) => {
        this._estimate.set(estimate);
        this._estimateLoading.set(false);
      },
      error: () => {
        this._estimateLoading.set(false);
        this._estimateError.set('No se ha podido calcular la estimación.');
      }
    });
  }

  clearEstimate(): void {
    this._estimate.set(null);
    this._estimateError.set(null);
    this._estimateLoading.set(false);
  }

  reset(): void {
    this.requestId += 1;
    this._activities.set([]);
    this._stats.set(EMPTY_STATS);
    this._eventId.set(null);
    this._loading.set(false);
    this._error.set(null);
    this._saving.set(false);
    this.clearEstimate();
  }

  private refreshStats(): void {
    const userId = this.auth.user()?._id;
    if (!userId) {
      return;
    }

    this.activityService
      .stats(userId, this._eventId() ?? undefined)
      .subscribe({ next: (stats) => this._stats.set(stats) });
  }

  private requireUserId(): string {
    const userId = this.auth.user()?._id;
    if (!userId) {
      throw new Error('NO_USER');
    }
    return userId;
  }
}
