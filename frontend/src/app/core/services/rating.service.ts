import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiResponse } from '../models/api.model';
import {
  EMPTY_RATING_SUMMARY,
  RatingMutation,
  RatingSummary,
  RatePayload
} from '../models/rating.model';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class RatingService {
  private readonly api = inject(ApiService);

  get(departureId: string): Observable<RatingSummary> {
    return this.api
      .get<ApiResponse<RatingSummary>>(`departures/${encodeURIComponent(departureId)}/ratings`)
      .pipe(map((response) => this.normalizeSummary(response?.data)));
  }

  save(departureId: string, score: number, review = ''): Observable<RatingMutation> {
    const payload: RatePayload = { score, review };
    return this.api
      .put<ApiResponse<RatingMutation>>(
        `departures/${encodeURIComponent(departureId)}/ratings`,
        payload
      )
      .pipe(map((response) => this.normalizeMutation(response?.data)));
  }

  remove(departureId: string): Observable<RatingMutation> {
    return this.api
      .delete<ApiResponse<RatingMutation>>(
        `departures/${encodeURIComponent(departureId)}/ratings`
      )
      .pipe(map((response) => this.normalizeMutation(response?.data)));
  }

  private normalizeMutation(value: RatingMutation | undefined): RatingMutation {
    return {
      rating: value?.rating ?? null,
      summary: this.normalizeSummary(value?.summary)
    };
  }

  private normalizeSummary(value: RatingSummary | undefined): RatingSummary {
    if (!value || !Number.isFinite(value.total)) {
      return { ...EMPTY_RATING_SUMMARY };
    }
    return {
      average: Number.isFinite(value.average) ? value.average : null,
      total: value.total,
      mine: Number.isFinite(value.mine) ? value.mine : null
    };
  }
}
