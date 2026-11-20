import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  computed,
  input,
  signal
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { resolveAssetUrl } from '../../../../shared/utils/asset.util';
import { MountainDivider } from '../mountain-divider/mountain-divider';

const HERO_IMAGES = [
  '/uploads/carousel/carousel.jpg',
  '/uploads/carousel/carousel1.jpg',
  '/uploads/carousel/carousel2.jpg',
  '/uploads/carousel/carousel3.jpg',
  '/uploads/carousel/carousel4.jpg',
  '/uploads/carousel/carousel5.jpg',
  '/uploads/carousel/carousel6.jpg',
  '/uploads/carousel/carousel7.jpg'
];

const ROTATE_INTERVAL_MS = 5000;
const CAROUSEL_VERSION = '20261117';

@Component({
  selector: 'app-shop-hero',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, MountainDivider],
  template: `
    <section
      class="relative isolate flex min-h-[100svh] flex-col overflow-hidden bg-forest"
      aria-label="Portada de Mud and Pace"
      (mouseenter)="hovering.set(true)"
      (mouseleave)="onMouseLeave()"
      (focusin)="focusWithin.set(true)"
      (focusout)="onFocusOut($event)"
    >
      @for (image of images; track image; let index = $index) {
        <img
          [src]="image"
          alt=""
          aria-hidden="true"
          [attr.loading]="index === 0 ? 'eager' : 'lazy'"
          [attr.fetchpriority]="index === 0 ? 'high' : null"
          class="absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-1000 ease-out motion-reduce:transition-none"
          [class.opacity-0]="activeIndex() !== index"
          [class.opacity-100]="activeIndex() === index"
          [class.pointer-events-none]="activeIndex() !== index"
        />
      }

      <div
        class="absolute inset-0 bg-gradient-to-r from-[#14220E]/90 via-[#14220E]/55 to-[#14220E]/10"
      ></div>
      <div
        class="absolute inset-0 bg-gradient-to-t from-[#14220E]/90 via-[#14220E]/25 to-[#14220E]/45 dark:from-[#14220E]/70 dark:via-[#14220E]/20 dark:to-[#14220E]/35"
      ></div>

      <div
        class="relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col justify-end px-5 pb-32 pt-28 sm:px-8 sm:pb-36 lg:px-12 lg:pb-44"
      >
        <div class="max-w-3xl text-center lg:text-left">
          <p
            class="text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-cream/80 sm:text-xs"
          >
            Trail running · Comunidad
          </p>
          <h1
            class="mt-4 font-display text-[clamp(2.5rem,7vw,5.25rem)] font-bold leading-[1.04] tracking-[-0.02em] text-cream"
          >
            No hay montaña lo suficientemente alta.
          </h1>
          <p
            class="mx-auto mt-5 max-w-xl text-base leading-relaxed text-cream/80 sm:text-lg lg:mx-0 lg:max-w-2xl"
          >
            Barro, desnivel y montaña. Encuentra tu próxima salida de trail.
          </p>
          <div
            class="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-center lg:justify-start"
          >
            <a
              routerLink="/events"
              class="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-cream px-6 py-3 text-sm font-semibold text-forest transition-colors hover:bg-[#E4DED0] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cream motion-reduce:transition-none"
            >
              Ver próximas salidas
              <svg
                class="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.2"
                aria-hidden="true"
              >
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14m-6-6 6 6-6 6" />
              </svg>
            </a>
            <a
              [routerLink]="['/shop/experiences']"
              [queryParams]="queryParams()"
              class="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-cream/70 px-6 py-3 text-sm font-semibold text-cream transition-colors hover:bg-cream/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cream motion-reduce:transition-none"
            >
              Ir a la tienda
            </a>
          </div>
        </div>
      </div>

      @if (images.length > 1) {
        <div
          class="absolute bottom-24 left-1/2 z-20 flex -translate-x-1/2 gap-2 sm:bottom-28 lg:bottom-32"
        >
          @for (image of images; track image; let index = $index) {
            <button
              type="button"
              (click)="goTo(index)"
              [attr.aria-label]="'Ir a la imagen ' + (index + 1)"
              [attr.aria-current]="activeIndex() === index ? 'true' : null"
              class="h-2 rounded-full transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cream motion-reduce:transition-none"
              [class]="
                activeIndex() === index
                  ? 'w-7 bg-cream'
                  : 'w-2 bg-cream/50 hover:bg-cream/80'
              "
            ></button>
          }
        </div>

        <div
          class="absolute bottom-24 right-4 z-20 hidden items-center gap-2 sm:bottom-28 sm:right-8 sm:flex lg:bottom-32 lg:right-12"
        >
          <button
            type="button"
            (click)="prev()"
            aria-label="Imagen anterior"
            class="grid h-11 w-11 place-items-center rounded-full border border-cream/40 bg-[#14220E]/35 text-cream backdrop-blur-sm transition-colors hover:bg-cream/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cream motion-reduce:transition-none"
          >
            <svg
              class="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2.5"
              aria-hidden="true"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            type="button"
            (click)="next()"
            aria-label="Imagen siguiente"
            class="grid h-11 w-11 place-items-center rounded-full border border-cream/40 bg-[#14220E]/35 text-cream backdrop-blur-sm transition-colors hover:bg-cream/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cream motion-reduce:transition-none"
          >
            <svg
              class="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2.5"
              aria-hidden="true"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      }

      <app-mountain-divider
        class="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-20 sm:h-24 lg:h-28"
      />
    </section>
  `
})
export class ShopHero implements OnInit, OnDestroy {
  readonly queryParams = input<Record<string, string>>({});
  protected readonly images = HERO_IMAGES.map((url) => resolveAssetUrl(`${url}?v=${CAROUSEL_VERSION}`));
  protected readonly activeIndex = signal(0);
  protected readonly hovering = signal(false);
  protected readonly focusWithin = signal(false);
  protected readonly paused = computed(() => this.hovering() || this.focusWithin());

  private timer?: number;
  private reducedMotion = false;

  ngOnInit(): void {
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.startTimer();
  }

  ngOnDestroy(): void {
    this.clearTimer();
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

  protected onMouseLeave(): void {
    this.hovering.set(false);
    this.restartIfActive();
  }

  protected onFocusOut(event: FocusEvent): void {
    const host = event.currentTarget as HTMLElement | null;
    const next = event.relatedTarget instanceof Node ? event.relatedTarget : null;
    if (!host || !next || !host.contains(next)) {
      this.focusWithin.set(false);
      this.restartIfActive();
    }
  }

  private startTimer(): void {
    if (this.reducedMotion) {
      return;
    }
    this.clearTimer();
    this.timer = window.setInterval(() => {
      if (!this.paused()) {
        this.next();
      }
    }, ROTATE_INTERVAL_MS);
  }

  private restartIfActive(): void {
    if (!this.paused()) {
      this.startTimer();
    }
  }

  private clearTimer(): void {
    if (this.timer !== undefined) {
      window.clearInterval(this.timer);
      this.timer = undefined;
    }
  }
}
