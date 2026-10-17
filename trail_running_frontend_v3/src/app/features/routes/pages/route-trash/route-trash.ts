import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import Swal from 'sweetalert2';
import { TrailRoutesStore } from '../../../../core/stores/trail-routes.store';
import { TrailRouteService } from '../../../../core/services/trail-route.service';
import { TrailRoute } from '../../../../core/models/trail-route.model';
import { SkeletonLoader } from '../../../../shared/components/skeleton-loader/skeleton-loader';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state';
import { ErrorState } from '../../../../shared/components/error-state/error-state';
import { formatDate } from '../../../../shared/utils/format.util';
import { isHttpError, showUnexpectedError } from '../../../../shared/utils/error.util';

@Component({
  selector: 'app-route-trash',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, SkeletonLoader, EmptyState, ErrorState],
  template: `
    <div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div class="mb-8">
        <nav class="mb-4 flex items-center gap-2 text-sm text-gray-500">
          <a routerLink="/admin/trash" class="hover:text-gray-800 hover:underline">Administración</a>
          <span>/</span>
          <span class="font-medium text-gray-800">Papelera de rutas</span>
        </nav>
        <h1 class="text-2xl font-semibold text-gray-900">Papelera de rutas</h1>
        <p class="mt-0.5 text-sm text-gray-500">
          Rutas eliminadas que puedes restaurar o borrar definitivamente.
        </p>
      </div>

      @if (store.deletedLoading()) {
        <app-skeleton-loader [count]="6" />
      } @else if (store.deletedError()) {
        <app-error-state [message]="store.deletedError()!" (retry)="load()" />
      } @else if (isEmpty()) {
        <app-empty-state
          title="La papelera está vacía"
          message="Cuando elimines una ruta aparecerá aquí para que puedas restaurarla o borrarla definitivamente."
        >
          <a routerLink="/routes" class="button-primary">Volver a las rutas</a>
        </app-empty-state>
      } @else {
        <div class="divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          @for (route of store.deletedRoutes(); track route._id) {
            <div class="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4">
              <div class="min-w-0 flex-1">
                <a [routerLink]="['/routes', route._id]" class="line-clamp-1 font-semibold text-gray-900 hover:text-brand">
                  {{ route.name }}
                </a>
                <p class="text-sm text-gray-500">
                  {{ route.location.country }}
                  @if (route.location.region) {
                    · {{ route.location.region }}
                  }
                </p>
                <p class="mt-1 text-xs text-gray-400">
                  Eliminada el {{ formatDate(route.deleted_at ?? undefined) }}
                </p>
              </div>
              <div class="flex items-center gap-2 sm:justify-end">
                <button
                  type="button"
                  class="button-success"
                  [disabled]="isPending(route._id)"
                  (click)="onRestore(route)"
                >
                  Restaurar
                </button>
                <button
                  type="button"
                  class="button-danger"
                  [disabled]="isPending(route._id)"
                  (click)="onHardDelete(route)"
                >
                  Eliminar definitivamente
                </button>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `
})
export class RouteTrash implements OnInit {
  protected readonly store = inject(TrailRoutesStore);
  private readonly service = inject(TrailRouteService);

  private readonly pending = signal<ReadonlySet<string>>(new Set());

  protected readonly formatDate = formatDate;

  protected isEmpty(): boolean {
    return !this.store.deletedLoading() && !this.store.deletedError() && this.store.deletedRoutes().length === 0;
  }

  ngOnInit(): void {
    if (!this.store.deletedLoaded()) {
      this.load();
    }
  }

  protected isPending(id: string): boolean {
    return this.pending().has(id);
  }

  protected load(): void {
    this.store.setDeletedLoading(true);
    this.store.setDeletedError(null);
    void this.fetch();
  }

  private async fetch(): Promise<void> {
    try {
      const routes = await firstValueFrom(this.service.listDeleted());
      this.store.setDeletedRoutes(routes);
    } catch {
      this.store.setDeletedError('No se han podido cargar las rutas eliminadas. Inténtalo de nuevo.');
    }
  }

  protected async onRestore(route: TrailRoute): Promise<void> {
    const result = await Swal.fire({
      title: '¿Recuperar ruta?',
      text: `"${route.name}" volverá al listado principal.`,
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

    await this.withPending(route._id, async () => {
      try {
        const updated = await firstValueFrom(this.service.restore(route._id));
        this.store.removeDeletedRoute(route._id);
        this.store.patchRoute(updated);
        Swal.fire({
          icon: 'success',
          title: 'Ruta recuperada',
          text: 'La ruta vuelve al listado principal.',
          timer: 2000,
          showConfirmButton: false
        });
      } catch (error) {
        if (!isHttpError(error)) {
          showUnexpectedError(error);
        }
      }
    });
  }

  protected async onHardDelete(route: TrailRoute): Promise<void> {
    const result = await Swal.fire({
      title: '¿Eliminar definitivamente?',
      text: `"${route.name}" se borrará para siempre y no podrá recuperarse.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#FF385C',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, eliminar definitivamente',
      cancelButtonText: 'Cancelar'
    });

    if (!result.isConfirmed) {
      return;
    }

    await this.withPending(route._id, async () => {
      try {
        await firstValueFrom(this.service.hardDelete(route._id));
        this.store.removeDeletedRoute(route._id);
        Swal.fire({
          icon: 'success',
          title: 'Ruta eliminada',
          text: 'La ruta se ha borrado definitivamente.',
          timer: 2000,
          showConfirmButton: false
        });
      } catch (error) {
        if (!isHttpError(error)) {
          showUnexpectedError(error);
        }
      }
    });
  }

  private async withPending(id: string, action: () => Promise<void>): Promise<void> {
    if (this.pending().has(id)) {
      return;
    }
    this.pending.update((set) => new Set(set).add(id));
    try {
      await action();
    } finally {
      this.pending.update((set) => {
        const next = new Set(set);
        next.delete(id);
        return next;
      });
    }
  }
}
