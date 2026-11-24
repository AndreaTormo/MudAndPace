import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import Swal from 'sweetalert2';
import { Comment, CommentPagination, CommentStatus } from '../models/comment.model';
import { PaginationMeta } from '../models/pagination.model';
import { CommentService } from '../services/comment.service';

export type AdminCommentFilter = CommentStatus | 'deleted' | '';

const PAGE_SIZE = 10;

function emptyPagination(): CommentPagination {
  return { total: 0, page: 1, pageSize: PAGE_SIZE, totalPages: 0 };
}

@Injectable({ providedIn: 'root' })
export class AdminCommentsStore {
  private readonly commentService = inject(CommentService);

  private readonly _comments = signal<Comment[]>([]);
  private readonly _pagination = signal<CommentPagination>(emptyPagination());
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _status = signal<AdminCommentFilter>('');
  private readonly _busyId = signal<string | null>(null);
  private loadToken = 0;

  readonly comments = this._comments.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly status = this._status.asReadonly();
  readonly busyId = this._busyId.asReadonly();

  readonly count = computed(() => this._pagination().total);
  readonly reportedCount = computed(
    () => this._comments().filter((comment) => comment.status === 'reported').length
  );
  readonly hiddenCount = computed(
    () => this._comments().filter((comment) => comment.status === 'hidden').length
  );
  readonly isEmpty = computed(
    () => !this._loading() && !this._error() && this._comments().length === 0
  );

  readonly pagination = computed<PaginationMeta>(() => {
    const { total, page, pageSize, totalPages } = this._pagination();
    return { total, page, limit: pageSize, totalPages };
  });

  async load(page: number = this._pagination().page): Promise<void> {
    const token = ++this.loadToken;
    const status = this._status();
    this._loading.set(true);
    this._error.set(null);

    try {
      if (status === 'deleted') {
        const result = await firstValueFrom(this.commentService.listDeleted(page, PAGE_SIZE));
        if (token !== this.loadToken) return;
        this._comments.set(result.data);
        this._pagination.set(result.pagination);
      } else {
        const result = await firstValueFrom(
          this.commentService.listAll(page, PAGE_SIZE, status || undefined)
        );
        if (token !== this.loadToken) return;
        this._comments.set(result.data);
        this._pagination.set(result.pagination);
      }
    } catch {
      if (token === this.loadToken) {
        this._error.set('No se han podido cargar los comentarios. Inténtalo de nuevo.');
      }
    } finally {
      if (token === this.loadToken) {
        this._loading.set(false);
      }
    }
  }

  setStatusFilter(status: AdminCommentFilter): void {
    if (this._status() === status) return;
    this._status.set(status);
    void this.load(1);
  }

  setPage(page: number): void {
    void this.load(page);
  }

  async toggleStatus(comment: Comment): Promise<void> {
    if (this._busyId()) return;

    const next: CommentStatus =
      comment.status === 'visible' || comment.status === 'reported' ? 'hidden' : 'visible';
    this._busyId.set(comment._id);
    this._error.set(null);

    try {
      const updated = await firstValueFrom(this.commentService.setStatus(comment._id, next));
      this.replaceOrRemove(updated, comment, next === 'visible');
    } catch {
      this._error.set('No se ha podido actualizar el comentario. Inténtalo de nuevo.');
    } finally {
      this._busyId.set(null);
    }
  }

  async remove(comment: Comment): Promise<void> {
    if (this._busyId()) return;

    const author = [comment.author.firstName, comment.author.lastName]
      .filter(Boolean)
      .join(' ')
      .trim();
    const result = await Swal.fire({
      title: '¿Eliminar comentario?',
      text: `El comentario de ${author || 'este usuario'} pasará a la papelera. Podrás recuperarlo después.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#A3B18A',
      cancelButtonColor: 'rgb(var(--line))',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (!result.isConfirmed) {
      return;
    }

    this._busyId.set(comment._id);
    this._error.set(null);

    try {
      await firstValueFrom(this.commentService.remove(comment._id));
      this.decrementTotal();
      await this.reloadCurrentPage();
      void Swal.fire({
        icon: 'success',
        title: 'Comentario eliminado',
        text: 'El comentario se ha movido a la papelera. Puedes recuperarlo desde allí.',
        timer: 2000,
        showConfirmButton: false
      });
    } catch {
      this._error.set('No se ha podido eliminar el comentario. Inténtalo de nuevo.');
    } finally {
      this._busyId.set(null);
    }
  }

  async restore(comment: Comment): Promise<void> {
    if (this._busyId()) return;

    this._busyId.set(comment._id);
    this._error.set(null);

    try {
      await firstValueFrom(this.commentService.restore(comment._id));
      await this.reloadCurrentPage();
      void Swal.fire({
        icon: 'success',
        title: 'Comentario restaurado',
        timer: 2000,
        showConfirmButton: false
      });
    } catch {
      this._error.set('No se ha podido restaurar el comentario. Inténtalo de nuevo.');
    } finally {
      this._busyId.set(null);
    }
  }

  private replaceOrRemove(updated: Comment, previous: Comment, becameVisible: boolean): void {
    const status = this._status();
    const shouldKeep =
      status === '' || status === updated.status || (becameVisible && status === 'visible');

    if (!shouldKeep) {
      this._comments.update((items) => items.filter((item) => item._id !== previous._id));
      this.decrementTotal();
      return;
    }

    this._comments.update((items) =>
      items.map((item) => (item._id === updated._id ? updated : item))
    );
  }

  private decrementTotal(): void {
    this._pagination.update((value) => ({ ...value, total: Math.max(0, value.total - 1) }));
  }

  private async reloadCurrentPage(): Promise<void> {
    const { total, page } = this._pagination();
    const totalPages = total === 0 ? 0 : Math.ceil(total / PAGE_SIZE);
    await this.load(Math.min(page, Math.max(1, totalPages)));
  }
}
