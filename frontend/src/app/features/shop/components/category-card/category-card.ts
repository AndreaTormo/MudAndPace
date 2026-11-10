import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { EventCategory } from '../../../../core/models/event.model';
import { resolveAssetUrl } from '../../../../shared/utils/asset.util';

@Component({
  selector: 'app-category-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      type="button"
      (click)="selected.emit(category())"
      class="group flex w-full flex-col items-center gap-2 rounded-2xl border border-gray-200 bg-white p-4 text-center transition-all hover:border-brand hover:shadow-md"
    >
      <div class="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-brand/10 transition-colors group-hover:bg-brand/20">
        @if (imageUrl(); as url) {
          <img [src]="url" [alt]="category().name" class="h-full w-full object-cover" loading="lazy" />
        } @else {
          <svg class="h-6 w-6 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
            <path stroke-linecap="round" stroke-linejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
        }
      </div>
      <span class="text-sm font-medium leading-tight text-gray-800 transition-colors group-hover:text-brand">
        {{ category().name }}
      </span>
    </button>
  `
})
export class CategoryCard {
  readonly category = input.required<EventCategory>();
  readonly selected = output<EventCategory>();

  protected readonly imageUrl = computed(() => {
    const url = this.category().imageUrl?.trim();
    return url ? resolveAssetUrl(url) : null;
  });
}
