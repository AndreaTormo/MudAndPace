import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdminCommentsStore, AdminCommentFilter } from '../../../../core/stores/admin-comments.store';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state';
import { ErrorState } from '../../../../shared/components/error-state/error-state';
import { Pagination } from '../../../../shared/components/pagination/pagination';
import { SkeletonLoader } from '../../../../shared/components/skeleton-loader/skeleton-loader';
import { AdminCommentRow } from '../../components/admin-comment-row/admin-comment-row';

@Component({
  selector: 'app-admin-comments',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, AdminCommentRow, SkeletonLoader, EmptyState, ErrorState, Pagination],
  template: `
    <div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div class="mb-8">
        <nav class="mb-4 flex flex-wrap items-center gap-2 text-sm text-gray-500">
          <a routerLink="/events" class="hover:text-gray-800 hover:underline">Eventos</a>
          <span>/</span>
          <span>Administración</span>
          <span>/</span>
          <span class="font-medium text-gray-800">Comentarios</span>
        </nav>
        <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 class="text-2xl font-semibold text-gray-900">Comentarios</h1>
            <p class="mt-0.5 text-sm text-gray-500">
              Revisa reportes, oculta comentarios y gestiona la papelera.
            </p>
          </div>
          <span class="badge bg-brand/10 text-brand">Administración</span>
        </div>
      </div>

      <div class="mb-6 flex flex-wrap items-center gap-2">
        @for (filter of filters; track filter.value) {
          <button type="button" [class]="filterClass(filter.value)" (click)="setFilter(filter.value)">
            {{ filter.label }}
          </button>
        }
        <span class="ml-auto text-sm text-gray-500">{{ store.count() }} comentarios</span>
        @if (store.reportedCount() > 0) {
          <span class="badge badge-draft">{{ store.reportedCount() }} reportados en esta página</span>
        }
      </div>

      @if (store.loading()) {
        <app-skeleton-loader [count]="6" />
      } @else if (store.error()) {
        <app-error-state [message]="store.error()!" (retry)="load()" />
      } @else if (store.isEmpty()) {
        <app-empty-state
          title="No hay comentarios"
          [message]="emptyMessage()"
        />
      } @else {
        <div
          class="divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-200 bg-surface/80 shadow-sm backdrop-blur-sm"
        >
          @for (comment of store.comments(); track comment._id) {
            <app-admin-comment-row
              [comment]="comment"
              [busy]="store.busyId() === comment._id"
              (toggle)="store.toggleStatus(comment)"
              (remove)="store.remove(comment)"
              (restore)="store.restore(comment)"
            />
          }
        </div>

        <div class="mt-6">
          <app-pagination
            [pagination]="store.pagination()"
            label="comentarios"
            (pageChange)="store.setPage($event)"
          />
        </div>
      }
    </div>
  `
})
export class AdminCommentsPage implements OnInit {
  protected readonly store = inject(AdminCommentsStore);

  protected readonly filters: { label: string; value: AdminCommentFilter }[] = [
    { label: 'Todos', value: '' },
    { label: 'Visibles', value: 'visible' },
    { label: 'Reportados', value: 'reported' },
    { label: 'Ocultos', value: 'hidden' },
    { label: 'Papelera', value: 'deleted' }
  ];

  ngOnInit(): void {
    void this.store.load();
  }

  protected load(): void {
    void this.store.load();
  }

  protected setFilter(value: AdminCommentFilter): void {
    this.store.setStatusFilter(value);
  }

  protected filterClass(value: AdminCommentFilter): string {
    const base =
      'rounded-lg border px-3 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40';
    if (this.store.status() === value) {
      return `${base} border-brand bg-brand text-white hover:bg-brand/90 dark:text-night`;
    }
    return `${base} border-gray-300 bg-surface text-gray-700 hover:bg-gray-50`;
  }

  protected emptyMessage(): string {
    if (this.store.status() === 'deleted') {
      return 'No hay comentarios eliminados. Los que elimines aparecerán aquí.';
    }
    if (this.store.status() === 'reported') {
      return 'No hay comentarios reportados pendientes de revisión.';
    }
    return 'Los comentarios de las salidas finalizadas aparecerán aquí.';
  }
}
