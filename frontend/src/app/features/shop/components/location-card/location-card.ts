import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { EventLocation } from '../../../../core/models/event.model';
import { resolveAssetUrl } from '../../../../shared/utils/asset.util';

@Component({
  selector: 'app-location-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      type="button"
      (click)="selected.emit(location())"
      class="group flex w-full flex-col items-center gap-2 rounded-2xl border border-gray-200 bg-white p-4 text-center transition-all hover:border-brand hover:shadow-md"
    >
      <div class="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-brand/10 transition-colors group-hover:bg-brand/20">
        @if (imageUrl(); as url) {
          <img [src]="url" [alt]="location().name" class="h-full w-full object-cover" loading="lazy" />
        } @else {
          <svg class="h-6 w-6 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
            <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        }
      </div>
      <div>
        <p class="text-sm font-medium leading-tight text-gray-800 transition-colors group-hover:text-brand">
          {{ location().name }}
        </p>
        @if (location().city) {
          <p class="mt-0.5 text-xs text-gray-500">{{ location().city }}</p>
        }
      </div>
    </button>
  `
})
export class LocationCard {
  readonly location = input.required<EventLocation>();
  readonly selected = output<EventLocation>();

  protected readonly imageUrl = computed(() => {
    const url = this.location().imageUrl?.trim();
    return url ? resolveAssetUrl(url) : null;
  });
}
