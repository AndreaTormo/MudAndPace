import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import Swal from 'sweetalert2';
import { TrailRoutesStore } from '../../../../core/stores/trail-routes.store';
import { TrailRouteService } from '../../../../core/services/trail-route.service';
import { TrailRoute } from '../../../../core/models/trail-route.model';
import { RouteRow } from '../../components/route-row/route-row';
import { SkeletonLoader } from '../../../../shared/components/skeleton-loader/skeleton-loader';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state';
import { ErrorState } from '../../../../shared/components/error-state/error-state';
import { OBJECT_ID_PATTERN } from '../../../../shared/utils/validators';
import { isHttpError, showUnexpectedError } from '../../../../shared/utils/error.util';

@Component({
  selector: 'app-route-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    RouteRow,
    SkeletonLoader,
    EmptyState,
    ErrorState
  ],
  template: `
    <div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 class="text-2xl font-semibold text-gray-900">Rutas de trail</h1>
          <p class="mt-0.5 text-sm text-gray-500">
            {{ store.count() }} rutas encontradas
          </p>
        </div>

        <div class="flex flex-col gap-3 sm:flex-row sm:items-start" [formGroup]="searchForm">
          <div class="w-full sm:w-64">
            <label class="sr-only" for="search-id">Buscar ruta por ID</label>
            <input
              id="search-id"
              type="text"
              class="form-input"
              placeholder="Buscar ruta por ID (24 caracteres)"
              formControlName="id"
              [attr.aria-invalid]="searchError() ? true : null"
              [attr.aria-describedby]="searchError() ? 'search-id-error' : null"
              (keyup.enter)="searchById()"
            />
            @if (searchError(); as message) {
              <p id="search-id-error" class="form-error" role="alert">{{ message }}</p>
            }
          </div>
          <div class="flex items-center gap-2">
            <button type="button" class="button-secondary" (click)="searchById()">Buscar</button>
            <a routerLink="/routes/create" class="button-primary whitespace-nowrap">
              + Nueva ruta
            </a>
          </div>
        </div>
      </div>

      @if (store.loading()) {
        <app-skeleton-loader [count]="8" />
      } @else if (store.error()) {
        <app-error-state [message]="store.error()!" (retry)="load()" />
      } @else if (store.isEmpty()) {
        <app-empty-state>
          <a routerLink="/routes/create" class="button-primary">Crear la primera ruta</a>
        </app-empty-state>
      } @else {
        <div class="divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          @for (route of store.routes(); track route._id) {
            <app-route-row
              [route]="route"
              [pending]="isPending(route._id)"
              (edit)="onEdit($event)"
              (remove)="onDelete($event)"
              (restore)="onRestore($event)"
              (togglePublished)="onTogglePublished($event)"
              (toggleStatus)="onToggleStatus($event)"
            />
          }
        </div>
      }
    </div>
  `
})
export class RouteList implements OnInit {
  protected readonly store = inject(TrailRoutesStore);
  private readonly service = inject(TrailRouteService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  protected readonly searchForm = this.fb.nonNullable.group({
    id: ['', [Validators.required, Validators.pattern(OBJECT_ID_PATTERN)]]
  });
  private readonly searchAttempted = signal(false);
  private readonly pending = signal<ReadonlySet<string>>(new Set());

  protected readonly visibleRoutes = computed(() => this.store.routes());

  ngOnInit(): void {
    if (!this.store.loaded() || this.store.stale()) {
      this.load();
    }
  }

  protected async load(): Promise<void> {
    this.store.setLoading(true);
    this.store.setError(null);

    try {
      const routes = await firstValueFrom(this.service.list());
      this.store.setRoutes(routes);
    } catch {
      this.store.setError('No se han podido cargar las rutas. Inténtalo de nuevo.');
    } finally {
      this.store.setLoading(false);
    }
  }

  protected searchError(): string | null {
    const control = this.searchForm.controls.id;
    if (control.valid || (!control.touched && !control.dirty && !this.searchAttempted())) {
      return null;
    }
    if (control.errors?.['required']) {
      return 'Introduce un ID de 24 caracteres hexadecimal (lo encuentras en la URL del detalle).';
    }
    return 'Solo se admiten 24 caracteres hexadecimal (0-9 y a-f), sin espacios.';
  }

  protected searchById(): void {
    this.searchAttempted.set(true);
    const control = this.searchForm.controls.id;

    if (this.searchForm.invalid) {
      control.markAsTouched();
      return;
    }

    this.router.navigate(['/routes', control.value.trim()]);
  }

  protected onEdit(route: TrailRoute): void {
    this.router.navigate(['/routes', route._id, 'edit']);
  }

  protected isPending(id: string): boolean {
    return this.pending().has(id);
  }

  protected onTogglePublished(route: TrailRoute): Promise<void> {
    return this.withPending(route._id, async () => {
      try {
        const updated = await firstValueFrom(
          this.service.update(route._id, { isPublished: !route.isPublished })
        );
        this.store.patchRoute(updated);
      } catch (error) {
        if (!isHttpError(error)) {
          showUnexpectedError(error);
        }
      }
    });
  }

  protected onToggleStatus(route: TrailRoute): Promise<void> {
    const nextStatus = route.status === 'active' ? 'inactive' : 'active';
    return this.withPending(route._id, async () => {
      try {
        const updated = await firstValueFrom(this.service.setStatus(route._id, nextStatus));
        this.store.patchRoute(updated);
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



  protected async onDelete(route: TrailRoute): Promise<void> {
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
      this.store.patchRoute({ ...route, status: 'inactive', isActive: false });
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

  protected async onRestore(route: TrailRoute): Promise<void> {
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
      const updated = await firstValueFrom(this.service.restore(route._id));
      this.store.patchRoute(updated);
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
