import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, input, output, signal } from '@angular/core';
import { ShopEvent } from '../../../../core/models/shop.model';
import { resolveAssetUrl } from '../../../../shared/utils/asset.util';
import {
  formatDate,
  formatDistance,
  formatElevation,
  formatPrice
} from '../../../../shared/utils/format.util';

@Component({
  selector: 'app-event-shop-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgClass],
  template: `
    <button
      type="button"
      (click)="selected.emit(event())"
      class="group flex h-full w-full flex-col overflow-hidden rounded-2xl border border-gray-100 bg-surface text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
      <div
        class="relative shrink-0 overflow-hidden bg-gradient-to-br from-brand/10 to-brand/25"
        [ngClass]="featured() ? 'h-56 sm:h-64' : 'h-44'"
      >
        @if (showImage(); as url) {
          <img
            [src]="url"
            [alt]="event().name"
            loading="lazy"
            (error)="imageFailed.set(true)"
            class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        } @else {
          <div class="flex h-full w-full items-center justify-center">
            <svg class="h-12 w-12 text-brand/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        }

        @if (event().category; as category) {
          <span class="absolute left-3 top-3 rounded-full bg-surface/90 px-2 py-0.5 text-xs font-medium text-brand shadow-sm">
            {{ category.name }}
          </span>
        }
      </div>

      <div class="flex flex-1 flex-col" [ngClass]="featured() ? 'p-5 sm:p-6' : 'p-4'">
        <h3
          class="line-clamp-2 font-display font-semibold leading-snug text-gray-900 transition-colors group-hover:text-brand"
          [ngClass]="featured() ? 'text-xl sm:text-2xl' : 'text-base'"
        >
          {{ event().name }}
        </h3>

        @if (featured() && event().description) {
          <p class="mt-2 line-clamp-3 text-sm text-gray-600">{{ event().description }}</p>
        }

        <div class="mt-2 space-y-1 text-xs text-gray-500">
          <span class="flex items-center gap-1.5">
            <svg class="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="17" rx="2" />
              <path stroke-linecap="round" d="M8 2v4M16 2v4M3 10h18" />
            </svg>
            {{ dateText() }}
          </span>

          <span class="flex items-center gap-1.5">
            <svg class="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            </svg>
            <span class="truncate">{{ locationText() }}</span>
          </span>

          @if (event().host; as host) {
            <span class="flex items-center gap-1.5">
              <svg class="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span class="truncate">{{ host.name }}</span>
            </span>
          }
        </div>

        @if (featured() && variants().length > 0) {
          <div class="mt-3 flex flex-wrap gap-1.5">
            @for (variant of variants(); track $index) {
              <span class="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                {{ variant.name }} · {{ formatDistance(variant.distanceKm) }}
              </span>
            }
          </div>
        }

        <div class="mt-auto flex items-end justify-between gap-2 pt-3">
          <span class="text-xs text-gray-500">
            {{ distanceText() }} · {{ elevationText() }}
          </span>
          <span class="text-sm font-semibold text-brand">{{ priceText() }}</span>
        </div>
      </div>
    </button>
  `
})
export class EventShopCard {
  readonly event = input.required<ShopEvent>();
  readonly featured = input(false);
  readonly selected = output<ShopEvent>();

  protected readonly variants = computed(() => this.event().variants ?? []);
  protected readonly formatDistance = formatDistance;

  protected readonly imageFailed = signal(false);
  protected readonly imageUrl = computed(() => {
    const images = this.event().images ?? [];
    if (!Array.isArray(images) || images.length === 0) {
      return null;
    }
    const cover = images.find((image) => image?.isCover) ?? images[0];
    const rawUrl = cover?.url;
    if (typeof rawUrl !== 'string' || !rawUrl.trim()) {
      return null;
    }
    return resolveAssetUrl(rawUrl);
  });
  protected readonly showImage = computed(() => (this.imageFailed() ? null : this.imageUrl()));

  private readonly syncImageState = effect(() => {
    this.event();
    this.imageFailed.set(false);
  }, { allowSignalWrites: true });

  protected readonly dateText = computed(() => formatDate(this.event().startDate));

  protected readonly locationText = computed(() => {
    const location = this.event().location;
    if (!location) {
      return 'Ubicación por confirmar';
    }
    return location.city ? `${location.city} · ${location.name}` : location.name;
  });

  protected readonly distanceText = computed(() => formatDistance(this.event().distanceKm));
  protected readonly elevationText = computed(() => formatElevation(this.event().elevationGain));
  protected readonly priceText = computed(() => formatPrice(this.event().price));
}
