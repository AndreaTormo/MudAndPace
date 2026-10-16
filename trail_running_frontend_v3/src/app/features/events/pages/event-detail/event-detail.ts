import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import Swal from 'sweetalert2';
import { Event, STATUS_LABELS } from '../../../../core/models/event.model';
import { EventService } from '../../../../core/services/event.service';
import { EventsStore } from '../../../../core/stores/events.store';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state';
import { ErrorState } from '../../../../shared/components/error-state/error-state';
import { SkeletonLoader } from '../../../../shared/components/skeleton-loader/skeleton-loader';
import { formatDate, formatDistance, formatElevation, formatPrice } from '../../../../shared/utils/format.util';
import { isValidObjectId } from '../../../../shared/utils/object-id.util';
import { isHttpError, showUnexpectedError } from '../../../../shared/utils/error.util';

@Component({
  selector: 'app-event-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, EmptyState, ErrorState, SkeletonLoader],
  template: `
    <div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      @if (loading()) {
        <app-skeleton-loader [count]="4" />
      } @else if (loadError()) {
        <app-error-state [message]="loadError()!" (retry)="reload()" />
      } @else if (notFound() || !event()) {
        <app-empty-state title="Evento no encontrado" message="No existe ningún evento con ese ID o no está disponible.">
          <a routerLink="/events" class="button-primary">Volver a la lista</a>
        </app-empty-state>
      } @else {
        <nav class="mb-6 flex items-center gap-2 text-sm text-gray-500">
          <a routerLink="/events" class="hover:text-gray-800 hover:underline">Eventos</a>
          <span>/</span>
          <span class="truncate font-medium text-gray-800">{{ event()!.name }}</span>
        </nav>

        <div class="grid gap-8 lg:grid-cols-3">
          <div class="space-y-6 lg:col-span-2">
            <div>
              <div class="mb-2 flex flex-wrap items-center gap-2">
                <span
                  class="badge"
                  [class.badge-published]="event()!.status === 'published'"
                  [class.badge-draft]="event()!.status !== 'published'"
                >
                  {{ statusLabels[event()!.status] }}
                </span>
                <span
                  class="badge"
                  [class.badge-active]="event()!.isActive"
                  [class.badge-inactive]="!event()!.isActive"
                >
                  {{ event()!.isActive ? 'Activo' : 'Inactivo' }}
                </span>
              </div>
              <h1 class="text-2xl font-semibold text-gray-900 sm:text-3xl">
                {{ event()!.name }}
              </h1>
              <p class="mt-1 text-sm text-gray-500">{{ locationText() }}</p>
            </div>

            <section class="rounded-2xl border border-gray-200 bg-white p-5">
              <h2 class="mb-3 text-base font-semibold text-gray-900">Descripción</h2>
              @if (event()!.description) {
                <p class="whitespace-pre-line text-sm leading-relaxed text-gray-700">
                  {{ event()!.description }}
                </p>
              } @else {
                <p class="text-sm text-gray-400">Este evento no tiene descripción.</p>
              }
            </section>

            <section class="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <div class="rounded-2xl border border-gray-200 bg-white p-4 text-center">
                <p class="text-lg font-semibold text-gray-900">
                  {{ formatDistance(event()!.distanceKm) }}
                </p>
                <p class="text-xs text-gray-500">Distancia</p>
              </div>
              <div class="rounded-2xl border border-gray-200 bg-white p-4 text-center">
                <p class="text-lg font-semibold text-gray-900">
                  {{ formatElevation(event()!.elevationGain) }}
                </p>
                <p class="text-xs text-gray-500">Desnivel +</p>
              </div>
              <div class="rounded-2xl border border-gray-200 bg-white p-4 text-center">
                <p class="text-lg font-semibold text-gray-900">{{ formatPrice(event()!.price) }}</p>
                <p class="text-xs text-gray-500">Precio</p>
              </div>
              <div class="rounded-2xl border border-gray-200 bg-white p-4 text-center">
                <p class="text-lg font-semibold text-gray-900">{{ formatDate(event()!.startDate) }}</p>
                <p class="text-xs text-gray-500">Inicio</p>
              </div>
              <div class="rounded-2xl border border-gray-200 bg-white p-4 text-center">
                <p class="text-lg font-semibold text-gray-900">{{ formatDate(event()!.endDate) }}</p>
                <p class="text-xs text-gray-500">Fin</p>
              </div>
              <div class="rounded-2xl border border-gray-200 bg-white p-4 text-center">
                <p class="text-lg font-semibold text-gray-900">{{ categoryText() }}</p>
                <p class="text-xs text-gray-500">Categoría</p>
              </div>
            </section>

            <section class="rounded-2xl border border-gray-200 bg-white p-5">
              <h2 class="mb-3 text-base font-semibold text-gray-900">Organización</h2>
              <p class="text-sm text-gray-700">
                <strong class="font-semibold text-gray-900">{{ hostText() }}</strong>
              </p>
            </section>
          </div>

          <aside>
            <div class="sticky top-20 space-y-4 rounded-2xl border border-gray-200 bg-white p-5">
              <dl class="space-y-2 text-sm">
                <div class="flex justify-between gap-2">
                  <dt class="text-gray-500">ID</dt>
                  <dd class="truncate font-mono text-xs text-gray-800">{{ event()!._id }}</dd>
                </div>
                <div class="flex justify-between gap-2">
                  <dt class="text-gray-500">Slug</dt>
                  <dd class="truncate text-xs text-gray-800">{{ event()!.slug }}</dd>
                </div>
                <div class="flex justify-between gap-2">
                  <dt class="text-gray-500">Creado</dt>
                  <dd class="text-gray-800">{{ formatDate(event()!.created_At) }}</dd>
                </div>
                <div class="flex justify-between gap-2">
                  <dt class="text-gray-500">Actualizado</dt>
                  <dd class="text-gray-800">{{ formatDate(event()!.updated_at) }}</dd>
                </div>
              </dl>

              <div class="space-y-2 border-t border-gray-100 pt-4">
                <a
                  [routerLink]="['/events', event()!._id, 'edit']"
                  class="button-primary block text-center"
                >
                  Editar evento
                </a>
                @if (event()!.isActive) {
                  <button type="button" class="button-danger w-full" (click)="onDelete()">
                    Eliminar evento
                  </button>
                } @else {
                  <button type="button" class="button-success w-full" (click)="onRestore()">
                    Recuperar evento
                  </button>
                }
                <a routerLink="/events" class="button-secondary block text-center">
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
export class EventDetail implements OnInit {
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly service = inject(EventService);
  private readonly store = inject(EventsStore);
  private readonly router = inject(Router);

  protected readonly event = signal<Event | null>(null);
  protected readonly loading = signal(false);
  protected readonly notFound = signal(false);
  protected readonly loadError = signal<string | null>(null);

  private currentId = '';

  protected readonly statusLabels = STATUS_LABELS;
  protected readonly formatDate = formatDate;
  protected readonly formatDistance = formatDistance;
  protected readonly formatElevation = formatElevation;
  protected readonly formatPrice = formatPrice;

  protected readonly locationText = computed(() => {
    const event = this.event();
    if (!event) {
      return '';
    }
    const parts = [event.location?.name, event.location?.city].filter(
      (part): part is string => Boolean(part)
    );
    return parts.join(' · ');
  });

  protected readonly categoryText = computed(() => this.event()?.category?.name ?? '-');

  protected readonly hostText = computed(() => this.event()?.host?.name ?? '-');

  ngOnInit(): void {
    this.activatedRoute.paramMap.subscribe((params) => {
      const id = params.get('id') ?? '';

      if (!isValidObjectId(id)) {
        this.currentId = '';
        this.event.set(null);
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

    const cached = this.store.selectedEvent();
    if (cached?._id === this.currentId && !this.store.stale()) {
      this.event.set(cached);
      this.loading.set(false);
      return;
    }

    this.loading.set(true);
    void this.fetchEvent();
  }

  private async fetchEvent(): Promise<void> {
    try {
      const event = await firstValueFrom(this.service.getById(this.currentId));
      this.event.set(event);
      this.store.setSelectedEvent(event);
    } catch (error) {
      if (isHttpError(error) && error.status === 404) {
        this.notFound.set(true);
      } else {
        this.loadError.set('No se ha podido cargar el evento. Inténtalo de nuevo.');
      }
    } finally {
      this.loading.set(false);
    }
  }

  protected async onDelete(): Promise<void> {
    const event = this.event();
    if (!event) {
      return;
    }

    const result = await Swal.fire({
      title: '¿Eliminar evento?',
      text: `"${event.name}" dejará de estar activo (borrado lógico). Podrás recuperarlo después.`,
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
      await firstValueFrom(this.service.remove(event._id));
      this.store.markStale();
      this.store.setSelectedEvent(null);
      this.router.navigate(['/events']);
      Swal.fire({
        icon: 'success',
        title: 'Evento eliminado',
        text: 'El evento ahora está inactivo. Puedes recuperarlo desde la lista.',
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
    const event = this.event();
    if (!event) {
      return;
    }

    const result = await Swal.fire({
      title: '¿Recuperar evento?',
      text: `"${event.name}" volverá a estar activo.`,
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
      const updated = await firstValueFrom(this.service.restore(event._id));
      this.store.markStale();
      this.store.setSelectedEvent(null);
      this.router.navigate(['/events']);
      Swal.fire({
        icon: 'success',
        title: 'Evento recuperado',
        text: 'El evento vuelve a estar activo.',
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
