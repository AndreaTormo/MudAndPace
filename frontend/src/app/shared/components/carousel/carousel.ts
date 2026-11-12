import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  TemplateRef,
  ViewChild,
  contentChild,
  input
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';

@Component({
  selector: 'app-carousel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet],
  template: `
    <div class="relative">
      <div
        #track
        class="flex gap-4 overflow-x-auto scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        @for (item of items(); track $index) {
          <div [class]="'shrink-0 ' + itemClass()">
            <ng-container
              [ngTemplateOutlet]="itemTemplate()"
              [ngTemplateOutletContext]="{ $implicit: item, index: $index }"
            />
          </div>
        }
      </div>

      @if (items().length > 1) {
        <button
          type="button"
          (click)="scroll(-1)"
          aria-label="Anterior"
          class="overlay-control absolute -left-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full shadow-md transition-shadow hover:shadow-lg sm:-left-4"
        >
          <svg class="h-4 w-4 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <button
          type="button"
          (click)="scroll(1)"
          aria-label="Siguiente"
          class="overlay-control absolute -right-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full shadow-md transition-shadow hover:shadow-lg sm:-right-4"
        >
          <svg class="h-4 w-4 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      }
    </div>
  `
})
export class Carousel<T> {
  readonly items = input.required<T[]>();
  readonly itemClass = input('w-44 sm:w-48');

  readonly itemTemplate = contentChild.required<TemplateRef<{ $implicit: T; index: number }>>('item');

  @ViewChild('track') private track?: ElementRef<HTMLDivElement>;

  protected scroll(direction: number): void {
    const element = this.track?.nativeElement;
    if (!element) {
      return;
    }

    element.scrollBy({
      left: direction * element.clientWidth * 0.85,
      behavior: 'smooth'
    });
  }
}
