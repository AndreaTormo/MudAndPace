import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ApiService } from './api.service';
import { ApiResponse } from '../models/api.model';
import {
  Comment,
  CommentList,
  CommentPagination,
  CommentStatus,
  CreateCommentPayload,
  UpdateCommentPayload
} from '../models/comment.model';

@Injectable({ providedIn: 'root' })
export class CommentService {
  private readonly api = inject(ApiService);

  list(departureId: string, page: number, pageSize: number): Observable<CommentList> {
    const params = new HttpParams().set('page', String(page)).set('pageSize', String(pageSize));
    return this.api
      .get<ApiResponse<Comment[]> & { pagination?: CommentPagination }>(
        `departures/${encodeURIComponent(departureId)}/comments`,
        params
      )
      .pipe(
        map((response) => ({
          data: Array.isArray(response?.data) ? response.data : [],
          pagination: this.normalizePagination(response?.pagination, page, pageSize)
        }))
      );
  }

  listAll(
    page: number,
    pageSize: number,
    status?: CommentStatus
  ): Observable<CommentList> {
    let params = new HttpParams().set('page', String(page)).set('pageSize', String(pageSize));
    if (status) {
      params = params.set('status', status);
    }

    return this.api
      .get<ApiResponse<Comment[]> & { pagination?: CommentPagination }>('comments', params)
      .pipe(
        map((response) => ({
          data: Array.isArray(response?.data) ? response.data : [],
          pagination: this.normalizePagination(response?.pagination, page, pageSize)
        }))
      );
  }

  create(departureId: string, payload: CreateCommentPayload): Observable<Comment> {
    return this.api
      .post<ApiResponse<Comment>>(`departures/${encodeURIComponent(departureId)}/comments`, payload)
      .pipe(map((response) => response.data));
  }

  update(commentId: string, payload: UpdateCommentPayload): Observable<Comment> {
    return this.api
      .patch<ApiResponse<Comment>>(`comments/${encodeURIComponent(commentId)}`, payload)
      .pipe(map((response) => response.data));
  }

  remove(commentId: string): Observable<Comment> {
    return this.api
      .delete<ApiResponse<Comment>>(`comments/${encodeURIComponent(commentId)}`)
      .pipe(map((response) => response.data));
  }

  setStatus(commentId: string, status: CommentStatus): Observable<Comment> {
    return this.api
      .patch<ApiResponse<Comment>>(`comments/${encodeURIComponent(commentId)}/status`, { status })
      .pipe(map((response) => response.data));
  }

  restore(commentId: string): Observable<Comment> {
    return this.api
      .patch<ApiResponse<Comment>>(`comments/${encodeURIComponent(commentId)}/restore`, {})
      .pipe(map((response) => response.data));
  }

  report(commentId: string): Observable<Comment> {
    return this.api
      .post<ApiResponse<Comment>>(`comments/${encodeURIComponent(commentId)}/report`, {})
      .pipe(map((response) => response.data));
  }

  listDeleted(page: number, pageSize: number): Observable<CommentList> {
    const params = new HttpParams().set('page', String(page)).set('pageSize', String(pageSize));
    return this.api
      .get<ApiResponse<Comment[]> & { pagination?: CommentPagination }>('comments/deleted', params)
      .pipe(
        map((response) => ({
          data: Array.isArray(response?.data) ? response.data : [],
          pagination: this.normalizePagination(response?.pagination, page, pageSize)
        }))
      );
  }

  private normalizePagination(
    value: CommentPagination | undefined,
    page: number,
    pageSize: number
  ): CommentPagination {
    if (
      !value ||
      !Number.isFinite(value.total) ||
      !Number.isFinite(value.page) ||
      !Number.isFinite(value.pageSize) ||
      !Number.isFinite(value.totalPages)
    ) {
      return { total: 0, page, pageSize, totalPages: 0 };
    }
    return value;
  }
}
