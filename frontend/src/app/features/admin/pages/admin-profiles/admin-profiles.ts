import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdminProfilesStore } from '../../../../core/stores/admin-profiles.store';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state';
import { ErrorState } from '../../../../shared/components/error-state/error-state';
import { Pagination } from '../../../../shared/components/pagination/pagination';
import { SkeletonLoader } from '../../../../shared/components/skeleton-loader/skeleton-loader';
import { AdminProfileRow } from '../../components/admin-profile-row/admin-profile-row';

@Component({
  selector: 'app-admin-profiles',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, AdminProfileRow, SkeletonLoader, EmptyState, ErrorState, Pagination],
  template: `
    <div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div class="mb-8">
        <nav class="mb-4 flex flex-wrap items-center gap-2 text-sm text-gray-500">
          <a routerLink="/events" class="hover:text-gray-800 hover:underline">Eventos</a>
          <span>/</span>
          <span>Administración</span>
          <span>/</span>
          <span class="font-medium text-gray-800">Perfiles de usuarios</span>
        </nav>
        <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 class="text-2xl font-semibold text-gray-900">Perfiles de usuarios</h1>
            <p class="mt-0.5 text-sm text-gray-500">
              Consulta las cuentas registradas y el estado de sus perfiles.
            </p>
          </div>
          <span class="badge bg-brand/10 text-brand">Administración</span>
        </div>
      </div>

      @if (!store.loading() && !store.error()) {
        <div class="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div class="glass-panel rounded-2xl p-4">
            <p class="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Usuarios totales
            </p>
            <p class="mt-2 text-2xl font-semibold text-gray-900">{{ store.count() }}</p>
            <p class="mt-1 text-xs text-gray-500">Cuentas no eliminadas</p>
          </div>
          <div class="glass-panel rounded-2xl p-4">
            <p class="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Administradores
            </p>
            <p class="mt-2 text-2xl font-semibold text-gray-900">{{ store.adminCount() }}</p>
            <p class="mt-1 text-xs text-gray-500">Con rol ADMIN</p>
          </div>
          <div class="glass-panel rounded-2xl p-4">
            <p class="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Cuentas activas
            </p>
            <p class="mt-2 text-2xl font-semibold text-gray-900">{{ store.activeCount() }}</p>
            <p class="mt-1 text-xs text-gray-500">Disponibles para iniciar sesión</p>
          </div>
          <div class="glass-panel rounded-2xl p-4">
            <p class="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Perfiles incompletos
            </p>
            <p class="mt-2 text-2xl font-semibold text-gray-900">{{ store.incompleteCount() }}</p>
            <p class="mt-1 text-xs text-gray-500">Sin datos personales</p>
          </div>
        </div>
      }

      @if (store.loading()) {
        <app-skeleton-loader [count]="6" />
      } @else if (store.error()) {
        <app-error-state [message]="store.error()!" (retry)="load()" />
      } @else if (store.isEmpty()) {
        <app-empty-state
          title="No hay perfiles todavía"
          message="Los usuarios registrados aparecerán aquí con sus datos personales."
        />
      } @else {
        <div class="divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-200 bg-surface/80 backdrop-blur-sm shadow-sm">
          @for (item of store.visibleProfiles(); track item.user._id) {
            <app-admin-profile-row [profile]="item" />
          }
        </div>

        <div class="mt-6">
          <app-pagination
            [pagination]="store.pagination()"
            label="perfiles"
            (pageChange)="store.setPage($event)"
          />
        </div>
      }
    </div>
  `
})
export class AdminProfilesPage implements OnInit {
  protected readonly store = inject(AdminProfilesStore);

  ngOnInit(): void {
    void this.store.load();
  }

  protected load(): void {
    void this.store.load();
  }
}
