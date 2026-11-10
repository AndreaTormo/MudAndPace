import {
  ChangeDetectionStrategy,
  Component,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  computed,
  inject,
  input,
  signal
} from '@angular/core';
import { EventImage } from '../../../../core/models/event.model';
import { EventImagesStore } from '../../../../core/stores/event-images.store';
import { resolveAssetUrl } from '../../../../shared/utils/asset.util';

@Component({
  selector: 'app-event-gallery',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [EventImagesStore],
  template: `
    <section class="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      @if (loading()) {
        <div class="aspect-[16/10] animate-pulse bg-gray-200"></div>
      } @else if (error()) {
        <div class="p-5 text-sm text-red-600">{{ error() }}</div>
      } @else if (images().length) {
        <div class="relative aspect-[16/10] bg-gradient-to-br from-brand/10 to-brand/25">
          @if (activeImageUrl(); as url) {
            <img
              [src]="url"
              [alt]="activeImage()?.alt || 'Foto del evento'"
              class="h-full w-full object-cover"
            />
          }

          @if (hasMultiple()) {
            <button
              type="button"
              (click)="prev()"
              aria-label="Imagen anterior"
              class="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow-md transition hover:bg-white"
            >
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              type="button"
              (click)="next()"
              aria-label="Imagen siguiente"
              class="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow-md transition hover:bg-white"
            >
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          }
        </div>

        @if (images().length > 1) {
          <div class="flex gap-2 overflow-x-auto p-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            @for (image of images(); track image._id; let index = $index) {
              <button
                type="button"
                (click)="show(index)"
                class="h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 transition"
                [class]="index === activeIndex() ? 'border-brand' : 'border-transparent opacity-70 hover:opacity-100'"
              >
                <img
                  [src]="resolveAssetUrl(image.url)"
                  [alt]="image.alt || 'Foto del evento'"
                  class="h-full w-full object-cover"
                  loading="lazy"
                />
              </button>
            }
          </div>
        }
      } @else {
        <p class="p-5 text-sm text-gray-500">Este evento todavía no tiene fotos.</p>
      }
    </section>
  `
})
export class EventGallery implements OnInit, OnChanges, OnDestroy {
  private readonly store = inject(EventImagesStore);

  readonly eventId = input.required<string>();

  protected readonly images = this.store.images;
  protected readonly loading = this.store.loading;
  protected readonly error = this.store.error;
  protected readonly activeIndex = signal(0);
  protected readonly resolveAssetUrl = resolveAssetUrl;

  protected readonly activeImage = computed<EventImage | null>(() => {
    const images = this.images();
    return images[this.activeIndex()] ?? images[0] ?? null;
  });

  protected readonly activeImageUrl = computed(() => {
    const image = this.activeImage();
    return image ? resolveAssetUrl(image.url) : null;
  });

  protected readonly hasMultiple = computed(() => this.images().length > 1);

  ngOnInit(): void {
    void this.store.load(this.eventId());
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['eventId'] && !changes['eventId'].firstChange) {
      this.activeIndex.set(0);
      void this.store.load(this.eventId());
    }
  }

  ngOnDestroy(): void {
    this.store.reset();
  }

  protected show(index: number): void {
    this.activeIndex.set(index);
  }

  protected prev(): void {
    const total = this.images().length;
    if (total === 0) {
      return;
    }
    this.activeIndex.update((index) => (index - 1 + total) % total);
  }

  protected next(): void {
    const total = this.images().length;
    if (total === 0) {
      return;
    }
    this.activeIndex.update((index) => (index + 1) % total);
  }
}
