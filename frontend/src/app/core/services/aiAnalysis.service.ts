import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ApiResponse } from '../models/api.model';
import {
  CommentSummary,
  EMPTY_COMMENT_SUMMARY,
  EMPTY_SENTIMENT_REPORT,
  SentimentReport
} from '../models/aiAnalysis.model';
import { ApiService } from './api.service';

export interface SentimentQuery {
  scope: 'global' | 'departure' | 'event';
  departureId?: string;
  eventId?: string;
  includeDeleted?: boolean;
  includeRatings?: boolean;
}

@Injectable({ providedIn: 'root' })
export class AiAnalysisService {
  private readonly api = inject(ApiService);

  getCommentSummary(departureId: string): Observable<CommentSummary> {
    return this.api
      .getAi<ApiResponse<CommentSummary>>(`agent/comments/${encodeURIComponent(departureId)}/summary`)
      .pipe(map((response) => this.normalizeSummary(response?.data)));
  }

  getSentiment(query: SentimentQuery): Observable<SentimentReport> {
    let params = new HttpParams().set('scope', query.scope);
    if (query.departureId) {
      params = params.set('departureId', query.departureId);
    }
    if (query.eventId) {
      params = params.set('eventId', query.eventId);
    }
    if (query.includeDeleted) {
      params = params.set('includeDeleted', 'true');
    }
    params = params.set('includeRatings', String(query.includeRatings ?? true));

    return this.api
      .getAi<ApiResponse<SentimentReport>>('agent/comments/sentiment', params)
      .pipe(map((response) => this.normalizeReport(response?.data)));
  }

  private normalizeSummary(value: CommentSummary | undefined): CommentSummary {
    if (!value) return { ...EMPTY_COMMENT_SUMMARY };
    return {
      state: value.state === 'ready' ? 'ready' : 'no_data',
      summary: value.summary || '',
      highlights: Array.isArray(value.highlights) ? value.highlights : [],
      improvements: Array.isArray(value.improvements) ? value.improvements : [],
      commentCount: Number.isFinite(value.commentCount) ? value.commentCount : 0,
      model: value.model || '',
      generatedAt: value.generatedAt || ''
    };
  }

  private normalizeReport(value: SentimentReport | undefined): SentimentReport {
    if (!value) return { ...EMPTY_SENTIMENT_REPORT };
    return {
      ...EMPTY_SENTIMENT_REPORT,
      ...value,
      target: { ...EMPTY_SENTIMENT_REPORT.target, ...(value.target || {}) },
      distribution: value.distribution || EMPTY_SENTIMENT_REPORT.distribution,
      rankings: { ...EMPTY_SENTIMENT_REPORT.rankings, ...(value.rankings || {}) },
      ratings: { ...EMPTY_SENTIMENT_REPORT.ratings, ...(value.ratings || {}) },
      topThemes: Array.isArray(value.topThemes) ? value.topThemes : [],
      trend: Array.isArray(value.trend) ? value.trend : [],
      state: value.state === 'ready' ? 'ready' : 'no_data'
    };
  }
}
