import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { resolveAssetUrl } from '../../../../shared/utils/asset.util';

const HERO_IMAGES = [
  '/uploads/carousel/carousel.jpg',
  '/uploads/carousel/carousel1.jpg',
  '/uploads/carousel/carousel2.jpg',
  '/uploads/carousel/carousel3.jpg',
  '/uploads/carousel/carousel4.jpg',
  '/uploads/carousel/carousel5.jpg',
  '/uploads/carousel/carousel6.jpg'
];

const ROTATE_INTERVAL_MS = 5000;

@Component({
  selector: 'app-shop-hero',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <section class="relative overflow-hidden rounded-3xl shadow-lg">
      <div class="relative h-[420px] sm:h-[480px] lg:h-[520px]">
        @for (image of images; track image; let index = $index) {
          <img
            [src]="image"
            alt="Trail running"
            class="absolute inset-0 h-full w-full object-cover transition-opacity duration-700"
            [class.opacity-0]="activeIndex() !== index"
            [class.opacity-100]="activeIndex() === index"
            [class.pointer-events-none]="activeIndex() !== index"
          />
        }

        <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-black/10"></div>

        <div class="absolute inset-0 flex items-center">
          <div class="mx-auto w-full max-w-3xl px-6 py-14 text-center text-white sm:px-12 sm:py-20">
            <p class="text-sm font-medium uppercase tracking-[0.2em] text-white/80">MudAndPace Shop</p>
            <h1 class="mt-3 text-4xl font-bold leading-tight sm:text-5xl">
              Encuentra tu próxima experiencia de trail
            </h1>
            <p class="mx-auto mt-4 max-w-2xl text-base text-white/85 sm:text-lg">
              Explora experiencias por categoría, organizador o destino y elige la salida que mejor encaja contigo.
            </p>
            <a
              [routerLink]="['/shop/experiences']"
              [queryParams]="queryParams()"
              class="mt-8 inline-flex items-center justify-center rounded-xl bg-surface px-5 py-3 text-sm font-semibold text-brand shadow-sm transition-colors hover:bg-surface/90"
            >
              Ver todas las experiencias
            </a>
          </div>
        </div>

        @if (images.length > 1) {
          <button
            type="button"
            (click)="prev()"
            aria-label="Anterior"
            class="overlay-control absolute left-4 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full"
          >
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            type="button"
            (click)="next()"
            aria-label="Siguiente"
            class="overlay-control absolute right-4 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full"
          >
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <div class="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-2">
            @for (image of images; track image; let index = $index) {
              <button
                type="button"
                (click)="goTo(index)"
                [attr.aria-label]="'Ir a la imagen ' + (index + 1)"
                class="h-2.5 rounded-full transition-all"
                [class]="activeIndex() === index ? 'w-6 bg-white' : 'w-2.5 bg-white/60 hover:bg-white/80'"
              ></button>
            }
          </div>
        }
      </div>
    </section>
  `
})
export class ShopHero implements OnInit, OnDestroy {
  readonly queryParams = input<Record<string, string>>({});
  protected readonly images = HERO_IMAGES.map((url) => resolveAssetUrl(url));
  protected readonly activeIndex = signal(0);

  private timer?: number;

  ngOnInit(): void {
    this.timer = window.setInterval(() => this.next(), ROTATE_INTERVAL_MS);
  }

  ngOnDestroy(): void {
    if (this.timer !== undefined) {
      window.clearInterval(this.timer);
    }
  }

  protected next(): void {
    this.activeIndex.update((index) => (index + 1) % this.images.length);
  }

  protected prev(): void {
    this.activeIndex.update((index) => (index - 1 + this.images.length) % this.images.length);
  }

  protected goTo(index: number): void {
    this.activeIndex.set(index);
  }
}
