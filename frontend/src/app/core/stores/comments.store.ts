import { Injectable, computed, signal } from '@angular/core';
import { Comment, CommentList, CommentPagination } from '../models/comment.model';
import { PaginationMeta } from '../models/pagination.model';

const EMPTY_PAGINATION: CommentPagination = {
  total: 0,
  page: 1,
  pageSize: 5,
  totalPages: 0
};

@Injectable()
export class CommentsStore {
  private readonly _comments = signal<Comment[]>([]);
  private readonly _pagination = signal<CommentPagination>(EMPTY_PAGINATION);
  private readonly _loading = signal(false);
  private readonly _submitting = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly comments = this._comments.asReadonly();
  readonly pagination = computed<PaginationMeta>(() => {
    const value = this._pagination();
    return {
      total: value.total,
      page: value.page,
      limit: value.pageSize,
      totalPages: value.totalPages
    };
  });
  readonly loading = this._loading.asReadonly();
  readonly submitting = this._submitting.asReadonly();
  readonly error = this._error.asReadonly();
  readonly isEmpty = computed(
    () => !this._loading() && !this._error() && this._comments().length === 0
  );

  setList(list: CommentList): void {
    this._comments.set(list.data);
    this._pagination.set(list.pagination);
  }

  upsert(comment: Comment): void {
    const exists = this._comments().some((item) => item._id === comment._id);
    this._comments.update((items) =>
      exists ? items.map((item) => (item._id === comment._id ? comment : item)) : [comment, ...items]
    );
  }

  remove(id: string): void {
    this._comments.update((items) => items.filter((item) => item._id !== id));
    this._pagination.update((value) => ({ ...value, total: Math.max(0, value.total - 1) }));
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
    this._comments.set([]);
    this._pagination.set(EMPTY_PAGINATION);
    this._loading.set(false);
    this._submitting.set(false);
    this._error.set(null);
  }
}
