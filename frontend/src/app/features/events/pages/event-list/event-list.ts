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
import { EventCalendar } from '../../components/event-calendar/event-calendar';
import { SkeletonLoader } from '../../../../shared/components/skeleton-loader/skeleton-loader';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state';
import { ErrorState } from '../../../../shared/components/error-state/error-state';
import { Pagination } from '../../../../shared/components/pagination/pagination';
import { OBJECT_ID_PATTERN } from '../../../../shared/utils/validators';
import { isHttpError, showUnexpectedError } from '../../../../shared/utils/error.util';

type EventView = 'list' | 'calendar';

const EVENT_VIEW_STORAGE_KEY = 'mudandpace.events.view';
const EVENT_LIST_PAGE_SIZE = 100;

@Component({
  selector: 'app-event-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    EventRow,
    EventCalendar,
    SkeletonLoader,
    EmptyState,
    ErrorState,
    Pagination
  ],
  template: `
    <div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div class="mb-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 class="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl" style="font-family: Inter, system-ui, sans-serif;">
            Eventos de <span class="text-brand">trail</span>
          </h1>
          <p class="mt-2 text-sm font-medium text-gray-500">
            {{ store.count() }} eventos encontrados
          </p>
        </div>

        @if (isAdmin()) {
          <div
            class="inline-flex self-start gap-2 sm:self-auto"
            role="group"
            aria-label="Vista de eventos"
          >
            <button
              type="button"
              [class]="viewButtonClass('list')"
              [attr.aria-pressed]="view() === 'list'"
              (click)="setView('list')"
            >
              Lista
            </button>
            <button
              type="button"
              [class]="viewButtonClass('calendar')"
              [attr.aria-pressed]="view() === 'calendar'"
              (click)="setView('calendar')"
            >
              Calendario
            </button>
          </div>
        }
      </div>

      @if (view() === 'list') {
        <div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-end" [formGroup]="searchForm">
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
      } @else if (isAdmin()) {
        <div class="mb-6 flex justify-end">
          <a routerLink="/events/create" class="button-primary whitespace-nowrap">
            + Nuevo evento
          </a>
        </div>
      }

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
        } @else if (view() === 'calendar') {
          <app-event-calendar [events]="store.events()" />
        } @else {
          <div class="divide-y divide-gray-200 overflow-hidden rounded-2xl border border-gray-200 bg-surface/80 backdrop-blur-sm shadow-sm dark:divide-line dark:border-line">
            @for (event of store.visibleEvents(); track event._id) {
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

          <div class="mt-6">
            <app-pagination
              [pagination]="store.pagination()"
              label="eventos"
              (pageChange)="store.setPage($event)"
            />
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
  protected readonly view = signal<EventView>('list');

  ngOnInit(): void {
    this.restoreView();
    if (!this.store.loaded() || this.store.stale()) {
      this.load();
    }
  }

  protected setView(view: EventView): void {
    if (view === 'calendar' && !this.isAdmin()) {
      return;
    }
    this.view.set(view);
    try {
      localStorage.setItem(EVENT_VIEW_STORAGE_KEY, view);
    } catch {}
  }

  protected viewButtonClass(target: EventView): string {
    const base = 'rounded-md px-3 py-1.5 text-sm font-semibold transition-colors';
    return this.view() === target
      ? `${base} bg-brand text-white shadow-sm dark:bg-brand dark:text-night`
      : `${base} text-gray-600 hover:bg-gray-100 dark:text-gray-500 dark:hover:bg-night2`;
  }

  private restoreView(): void {
    if (!this.isAdmin()) {
      this.view.set('list');
      return;
    }
    try {
      if (localStorage.getItem(EVENT_VIEW_STORAGE_KEY) === 'calendar') {
        this.view.set('calendar');
      }
    } catch {
      this.view.set('list');
    }
  }

  protected async load(): Promise<void> {
    this.store.setLoading(true);
    this.store.setError(null);

    try {
      const events = await firstValueFrom(this.service.list({ pageSize: EVENT_LIST_PAGE_SIZE }));
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
      confirmButtonColor: '#A3B18A',
      cancelButtonColor: 'rgb(var(--line))',
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
      confirmButtonColor: '#A3B18A',
      cancelButtonColor: 'rgb(var(--line))',
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
