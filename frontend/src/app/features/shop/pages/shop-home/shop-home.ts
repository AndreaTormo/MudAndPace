import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { EventCategory, EventHost, EventLocation } from '../../../../core/models/event.model';
import { ShopService } from '../../../../core/services/shop.service';
import { ShopStore } from '../../../../core/stores/shop.store';
import { Carousel } from '../../../../shared/components/carousel/carousel';
import { ErrorState } from '../../../../shared/components/error-state/error-state';
import { SkeletonLoader } from '../../../../shared/components/skeleton-loader/skeleton-loader';
import { CategoryCard } from '../../components/category-card/category-card';
import { HostCard } from '../../components/host-card/host-card';
import { LocationCard } from '../../components/location-card/location-card';
import { ShopHero } from '../../components/shop-hero/shop-hero';

@Component({
  selector: 'app-shop-home',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    Carousel,
    CategoryCard,
    HostCard,
    LocationCard,
    ShopHero,
    SkeletonLoader,
    ErrorState
  ],
  template: `
    <div class="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <app-shop-hero />

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
      </div>
    </div>
  `
})
export class ShopHome implements OnInit {
  protected readonly store = inject(ShopStore);
  private readonly shopService = inject(ShopService);
  private readonly router = inject(Router);

  ngOnInit(): void {
    if (!this.store.catalogueLoaded()) {
      void this.loadCatalogue();
    }
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

  protected onCategorySelect(category: EventCategory): void {
    void this.router.navigate(['/shop/experiences'], {
      queryParams: { categorySlug: category.slug }
    });
  }

  protected onHostSelect(host: EventHost): void {
    void this.router.navigate(['/shop/experiences'], {
      queryParams: { hostSlug: host.slug }
    });
  }

  protected onLocationSelect(location: EventLocation): void {
    void this.router.navigate(['/shop/experiences'], {
      queryParams: { locationSlug: location.slug }
    });
  }
}
