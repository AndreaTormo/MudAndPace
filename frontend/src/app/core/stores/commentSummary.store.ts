import { Injectable, signal } from '@angular/core';
import { CommentSummary, EMPTY_COMMENT_SUMMARY } from '../models/aiAnalysis.model';

@Injectable()
export class CommentSummaryStore {
  private readonly _summary = signal<CommentSummary>({ ...EMPTY_COMMENT_SUMMARY });
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly summary = this._summary.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  setSummary(value: CommentSummary): void {
    this._summary.set(value);
  }

  setLoading(value: boolean): void {
    this._loading.set(value);
  }

  setError(value: string | null): void {
    this._error.set(value);
  }

  reset(): void {
    this._summary.set({ ...EMPTY_COMMENT_SUMMARY });
    this._loading.set(false);
    this._error.set(null);
  }
}
