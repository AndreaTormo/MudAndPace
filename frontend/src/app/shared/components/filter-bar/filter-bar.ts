import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { EventCategory, EventHost, EventLocation } from '../../../core/models/event.model';
import {
  DEFAULT_SHOP_SORT,
  SHOP_DISTANCE_OPTIONS,
  SHOP_MAX_PRICE,
  SHOP_MIN_PRICE,
  SHOP_PRICE_STEP,
  SHOP_SORT_OPTIONS,
  ShopDistanceSlug,
  ShopFilters
} from '../../../core/models/shop.model';

@Component({
  selector: 'app-filter-bar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-wrap items-center gap-3">
      <select
        [value]="filters().categorySlug ?? ''"
        (change)="onCategoryChange($event)"
        aria-label="Filtrar por categoría"
        [disabled]="disabled()"
        class="rounded-full border border-gray-300 bg-surface px-3 py-2 text-sm text-gray-700 shadow-sm transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand disabled:cursor-not-allowed disabled:opacity-50"
      >
        <option value="">Todas las categorías</option>
        @for (category of categories(); track category._id) {
          <option [value]="category.slug">{{ category.name }}</option>
        }
      </select>

      <select
        [value]="filters().hostSlug ?? ''"
        (change)="onHostChange($event)"
        aria-label="Filtrar por organizador"
        [disabled]="disabled()"
        class="rounded-full border border-gray-300 bg-surface px-3 py-2 text-sm text-gray-700 shadow-sm transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand disabled:cursor-not-allowed disabled:opacity-50"
      >
        <option value="">Todos los organizadores</option>
        @for (host of hosts(); track host._id) {
          <option [value]="host.slug">{{ host.name }}</option>
        }
      </select>

      <select
        [value]="filters().locationSlug ?? ''"
        (change)="onLocationChange($event)"
        aria-label="Filtrar por ubicación"
        [disabled]="disabled()"
        class="rounded-full border border-gray-300 bg-surface px-3 py-2 text-sm text-gray-700 shadow-sm transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand disabled:cursor-not-allowed disabled:opacity-50"
      >
        <option value="">Todas las ubicaciones</option>
        @for (location of locations(); track location._id) {
          <option [value]="location.slug">
            {{ location.city ? location.city + ' · ' + location.name : location.name }}
          </option>
        }
      </select>

      <select
        [value]="filters().distanceSlug ?? ''"
        (change)="onDistanceChange($event)"
        aria-label="Filtrar por distancia"
        [disabled]="disabled()"
        class="rounded-full border border-gray-300 bg-surface px-3 py-2 text-sm text-gray-700 shadow-sm transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand disabled:cursor-not-allowed disabled:opacity-50"
      >
        <option value="">Todas las distancias</option>
        @for (option of distanceOptions; track option.value) {
          <option [value]="option.value">{{ option.label }} · {{ option.description }}</option>
        }
      </select>

      <select
        [value]="filters().sort ?? defaultSort"
        (change)="onSortChange($event)"
        aria-label="Ordenar eventos"
        [disabled]="disabled()"
        class="rounded-full border border-gray-300 bg-surface px-3 py-2 text-sm text-gray-700 shadow-sm transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand disabled:cursor-not-allowed disabled:opacity-50"
      >
        @for (option of sortOptions; track option.value) {
          <option [value]="option.value">{{ option.label }}</option>
        }
      </select>

      <div class="flex items-center gap-3 rounded-full border border-gray-300 bg-surface px-4 py-2 shadow-sm">
        <span class="whitespace-nowrap text-xs font-medium text-gray-500">Precio</span>
        <div class="relative h-4 w-40 min-w-[120px] sm:w-48">
          <div class="pointer-events-none absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-gray-200"></div>
          <div
            class="pointer-events-none absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-brand"
            [style.left.%]="priceLeft()"
            [style.right.%]="priceRight()"
          ></div>
          <input
            type="range"
            class="range-input"
            [min]="minPrice"
            [max]="maxPrice"
            [step]="priceStep"
            [value]="priceMin()"
            [disabled]="disabled()"
            aria-label="Precio mínimo"
            (input)="onPriceMinInput($event)"
            (change)="onPriceMinChange($event)"
          />
          <input
            type="range"
            class="range-input"
            [min]="minPrice"
            [max]="maxPrice"
            [step]="priceStep"
            [value]="priceMax()"
            [disabled]="disabled()"
            aria-label="Precio máximo"
            (input)="onPriceMaxInput($event)"
            (change)="onPriceMaxChange($event)"
          />
        </div>
        <span class="whitespace-nowrap text-xs font-semibold text-gray-700">
          {{ priceMin() }}–{{ priceMax() }} €
        </span>
      </div>

      @if (activeFilterCount() > 0) {
        <span class="whitespace-nowrap rounded-full bg-brand/10 px-3 py-2 text-xs font-semibold text-brand">
          {{ activeFilterCount() }}
          {{ activeFilterCount() === 1 ? 'filtro aplicado' : 'filtros aplicados' }}
        </span>
      }

      @if (hasActiveFilters()) {
        <button
          type="button"
          (click)="filtersReset.emit()"
          [disabled]="disabled()"
          class="rounded-full px-3 py-2 text-sm font-medium text-brand transition-colors hover:bg-brand/10 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Limpiar filtros
        </button>
      }
    </div>
  `
})
export class FilterBar {
  readonly filters = input.required<ShopFilters>();
  readonly categories = input<EventCategory[]>([]);
  readonly hosts = input<EventHost[]>([]);
  readonly locations = input<EventLocation[]>([]);
  readonly hasActiveFilters = input(false);
  readonly activeFilterCount = input(0);
  readonly disabled = input(false);

  readonly filterChange = output<Partial<ShopFilters>>();
  readonly filtersReset = output<void>();

  protected readonly defaultSort = DEFAULT_SHOP_SORT;
  protected readonly sortOptions = SHOP_SORT_OPTIONS;
  protected readonly distanceOptions = SHOP_DISTANCE_OPTIONS;
  protected readonly minPrice = SHOP_MIN_PRICE;
  protected readonly maxPrice = SHOP_MAX_PRICE;
  protected readonly priceStep = SHOP_PRICE_STEP;

  protected readonly priceMin = computed(() =>
    this.clampPrice(this.filters().minPrice ?? SHOP_MIN_PRICE)
  );
  protected readonly priceMax = computed(() =>
    this.clampPrice(this.filters().maxPrice ?? SHOP_MAX_PRICE)
  );
  protected readonly priceLeft = computed(() => this.pricePercent(this.priceMin()));
  protected readonly priceRight = computed(() => 100 - this.pricePercent(this.priceMax()));

  protected onCategoryChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.filterChange.emit({ categorySlug: value || null, page: 1 });
  }

  protected onHostChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.filterChange.emit({ hostSlug: value || null, page: 1 });
  }

  protected onLocationChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.filterChange.emit({ locationSlug: value || null, page: 1 });
  }

  protected onDistanceChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value as ShopDistanceSlug | '';
    this.filterChange.emit({ distanceSlug: value || null, page: 1 });
  }

  protected onSortChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value as ShopFilters['sort'];
    this.filterChange.emit({ sort: value, page: 1 });
  }

  protected onPriceMinInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = Number(input.value);
    if (value > this.priceMax()) {
      input.value = String(this.priceMax());
    }
  }

  protected onPriceMaxInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = Number(input.value);
    if (value < this.priceMin()) {
      input.value = String(this.priceMin());
    }
  }

  protected onPriceMinChange(event: Event): void {
    const value = this.clampPrice(Number((event.target as HTMLInputElement).value));
    const min = Math.min(value, this.priceMax());
    this.filterChange.emit({ minPrice: min, maxPrice: this.priceMax(), page: 1 });
  }

  protected onPriceMaxChange(event: Event): void {
    const value = this.clampPrice(Number((event.target as HTMLInputElement).value));
    const max = Math.max(value, this.priceMin());
    this.filterChange.emit({ minPrice: this.priceMin(), maxPrice: max, page: 1 });
  }

  private clampPrice(value: number): number {
    if (!Number.isFinite(value)) {
      return SHOP_MIN_PRICE;
    }
    return Math.min(SHOP_MAX_PRICE, Math.max(SHOP_MIN_PRICE, Math.round(value)));
  }

  private pricePercent(value: number): number {
    return ((value - SHOP_MIN_PRICE) / (SHOP_MAX_PRICE - SHOP_MIN_PRICE)) * 100;
  }
}
