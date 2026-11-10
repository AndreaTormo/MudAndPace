import { ChangeDetectionStrategy, Component, effect, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';

function debounce<T extends (...args: Parameters<T>) => void>(fn: T, delay: number): T {
  let timer: ReturnType<typeof setTimeout>;
  return ((...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  }) as T;
}

@Component({
  selector: 'app-search-bar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  template: `
    <div class="relative">
      <svg
        class="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="2"
      >
        <circle cx="11" cy="11" r="8" />
        <path stroke-linecap="round" d="M21 21l-4.35-4.35" />
      </svg>

      <input
        type="search"
        [placeholder]="placeholder()"
        [(ngModel)]="_value"
        (ngModelChange)="onInput($event)"
        class="w-full rounded-full border border-gray-300 bg-white py-2.5 pl-10 pr-10 text-sm text-gray-800 shadow-sm transition placeholder:text-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand"
      />

      @if (_value) {
        <button
          type="button"
          (click)="clear()"
          class="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600"
          aria-label="Borrar búsqueda"
        >
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      }
    </div>
  `
})
export class SearchBar {
  readonly placeholder = input('Buscar eventos...');
  readonly value = input<string>('');
  readonly searchChange = output<string>();

  protected _value = '';

  private readonly debouncedEmit = debounce((value: string) => {
    this.searchChange.emit(value);
  }, 350);

  constructor() {
    effect(() => {
      const external = this.value();
      if (external !== this._value) {
        this._value = external;
      }
    });
  }

  protected onInput(value: string): void {
    this._value = value;
    this.debouncedEmit(value);
  }

  protected clear(): void {
    this._value = '';
    this.searchChange.emit('');
  }
}
