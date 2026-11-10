import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { EventCategory, EventHost, EventLocation } from '../../../core/models/event.model';
import {
  SHOP_DISTANCE_OPTIONS,
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
        class="rounded-full border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand"
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
        class="rounded-full border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand"
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
        class="rounded-full border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand"
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
        class="rounded-full border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand"
      >
        <option value="">Todas las distancias</option>
        @for (option of distanceOptions; track option.value) {
          <option [value]="option.value">{{ option.label }} · {{ option.description }}</option>
        }
      </select>

      @if (hasActiveFilters()) {
        <button
          type="button"
          (click)="filtersReset.emit()"
          class="rounded-full px-3 py-2 text-sm font-medium text-brand transition-colors hover:bg-brand/10"
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

  readonly filterChange = output<Partial<ShopFilters>>();
  readonly filtersReset = output<void>();

  protected readonly distanceOptions = SHOP_DISTANCE_OPTIONS;

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
}
