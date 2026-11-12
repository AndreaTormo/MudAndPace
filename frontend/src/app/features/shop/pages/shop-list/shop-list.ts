import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, computed, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subject, catchError, distinctUntilChanged, firstValueFrom, map, of, switchMap, takeUntil, tap } from 'rxjs';
import {
  DEFAULT_SHOP_FILTERS,
  ShopEvent,
  ShopFilters,
  ShopPagination
} from '../../../../core/models/shop.model';
import { ShopService } from '../../../../core/services/shop.service';
import { ShopStore } from '../../../../core/stores/shop.store';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state';
import { ErrorState } from '../../../../shared/components/error-state/error-state';
import { SkeletonLoader } from '../../../../shared/components/skeleton-loader/skeleton-loader';
import { FilterBar } from '../../../../shared/components/filter-bar/filter-bar';
import { Pagination } from '../../../../shared/components/pagination/pagination';
import { SearchBar } from '../../../../shared/components/search-bar/search-bar';
import { EventShopCard } from '../../components/event-shop-card/event-shop-card';
import { buildShopQueryParams, parseShopFilters } from '../../utils/shop-query.util';

function filtersKey(filters: ShopFilters): string {
  return JSON.stringify(filters);
}

function emptyPagination(limit: number): ShopPagination {
  return { total: 0, page: 1, limit, totalPages: 0 };
}

@Component({
  selector: 'app-shop-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    SearchBar,
    FilterBar,
    Pagination,
    EventShopCard,
    SkeletonLoader,
    EmptyState,
    ErrorState
  ],
  template: `
    <div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div class="mb-6">
        <a
          [routerLink]="['/shop']"
          [queryParams]="shopQueryParams()"
          class="text-sm font-medium text-brand hover:underline"
        >
          ← Volver al shop
        </a>

        <div class="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 class="text-2xl font-semibold text-gray-900">Experiencias de trail</h1>
            <p class="mt-0.5 text-sm text-gray-500">
              @if (store.loading()) {
                Cargando experiencias…
              } @else {
                {{ store.pagination().total }}
                {{ store.pagination().total === 1 ? 'experiencia encontrada' : 'experiencias encontradas' }}
              }
            </p>
          </div>

          <div class="w-full sm:w-80">
            <app-search-bar
              [value]="store.filters().search ?? ''"
              placeholder="Buscar experiencias..."
              (searchChange)="onSearch($event)"
            />
          </div>
        </div>
      </div>

      @if (store.catalogueError()) {
        <p class="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          No se han podido cargar las opciones de filtrado.
        </p>
      }

      <div class="mb-6">
        <app-filter-bar
          [filters]="store.filters()"
          [categories]="store.categories()"
          [hosts]="store.hosts()"
          [locations]="store.locations()"
          [hasActiveFilters]="store.hasActiveFilters()"
          (filterChange)="onFilterChange($event)"
          (filtersReset)="onFiltersReset()"
        />
      </div>

      @if (store.loading()) {
        <app-skeleton-loader [count]="6" />
      } @else if (store.error()) {
        <app-error-state [message]="store.error()!" (retry)="reload()" />
      } @else if (store.isEmpty()) {
        <app-empty-state
          title="No hay experiencias para estos filtros"
          message="Prueba a cambiar la búsqueda o a limpiar los filtros para ver más experiencias."
        >
          @if (store.hasActiveFilters()) {
            <button type="button" class="button-primary" (click)="onFiltersReset()">
              Limpiar filtros
            </button>
          }
        </app-empty-state>
      } @else {
        <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          @for (event of store.events(); track event._id) {
            <app-event-shop-card [event]="event" (selected)="onEventSelect($event)" />
          }
        </div>

        <div class="mt-8">
          <app-pagination
            [pagination]="store.pagination()"
            (pageChange)="onPageChange($event)"
          />
        </div>
      }
    </div>
  `
})
export class ShopList implements OnInit, OnDestroy {
  protected readonly store = inject(ShopStore);
  private readonly shopService = inject(ShopService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroy$ = new Subject<void>();
  protected readonly shopQueryParams = computed(() => buildShopQueryParams(this.store.filters()));

  ngOnInit(): void {
    if (!this.store.catalogueLoaded()) {
      void this.loadCatalogue();
    }

    this.route.queryParams
      .pipe(
        map((params) => parseShopFilters(params)),
        distinctUntilChanged((previous, current) => filtersKey(previous) === filtersKey(current)),
        tap((filters) => {
          this.store.setFilters(filters);
          this.store.setLoading(true);
          this.store.setError(null);
        }),
        switchMap((filters) =>
          this.shopService.listExperiences(filters).pipe(
            map((response) => ({ ok: true as const, response })),
            catchError(() => of({ ok: false as const, response: null }))
          )
        ),
        takeUntil(this.destroy$)
      )
      .subscribe((outcome) => {
        this.store.setLoading(false);

        if (!outcome.ok || !outcome.response) {
          this.store.setEvents([]);
          this.store.setPagination(emptyPagination(this.store.filters().limit ?? DEFAULT_SHOP_FILTERS.limit!));
          this.store.setError('No se han podido cargar las experiencias. Inténtalo de nuevo.');
          return;
        }

        this.store.setEvents(outcome.response.data);
        this.store.setPagination(outcome.response.pagination);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  protected async reload(): Promise<void> {
    const filters = this.store.filters();
    this.store.setLoading(true);
    this.store.setError(null);

    try {
      const response = await firstValueFrom(this.shopService.listExperiences(filters));
      this.store.setEvents(response.data);
      this.store.setPagination(response.pagination);
      this.store.setLoading(false);
    } catch {
      this.store.setEvents([]);
      this.store.setPagination(emptyPagination(filters.limit ?? DEFAULT_SHOP_FILTERS.limit!));
      this.store.setError('No se han podido cargar las experiencias. Inténtalo de nuevo.');
    }
  }

  protected onSearch(search: string): void {
    const normalized = search.trim();
    if (normalized === (this.store.filters().search ?? '').trim()) {
      return;
    }
    this.navigate({ search: normalized, page: 1 });
  }

  protected onFilterChange(patch: Partial<ShopFilters>): void {
    this.navigate(patch);
  }

  protected onFiltersReset(): void {
    this.store.resetFilters();
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {},
      replaceUrl: true
    });
  }

  protected onPageChange(page: number): void {
    this.navigate({ page });
  }

  protected onEventSelect(event: ShopEvent): void {
    void this.router.navigate(['/shop/experiences', event.slug], {
      queryParams: this.shopQueryParams()
    });
  }

  private navigate(patch: Partial<ShopFilters>): void {
    const nextFilters: ShopFilters = { ...this.store.filters(), ...patch };
    this.store.setFilters(nextFilters);

    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: buildShopQueryParams(nextFilters),
      replaceUrl: true
    });
  }

  private async loadCatalogue(): Promise<void> {
    this.store.setCatalogueLoading(true);
    this.store.setCatalogueError(null);

    try {
      const catalogue = await firstValueFrom(this.shopService.getCatalogue());
      this.store.setCatalogue(catalogue);
    } catch {
      this.store.setCatalogueError('No se ha podido cargar el catálogo.');
    }
  }
}
