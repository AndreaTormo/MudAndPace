import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import Swal from 'sweetalert2';
import { EventsStore } from '../../../../core/stores/events.store';
import { EventService } from '../../../../core/services/event.service';
import { Event } from '../../../../core/models/event.model';
import { SkeletonLoader } from '../../../../shared/components/skeleton-loader/skeleton-loader';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state';
import { ErrorState } from '../../../../shared/components/error-state/error-state';
import { formatDate } from '../../../../shared/utils/format.util';
import { isHttpError, showUnexpectedError } from '../../../../shared/utils/error.util';

@Component({
  selector: 'app-event-trash',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, SkeletonLoader, EmptyState, ErrorState],
  template: `
    <div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div class="mb-8">
        <nav class="mb-4 flex items-center gap-2 text-sm text-gray-500">
          <a routerLink="/admin/trash" class="hover:text-gray-800 hover:underline">Administración</a>
          <span>/</span>
          <span class="font-medium text-gray-800">Papelera de eventos</span>
        </nav>
        <h1 class="text-2xl font-semibold text-gray-900">Papelera de eventos</h1>
        <p class="mt-0.5 text-sm text-gray-500">
          Eventos eliminados que puedes restaurar o borrar definitivamente.
        </p>
      </div>

      @if (store.deletedLoading()) {
        <app-skeleton-loader [count]="6" />
      } @else if (store.deletedError()) {
        <app-error-state [message]="store.deletedError()!" (retry)="load()" />
      } @else if (isEmpty()) {
        <app-empty-state
          title="La papelera está vacía"
          message="Cuando elimines un evento aparecerá aquí para que puedas restaurarlo o borrarlo definitivamente."
        >
          <a routerLink="/events" class="button-primary">Volver a los eventos</a>
        </app-empty-state>
      } @else {
        <div class="divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          @for (event of store.deletedEvents(); track event._id) {
            <div class="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4">
              <div class="min-w-0 flex-1">
                <a [routerLink]="['/events', event._id]" class="line-clamp-1 font-semibold text-gray-900 hover:text-brand">
                  {{ event.name }}
                </a>
                <p class="text-sm text-gray-500">
                  {{ formatDate(event.startDate) }} · {{ event.distanceKm }} km
                </p>
                <p class="mt-1 text-xs text-gray-400">
                  Eliminado el {{ formatDate(event.deleted_at ?? undefined) }}
                </p>
              </div>
              <div class="flex items-center gap-2 sm:justify-end">
                <button
                  type="button"
                  class="button-success"
                  [disabled]="isPending(event._id)"
                  (click)="onRestore(event)"
                >
                  Restaurar
                </button>
                <button
                  type="button"
                  class="button-danger"
                  [disabled]="isPending(event._id)"
                  (click)="onHardDelete(event)"
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
export class EventTrash implements OnInit {
  protected readonly store = inject(EventsStore);
  private readonly service = inject(EventService);

  private readonly pending = signal<ReadonlySet<string>>(new Set());

  protected readonly formatDate = formatDate;

  protected isEmpty(): boolean {
    return !this.store.deletedLoading() && !this.store.deletedError() && this.store.deletedEvents().length === 0;
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
      const events = await firstValueFrom(this.service.listDeleted());
      this.store.setDeletedEvents(events);
    } catch {
      this.store.setDeletedError('No se han podido cargar los eventos eliminados. Inténtalo de nuevo.');
    }
  }

  protected async onRestore(event: Event): Promise<void> {
    const result = await Swal.fire({
      title: '¿Recuperar evento?',
      text: `"${event.name}" volverá al listado principal.`,
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

    await this.withPending(event._id, async () => {
      try {
        const updated = await firstValueFrom(this.service.restore(event._id));
        this.store.removeDeletedEvent(event._id);
        this.store.patchEvent(updated);
        Swal.fire({
          icon: 'success',
          title: 'Evento recuperado',
          text: 'El evento vuelve al listado principal.',
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

  protected async onHardDelete(event: Event): Promise<void> {
    const result = await Swal.fire({
      title: '¿Eliminar definitivamente?',
      text: `"${event.name}" se borrará para siempre y no podrá recuperarse.`,
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

    await this.withPending(event._id, async () => {
      try {
        await firstValueFrom(this.service.hardDelete(event._id));
        this.store.removeDeletedEvent(event._id);
        Swal.fire({
          icon: 'success',
          title: 'Evento eliminado',
          text: 'El evento se ha borrado definitivamente.',
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
