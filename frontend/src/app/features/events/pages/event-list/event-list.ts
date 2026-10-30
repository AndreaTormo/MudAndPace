import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import Swal from 'sweetalert2';
import { AuthStore } from '../../../../core/stores/auth.store';
import { EventsStore } from '../../../../core/stores/events.store';
import { EventService } from '../../../../core/services/event.service';
import { Event } from '../../../../core/models/event.model';
import { EventRow } from '../../components/event-row/event-row';
import { SkeletonLoader } from '../../../../shared/components/skeleton-loader/skeleton-loader';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state';
import { ErrorState } from '../../../../shared/components/error-state/error-state';
import { OBJECT_ID_PATTERN } from '../../../../shared/utils/validators';
import { isHttpError, showUnexpectedError } from '../../../../shared/utils/error.util';

@Component({
  selector: 'app-event-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    EventRow,
    SkeletonLoader,
    EmptyState,
    ErrorState
  ],
  template: `
    <div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 class="text-2xl font-semibold text-gray-900">Eventos de trail</h1>
          <p class="mt-0.5 text-sm text-gray-500">
            {{ store.count() }} eventos encontrados
          </p>
        </div>

        <div class="flex flex-col gap-3 sm:flex-row sm:items-start" [formGroup]="searchForm">
          <div class="w-full sm:w-64">
            <label class="sr-only" for="search-id">Buscar evento por ID</label>
            <input
              id="search-id"
              type="text"
              class="form-input"
              placeholder="Buscar evento por ID (24 caracteres)"
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
            @if (isAdmin()) {
              <a routerLink="/events/create" class="button-primary whitespace-nowrap">
                + Nuevo evento
              </a>
            }
          </div>
        </div>
      </div>

      <div class="mt-6">
        @if (store.loading()) {
          <app-skeleton-loader [count]="8" />
        } @else if (store.error()) {
          <app-error-state [message]="store.error()!" (retry)="load()" />
        } @else if (store.isEmpty()) {
          @if (isAdmin()) {
            <app-empty-state title="No hay eventos todavía" message="Crea un evento de trail running para empezar a trabajar con la API.">
              <a routerLink="/events/create" class="button-primary">Crear el primer evento</a>
            </app-empty-state>
          } @else {
            <app-empty-state title="No hay eventos todavía" message="Todavía no hay eventos disponibles." />
          }
        } @else {
          <div class="divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-200 bg-white/80 backdrop-blur-sm shadow-sm">
            @for (event of store.events(); track event._id) {
              <app-event-row
                [event]="event"
                [pending]="isPending(event._id)"
                [canManage]="isAdmin()"
                (edit)="onEdit($event)"
                (remove)="onDelete($event)"
                (activate)="onActivate($event)"
                (togglePublished)="onTogglePublished($event)"
                (toggleStatus)="onToggleStatus($event)"
              />
            }
          </div>
        }
      </div>
    </div>
  `
})
export class EventList implements OnInit {
  protected readonly store = inject(EventsStore);
  private readonly service = inject(EventService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  protected readonly isAdmin = inject(AuthStore).isAdmin;

  protected readonly searchForm = this.fb.nonNullable.group({
    id: ['', [Validators.required, Validators.pattern(OBJECT_ID_PATTERN)]]
  });
  private readonly searchAttempted = signal(false);
  private readonly pending = signal<ReadonlySet<string>>(new Set());

  ngOnInit(): void {
    if (!this.store.loaded() || this.store.stale()) {
      this.load();
    }
  }

  protected async load(): Promise<void> {
    this.store.setLoading(true);
    this.store.setError(null);

    try {
      const events = await firstValueFrom(this.service.list());
      this.store.setEvents(events);
    } catch {
      this.store.setError('No se han podido cargar los eventos. Inténtalo de nuevo.');
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

    this.router.navigate(['/events', control.value.trim()]);
  }

  protected onEdit(event: Event): void {
    this.router.navigate(['/events', event._id, 'edit']);
  }

  protected isPending(id: string): boolean {
    return this.pending().has(id);
  }

  protected onTogglePublished(event: Event): Promise<void> {
    const nextStatus = event.status === 'published' ? 'unpublish' : 'publish';
    return this.withPending(event._id, async () => {
      try {
        const updated = await firstValueFrom(
          nextStatus === 'publish' ? this.service.publish(event._id) : this.service.unpublish(event._id)
        );
        this.store.patchEvent(updated);
      } catch (error) {
        if (!isHttpError(error)) {
          showUnexpectedError(error);
        }
      }
    });
  }

  protected onToggleStatus(event: Event): Promise<void> {
    return this.withPending(event._id, async () => {
      try {
        const updated = await firstValueFrom(
          this.service.update(event._id, { isActive: !event.isActive })
        );
        this.store.patchEvent(updated);
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

  protected async onDelete(event: Event): Promise<void> {
    const result = await Swal.fire({
      title: '¿Eliminar evento?',
      text: `${event.name} pasará a la papelera. Podrás recuperarlo después.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#386641',
      cancelButtonColor: '#566F4B',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      await firstValueFrom(this.service.remove(event._id));
      this.store.removeEvent(event._id);
      Swal.fire({
        icon: 'success',
        title: 'Evento eliminado',
        text: 'El evento se ha movido a la papelera. Puedes recuperarlo desde allí.',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (error) {
      if (!isHttpError(error)) {
        showUnexpectedError(error);
      }
    }
  }

  protected async onActivate(event: Event): Promise<void> {
    const result = await Swal.fire({
      title: '¿Activar evento?',
      text: `${event.name} volverá a estar activo.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#386641',
      cancelButtonColor: '#566F4B',
      confirmButtonText: 'Sí, activar',
      cancelButtonText: 'Cancelar'
    });

    if (!result.isConfirmed) {
      return;
    }

    await this.withPending(event._id, async () => {
      try {
        const updated = await firstValueFrom(this.service.update(event._id, { isActive: true }));
        this.store.upsertEvent(updated);
        Swal.fire({
          icon: 'success',
          title: 'Evento activado',
          text: 'El evento vuelve a estar activo.',
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
}
