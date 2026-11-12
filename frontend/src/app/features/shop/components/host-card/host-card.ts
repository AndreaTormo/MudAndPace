import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { EventHost } from '../../../../core/models/event.model';
import { resolveAssetUrl } from '../../../../shared/utils/asset.util';

@Component({
  selector: 'app-host-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      type="button"
      (click)="selected.emit(host())"
      class="group flex w-full flex-col items-center gap-2 rounded-2xl border border-gray-200 bg-surface p-4 text-center transition-all hover:border-brand hover:shadow-md"
    >
      <div class="flex h-14 w-28 items-center justify-center overflow-hidden rounded-xl bg-surface p-1.5 ring-1 ring-gray-100 transition-colors group-hover:bg-gray-50">
        @if (imageUrl(); as url) {
          <img [src]="url" [alt]="host().name" class="h-full w-full object-contain" loading="lazy" />
        } @else {
          <span class="text-xl font-bold uppercase text-brand">
            {{ host().name.charAt(0) }}
          </span>
        }
      </div>
      <span class="text-sm font-medium leading-tight text-gray-800 transition-colors group-hover:text-brand">
        {{ host().name }}
      </span>
    </button>
  `
})
export class HostCard {
  readonly host = input.required<EventHost>();
  readonly selected = output<EventHost>();

  protected readonly imageUrl = computed(() => {
    const url = this.host().imageUrl?.trim();
    return url ? resolveAssetUrl(url) : null;
  });
}
