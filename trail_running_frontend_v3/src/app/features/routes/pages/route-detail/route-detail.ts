import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import Swal from 'sweetalert2';
import {
  DIFFICULTY_LABELS,
  STATUS_LABELS,
  SURFACE_LABELS,
  TrailRoute
} from '../../../../core/models/trail-route.model';
import { TrailRouteService } from '../../../../core/services/trail-route.service';
import { TrailRoutesStore } from '../../../../core/stores/trail-routes.store';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state';
import { ErrorState } from '../../../../shared/components/error-state/error-state';
import { SkeletonLoader } from '../../../../shared/components/skeleton-loader/skeleton-loader';
import { formatDate, formatDistance, formatElevation } from '../../../../shared/utils/format.util';
import { isValidObjectId } from '../../../../shared/utils/object-id.util';
import { isHttpError, showUnexpectedError } from '../../../../shared/utils/error.util';

@Component({
  selector: 'app-route-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, EmptyState, ErrorState, SkeletonLoader],
  template: `
    <div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      @if (loading()) {
        <app-skeleton-loader [count]="4" />
      } @else if (loadError()) {
        <app-error-state [message]="loadError()!" (retry)="reload()" />
      } @else if (notFound() || !trailRoute()) {
        <app-empty-state
          title="Ruta no encontrada"
          message="No existe ninguna ruta con ese ID o no está disponible."
        >
          <a routerLink="/routes" class="button-primary">Volver a la lista</a>
        </app-empty-state>
      } @else {
        <nav class="mb-6 flex items-center gap-2 text-sm text-gray-500">
          <a routerLink="/routes" class="hover:text-gray-800 hover:underline">Rutas</a>
          <span>/</span>
          <span class="truncate font-medium text-gray-800">{{ trailRoute()!.name }}</span>
        </nav>

        <div class="grid gap-8 lg:grid-cols-3">
          <div class="space-y-6 lg:col-span-2">
            <div class="aspect-video overflow-hidden rounded-2xl bg-gray-100">
              @if (trailRoute()!.imageUrl) {
                <img
                  [src]="trailRoute()!.imageUrl"
                  [alt]="trailRoute()!.name"
                  class="h-full w-full object-cover"
                />
              } @else {
                <div class="flex h-full w-full items-center justify-center text-sm text-gray-400">
                  Sin imagen
                </div>
              }
            </div>

            <div>
              <div class="mb-2 flex flex-wrap items-center gap-2">
                <span
                  class="badge"
                  [class.badge-active]="trailRoute()!.status === 'active'"
                  [class.badge-inactive]="trailRoute()!.status !== 'active'"
                >
                  {{ statusLabels[trailRoute()!.status] }}
                </span>
                <span
                  class="badge"
                  [class.badge-published]="trailRoute()!.isPublished"
                  [class.badge-draft]="!trailRoute()!.isPublished"
                >
                  {{ trailRoute()!.isPublished ? 'Publicada' : 'Borrador' }}
                </span>
              </div>
              <h1 class="text-2xl font-semibold text-gray-900 sm:text-3xl">
                {{ trailRoute()!.name }}
              </h1>
              <p class="mt-1 text-sm text-gray-500">{{ locationText() }}</p>
            </div>

            <section class="rounded-2xl border border-gray-200 bg-white p-5">
              <h2 class="mb-3 text-base font-semibold text-gray-900">Descripción</h2>
              @if (trailRoute()!.description) {
                <p class="whitespace-pre-line text-sm leading-relaxed text-gray-700">
                  {{ trailRoute()!.description }}
                </p>
              } @else {
                <p class="text-sm text-gray-400">Esta ruta no tiene descripción.</p>
              }
            </section>

            <section class="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div class="rounded-2xl border border-gray-200 bg-white p-4 text-center">
                <p class="text-lg font-semibold text-gray-900">
                  {{ formatDistance(trailRoute()!.distanceKm) }}
                </p>
                <p class="text-xs text-gray-500">Distancia</p>
              </div>
              <div class="rounded-2xl border border-gray-200 bg-white p-4 text-center">
                <p class="text-lg font-semibold text-gray-900">
                  {{ formatElevation(trailRoute()!.elevationGainM) }}
                </p>
                <p class="text-xs text-gray-500">Desnivel +</p>
              </div>
              <div class="rounded-2xl border border-gray-200 bg-white p-4 text-center">
                <p class="text-lg font-semibold text-gray-900">
                  {{ formatElevation(trailRoute()!.elevationLossM) }}
                </p>
                <p class="text-xs text-gray-500">Desnivel −</p>
              </div>
              <div class="rounded-2xl border border-gray-200 bg-white p-4 text-center">
                <p class="text-lg font-semibold text-gray-900">{{ difficultyLabel() }}</p>
                <p class="text-xs text-gray-500">Dificultad</p>
              </div>
            </section>

            <section class="rounded-2xl border border-gray-200 bg-white p-5">
              <h2 class="mb-3 text-base font-semibold text-gray-900">Terreno y etiquetas</h2>
              <div class="flex flex-wrap gap-2">
                @for (surface of trailRoute()!.surface ?? []; track surface) {
                  <span class="badge bg-gray-100 text-gray-700">{{ surfaceLabels[surface] }}</span>
                }
                @for (tag of trailRoute()!.tags ?? []; track tag) {
                  <span class="badge bg-indigo-50 text-indigo-700">#{{ tag }}</span>
                }
                @if (!(trailRoute()!.surface?.length) && !(trailRoute()!.tags?.length)) {
                  <p class="text-sm text-gray-400">Sin terreno ni etiquetas asignadas.</p>
                }
              </div>
            </section>

            <section class="rounded-2xl border border-gray-200 bg-white p-5">
              <h2 class="mb-3 text-base font-semibold text-gray-900">Punto de inicio</h2>
              <p class="text-sm text-gray-700">
                Longitud {{ trailRoute()!.startPoint.coordinates[0] }},
                latitud {{ trailRoute()!.startPoint.coordinates[1] }}
              </p>
              @if (trailRoute()!.gpxUrl) {
                <a
                  [href]="trailRoute()!.gpxUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="mt-3 inline-block text-sm font-medium text-brand hover:underline"
                >
                  Descargar GPX
                </a>
              }
            </section>
          </div>

          <aside>
            <div class="sticky top-20 space-y-4 rounded-2xl border border-gray-200 bg-white p-5">
              <dl class="space-y-2 text-sm">
                <div class="flex justify-between gap-2">
                  <dt class="text-gray-500">ID</dt>
                  <dd class="truncate font-mono text-xs text-gray-800">{{ trailRoute()!._id }}</dd>
                </div>
                <div class="flex justify-between gap-2">
                  <dt class="text-gray-500">Slug</dt>
                  <dd class="truncate text-xs text-gray-800">{{ trailRoute()!.slug }}</dd>
                </div>
                <div class="flex justify-between gap-2">
                  <dt class="text-gray-500">Creada</dt>
                  <dd class="text-gray-800">{{ formatDate(trailRoute()!.created_At) }}</dd>
                </div>
                <div class="flex justify-between gap-2">
                  <dt class="text-gray-500">Actualizada</dt>
                  <dd class="text-gray-800">{{ formatDate(trailRoute()!.updated_at) }}</dd>
                </div>
              </dl>

              <div class="space-y-2 border-t border-gray-100 pt-4">
                <a
                  [routerLink]="['/routes', trailRoute()!._id, 'edit']"
                  class="button-primary block text-center"
                >
                  Editar ruta
                </a>
                @if (trailRoute()!.status === 'active') {
                  <button type="button" class="button-danger w-full" (click)="onDelete()">
                    Eliminar ruta
                  </button>
                } @else {
                  <button type="button" class="button-success w-full" (click)="onRestore()">
                    Recuperar ruta
                  </button>
                }
                <a routerLink="/routes" class="button-secondary block text-center">
                  Volver a la lista
                </a>
              </div>
            </div>
          </aside>
        </div>
      }
    </div>
  `
})
export class RouteDetail implements OnInit {
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly service = inject(TrailRouteService);
  private readonly store = inject(TrailRoutesStore);
  private readonly router = inject(Router);

  protected readonly trailRoute = signal<TrailRoute | null>(null);
  protected readonly loading = signal(false);
  protected readonly notFound = signal(false);
  protected readonly loadError = signal<string | null>(null);

  private currentId = '';

  protected readonly statusLabels = STATUS_LABELS;
  protected readonly surfaceLabels = SURFACE_LABELS;
  protected readonly formatDistance = formatDistance;
  protected readonly formatElevation = formatElevation;
  protected readonly formatDate = formatDate;

  protected readonly locationText = computed(() => {
    const route = this.trailRoute();
    if (!route) {
      return '';
    }
    return [
      route.location.country,
      route.location.region,
      route.location.province,
      route.location.municipality
    ]
      .filter((part): part is string => Boolean(part))
      .join(' · ');
  });

  protected readonly difficultyLabel = computed(() => {
    const route = this.trailRoute();
    if (!route) {
      return '';
    }
    return DIFFICULTY_LABELS[route.difficulty ?? 'moderate'];
  });

  ngOnInit(): void {
    this.activatedRoute.paramMap.subscribe((params) => {
      const id = params.get('id') ?? '';

      if (!isValidObjectId(id)) {
        this.currentId = '';
        this.trailRoute.set(null);
        this.notFound.set(true);
        return;
      }

      this.currentId = id;
      this.load();
    });
  }

  protected reload(): void {
    if (this.currentId) {
      this.load();
    }
  }

  private load(): void {
    this.loadError.set(null);
    this.notFound.set(false);

    const cached = this.store.selectedRoute();
    if (cached?._id === this.currentId && !this.store.stale()) {
      this.trailRoute.set(cached);
      this.loading.set(false);
      return;
    }

    this.loading.set(true);
    void this.fetchRoute();
  }

  private async fetchRoute(): Promise<void> {
    try {
      const route = await firstValueFrom(this.service.getById(this.currentId));
      this.trailRoute.set(route);
      this.store.setSelectedRoute(route);
    } catch (error) {
      if (isHttpError(error) && error.status === 404) {
        this.notFound.set(true);
      } else {
        this.loadError.set('No se ha podido cargar la ruta. Inténtalo de nuevo.');
      }
    } finally {
      this.loading.set(false);
    }
  }

  protected async onDelete(): Promise<void> {
    const route = this.trailRoute();
    if (!route) {
      return;
    }

    const result = await Swal.fire({
      title: '¿Eliminar ruta?',
      text: `"${route.name}" dejará de estar activa (borrado lógico). Podrás recuperarla después.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#FF385C',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      await firstValueFrom(this.service.remove(route._id));
      this.store.markStale();
      this.store.setSelectedRoute(null);
      this.router.navigate(['/routes']);
      Swal.fire({
        icon: 'success',
        title: 'Ruta eliminada',
        text: 'La ruta ahora está inactiva. Puedes recuperarla desde la lista.',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (error) {
      if (!isHttpError(error)) {
        showUnexpectedError(error);
      }
    }
  }

  protected async onRestore(): Promise<void> {
    const route = this.trailRoute();
    if (!route) {
      return;
    }

    const result = await Swal.fire({
      title: '¿Recuperar ruta?',
      text: `"${route.name}" volverá a estar activa.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#FF385C',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, recuperar',
      cancelButtonText: 'Cancelar'
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      await firstValueFrom(this.service.restore(route._id));
      this.store.markStale();
      this.store.setSelectedRoute(null);
      this.router.navigate(['/routes']);
      Swal.fire({
        icon: 'success',
        title: 'Ruta recuperada',
        text: 'La ruta vuelve a estar activa.',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (error) {
      if (!isHttpError(error)) {
        showUnexpectedError(error);
      }
    }
  }
}
