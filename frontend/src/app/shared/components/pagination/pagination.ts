import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { PaginationMeta } from '../../../core/models/pagination.model';

@Component({
  selector: 'app-pagination',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (pagination().totalPages > 1) {
      <div class="flex items-center justify-center gap-1">
        <button
          type="button"
          [disabled]="pagination().page <= 1"
          (click)="pageChange.emit(pagination().page - 1)"
          class="rounded-lg border border-gray-300 bg-surface px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          ← Anterior
        </button>

        @for (page of pages(); track page) {
          @if (page === -1) {
            <span class="px-2 text-gray-400">…</span>
          } @else {
            <button
              type="button"
              (click)="pageChange.emit(page)"
              [class]="pageClass(page)"
            >
              {{ page }}
            </button>
          }
        }

        <button
          type="button"
          [disabled]="pagination().page >= pagination().totalPages"
          (click)="pageChange.emit(pagination().page + 1)"
          class="rounded-lg border border-gray-300 bg-surface px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Siguiente →
        </button>
      </div>

      <p class="mt-2 text-center text-xs text-gray-500">
        Mostrando {{ rangeStart() }}–{{ rangeEnd() }} de {{ pagination().total }} {{ label() }}
      </p>
    }
  `
})
export class Pagination {
  readonly pagination = input.required<PaginationMeta>();
  readonly label = input('experiencias');
  readonly pageChange = output<number>();

  readonly pages = computed(() => {
    const { page, totalPages } = this.pagination();
    const range: number[] = [];
    const delta = 2;

    for (let index = 1; index <= totalPages; index++) {
      if (
        index === 1 ||
        index === totalPages ||
        (index >= page - delta && index <= page + delta)
      ) {
        range.push(index);
      } else if (range[range.length - 1] !== -1) {
        range.push(-1);
      }
    }

    return range;
  });

  readonly rangeStart = computed(() => {
    const { page, limit } = this.pagination();
    return (page - 1) * limit + 1;
  });

  readonly rangeEnd = computed(() => {
    const { page, limit, total } = this.pagination();
    return Math.min(page * limit, total);
  });

  protected pageClass(page: number): string {
    const current = this.pagination().page;
    const base = 'h-9 w-9 rounded-lg text-sm font-medium transition-colors';
    if (page === current) {
      return `${base} border border-brand bg-brand text-white dark:text-night`;
    }
    return `${base} border border-gray-300 bg-surface text-gray-700 hover:bg-gray-50`;
  }
}
