import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { EMPTY_SENTIMENT_REPORT, SentimentReport } from '../models/aiAnalysis.model';
import { AiAnalysisService, SentimentQuery } from '../services/aiAnalysis.service';

function errorMessage(error: unknown): string {
  const body = (error as HttpErrorResponse | undefined)?.error as
    | { error?: { message?: string } }
    | undefined;
  return body?.error?.message || 'No se ha podido cargar el análisis de sentimiento. Inténtalo de nuevo.';
}

@Injectable()
export class AdminSentimentStore {
  private readonly service = inject(AiAnalysisService);

  private readonly _report = signal<SentimentReport>({ ...EMPTY_SENTIMENT_REPORT });
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _includeDeleted = signal(false);

  readonly report = this._report.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly includeDeleted = this._includeDeleted.asReadonly();

  setReport(value: SentimentReport): void {
    this._report.set(value);
  }

  setLoading(value: boolean): void {
    this._loading.set(value);
  }

  setError(value: string | null): void {
    this._error.set(value);
  }

  setIncludeDeleted(value: boolean): void {
    this._includeDeleted.set(value);
  }

  reset(): void {
    this._report.set({ ...EMPTY_SENTIMENT_REPORT });
    this._loading.set(false);
    this._error.set(null);
  }

  async load(query: SentimentQuery): Promise<void> {
    this._loading.set(true);
    this._error.set(null);
    try {
      const report = await firstValueFrom(this.service.getSentiment(query));
      this._report.set(report);
    } catch (error) {
      this._error.set(errorMessage(error));
    } finally {
      this._loading.set(false);
    }
  }
}
