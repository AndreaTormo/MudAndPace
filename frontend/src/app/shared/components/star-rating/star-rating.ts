import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  signal
} from '@angular/core';

@Component({
  selector: 'app-star-rating',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="star-rating"
      role="group"
      [attr.aria-label]="label()"
      [attr.aria-busy]="loading() ? 'true' : null"
    >
      @if (loading()) {
        @for (star of stars(); track star) {
          <span class="star-placeholder" aria-hidden="true">☆</span>
        }
        <span class="sr-only">Cargando valoración…</span>
      } @else if (readOnly() || disabled()) {
        <span class="star-readonly" [attr.aria-label]="readableValue()">
          @for (star of stars(); track star) {
            <span class="star-icon" [class.star-icon-active]="star <= activeValue()" aria-hidden="true">
              {{ star <= activeValue() ? '★' : '☆' }}
            </span>
          }
        </span>
      } @else {
        @for (star of stars(); track star) {
          <button
            type="button"
            class="star-button"
            [class.star-button-active]="star <= activeValue()"
            [attr.aria-label]="star + ' de ' + max() + ' estrellas'"
            [attr.aria-pressed]="star === value() ? 'true' : 'false'"
            [disabled]="disabled()"
            (click)="select(star)"
            (mouseenter)="hover.set(star)"
            (mouseleave)="hover.set(null)"
            (focus)="hover.set(star)"
            (blur)="hover.set(null)"
            (keydown)="onKeydown($event, star)"
          >
            <span aria-hidden="true">{{ star <= activeValue() ? '★' : '☆' }}</span>
          </button>
        }
      }

      @if (showValue()) {
        <span class="star-rating-value">{{ readableValue() }}</span>
      }
    </div>
  `
})
export class StarRating {
  readonly value = input<number | null>(null);
  readonly max = input(5);
  readonly readOnly = input(false);
  readonly disabled = input(false);
  readonly loading = input(false);
  readonly label = input('Valoración');
  readonly showValue = input(false);
  readonly valueChange = output<number>();

  protected readonly hover = signal<number | null>(null);
  protected readonly stars = computed(() =>
    Array.from({ length: Math.max(1, this.max()) }, (_, index) => index + 1)
  );
  protected readonly activeValue = computed(() => this.hover() ?? this.value() ?? 0);
  protected readonly readableValue = computed(() => {
    const value = this.value();
    return value === null || !Number.isFinite(value)
      ? 'Sin valorar'
      : `${value.toFixed(1)} / ${this.max()}`;
  });

  protected select(star: number): void {
    if (this.disabled() || this.readOnly()) return;
    this.valueChange.emit(star);
  }

  protected onKeydown(event: KeyboardEvent, star: number): void {
    if (this.disabled() || this.readOnly()) return;

    const max = this.max();
    if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
      event.preventDefault();
      this.select(Math.min(max, star + 1));
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
      event.preventDefault();
      this.select(Math.max(1, star - 1));
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.select(star);
    }
  }
}
