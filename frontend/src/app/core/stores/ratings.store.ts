import { Injectable, computed, signal } from '@angular/core';
import { EMPTY_RATING_SUMMARY, RatingSummary } from '../models/rating.model';

@Injectable()
export class RatingsStore {
  private readonly _summary = signal<RatingSummary>({ ...EMPTY_RATING_SUMMARY });
  private readonly _loading = signal(false);
  private readonly _submitting = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly summary = this._summary.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly submitting = this._submitting.asReadonly();
  readonly error = this._error.asReadonly();
  readonly isEmpty = computed(
    () => !this._loading() && !this._error() && this._summary().total === 0
  );

  setSummary(value: RatingSummary): void {
    this._summary.set(value);
  }

  setLoading(value: boolean): void {
    this._loading.set(value);
  }

  setSubmitting(value: boolean): void {
    this._submitting.set(value);
  }

  setError(value: string | null): void {
    this._error.set(value);
  }

  reset(): void {
    this._summary.set({ ...EMPTY_RATING_SUMMARY });
    this._loading.set(false);
    this._submitting.set(false);
    this._error.set(null);
  }
}
