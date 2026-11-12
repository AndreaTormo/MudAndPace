import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { EventCategory, EventHost, EventLocation } from '../../../../core/models/event.model';
import { ShopEvent, ShopFilters } from '../../../../core/models/shop.model';
import { ShopService } from '../../../../core/services/shop.service';
import { ShopStore } from '../../../../core/stores/shop.store';
import { Carousel } from '../../../../shared/components/carousel/carousel';
import { ErrorState } from '../../../../shared/components/error-state/error-state';
import { SkeletonLoader } from '../../../../shared/components/skeleton-loader/skeleton-loader';
import { CategoryCard } from '../../components/category-card/category-card';
import { EventShopCard } from '../../components/event-shop-card/event-shop-card';
import { HostCard } from '../../components/host-card/host-card';
import { LocationCard } from '../../components/location-card/location-card';
import { ShopHero } from '../../components/shop-hero/shop-hero';
import { buildShopQueryParams, parseShopFilters } from '../../utils/shop-query.util';

@Component({
  selector: 'app-shop-home',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    Carousel,
    CategoryCard,
    EventShopCard,
    HostCard,
    LocationCard,
    RouterLink,
    ShopHero,
    SkeletonLoader,
    ErrorState
  ],
  template: `
    <div class="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <app-shop-hero [queryParams]="shopQueryParams()" />

      <div class="mt-12 space-y-14">
        @if (store.catalogueLoading()) {
          <app-skeleton-loader [count]="4" />
        } @else if (store.catalogueError()) {
          <app-error-state [message]="store.catalogueError()!" (retry)="loadCatalogue()" />
        } @else {
          @if (store.categories().length > 0) {
            <section>
              <div class="mb-5 flex items-end justify-between gap-4">
                <div>
                  <h2 class="text-2xl font-bold text-gray-900">Explora por categoría</h2>
                  <p class="mt-1 text-sm text-gray-500">Encuentra el tipo de carrera que buscas.</p>
                </div>
              </div>
              <div class="px-2">
                <app-carousel [items]="store.categories()">
                  <ng-template #item let-category>
                    <app-category-card [category]="category" (selected)="onCategorySelect($event)" />
                  </ng-template>
                </app-carousel>
              </div>
            </section>
          }

          @if (store.hosts().length > 0) {
            <section>
              <div class="mb-5 flex items-end justify-between gap-4">
                <div>
                  <h2 class="text-2xl font-bold text-gray-900">Conoce a los organizadores</h2>
                  <p class="mt-1 text-sm text-gray-500">Descubre quién está detrás de cada evento.</p>
                </div>
              </div>
              <div class="px-2">
                <app-carousel [items]="store.hosts()">
                  <ng-template #item let-host>
                    <app-host-card [host]="host" (selected)="onHostSelect($event)" />
                  </ng-template>
                </app-carousel>
              </div>
            </section>
          }

          @if (store.locations().length > 0) {
            <section>
              <div class="mb-5 flex items-end justify-between gap-4">
                <div>
                  <h2 class="text-2xl font-bold text-gray-900">Destinos para correr</h2>
                  <p class="mt-1 text-sm text-gray-500">Elige un lugar y explora sus experiencias.</p>
                </div>
              </div>
              <div class="px-2">
                <app-carousel [items]="store.locations()">
                  <ng-template #item let-location>
                    <app-location-card [location]="location" (selected)="onLocationSelect($event)" />
                  </ng-template>
                </app-carousel>
              </div>
            </section>
          }
        }

        @if (store.featuredLoading()) {
          <section>
            <div class="mb-5">
              <h2 class="text-2xl font-bold text-gray-900">Experiencias destacadas</h2>
              <p class="mt-1 text-sm text-gray-500">Una selección de las próximas carreras para inspirarte.</p>
            </div>
            <app-skeleton-loader [count]="3" />
          </section>
        } @else if (store.featuredError()) {
          <app-error-state [message]="store.featuredError()!" (retry)="loadFeatured()" />
        } @else if (store.featuredEvents().length > 0) {
          <section>
            <div class="mb-5 flex items-end justify-between gap-4">
              <div>
                <h2 class="text-2xl font-bold text-gray-900">Experiencias destacadas</h2>
                <p class="mt-1 text-sm text-gray-500">Una selección de las próximas carreras para inspirarte.</p>
              </div>
              <a
                [routerLink]="['/shop/experiences']"
                [queryParams]="shopQueryParams()"
                class="shrink-0 text-sm font-medium text-brand hover:underline"
              >
                Ver todas
              </a>
            </div>
            <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              @for (event of store.featuredEvents(); track event._id) {
                <app-event-shop-card
                  [event]="event"
                  [featured]="true"
                  (selected)="onEventSelect($event)"
                />
              }
            </div>
          </section>
        }
      </div>
    </div>
  `
})
export class ShopHome implements OnInit {
  protected readonly store = inject(ShopStore);
  private readonly shopService = inject(ShopService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly currentFilters = signal<ShopFilters>(
    parseShopFilters(this.route.snapshot.queryParams)
  );
  protected readonly shopQueryParams = computed(() =>
    buildShopQueryParams(this.currentFilters())
  );

  ngOnInit(): void {
    this.route.queryParams
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => this.currentFilters.set(parseShopFilters(params)));

    void this.loadCatalogue();
    void this.loadFeatured();
  }

  protected async loadCatalogue(): Promise<void> {
    this.store.setCatalogueLoading(true);
    this.store.setCatalogueError(null);

    try {
      const catalogue = await firstValueFrom(this.shopService.getCatalogue());
      this.store.setCatalogue(catalogue);
    } catch {
      this.store.setCatalogueError('No se ha podido cargar el catálogo. Inténtalo de nuevo.');
    }
  }

  protected async loadFeatured(): Promise<void> {
    this.store.setFeaturedLoading(true);
    this.store.setFeaturedError(null);

    try {
      const events = await firstValueFrom(this.shopService.getFeaturedEvents());
      this.store.setFeaturedEvents(events);
    } catch {
      this.store.setFeaturedError(
        'No se han podido cargar las experiencias destacadas. Inténtalo de nuevo.'
      );
    }
  }

  protected onEventSelect(event: ShopEvent): void {
    void this.router.navigate(['/shop/experiences', event.slug], {
      queryParams: this.shopQueryParams()
    });
  }

  protected onCategorySelect(category: EventCategory): void {
    this.navigateWithFilter({ categorySlug: category.slug });
  }

  protected onHostSelect(host: EventHost): void {
    this.navigateWithFilter({ hostSlug: host.slug });
  }

  protected onLocationSelect(location: EventLocation): void {
    this.navigateWithFilter({ locationSlug: location.slug });
  }

  private navigateWithFilter(patch: Partial<ShopFilters>): void {
    const filters: ShopFilters = { ...this.currentFilters(), ...patch, page: 1 };
    void this.router.navigate(['/shop/experiences'], {
      queryParams: buildShopQueryParams(filters)
    });
  }
}
