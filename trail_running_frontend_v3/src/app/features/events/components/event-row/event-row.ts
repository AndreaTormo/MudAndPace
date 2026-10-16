import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Event, STATUS_LABELS } from '../../../../core/models/event.model';
import { formatDate, formatDistance, formatElevation, formatPrice } from '../../../../shared/utils/format.util';

@Component({
  selector: 'app-event-row',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <div class="flex flex-col gap-3 bg-white p-4 sm:flex-row sm:items-center sm:gap-4">
      <div class="flex min-w-0 flex-1 items-center gap-4">
        <div
          class="event-avatar"
          [class.event-avatar-published]="event().status === 'published'"
          [class.event-avatar-draft]="event().status !== 'published'"
          [class.opacity-60]="!event().isActive"
        >
          <span aria-hidden="true">{{ initial() }}</span>
        </div>

        <div class="min-w-0">
          <a
            [routerLink]="['/events', event()._id]"
            class="line-clamp-1 font-semibold text-gray-900 hover:text-brand"
          >
            {{ event().name }}
          </a>
          <p class="text-sm text-gray-500">
            {{ locationText() }}
          </p>
          <div class="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-gray-500">
            <span>
              <strong class="font-semibold text-gray-900">
                {{ formatDate(event().startDate) }}
              </strong>
              · Inicio
            </span>
            <span>
              <strong class="font-semibold text-gray-900">
                {{ formatDistance(event().distanceKm) }}
              </strong>
              · Distancia
            </span>
            <span>
              <strong class="font-semibold text-gray-900">
                {{ formatElevation(event().elevationGain) }}
              </strong>
              · Desnivel +
            </span>
            <span>
              <strong class="font-semibold text-gray-900">{{ formatPrice(event().price) }}</strong>
              · Precio
            </span>
          </div>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <button
          type="button"
          class="state-pill"
          [class.state-pill-published]="event().status === 'published'"
          [class.state-pill-draft]="event().status !== 'published'"
          [disabled]="pending()"
          [attr.aria-label]="publishActionLabel()"
          [title]="publishActionLabel()"
          (click)="togglePublished.emit(event())"
        >
          {{ publishLabel() }}
        </button>
        <button
          type="button"
          class="state-pill"
          [class.state-pill-active]="event().isActive"
          [class.state-pill-inactive]="!event().isActive"
          [disabled]="pending()"
          [attr.aria-label]="statusActionLabel()"
          [title]="statusActionLabel()"
          (click)="toggleStatus.emit(event())"
        >
          {{ statusLabel() }}
        </button>
      </div>

      <div class="flex items-center gap-2 sm:justify-end">
        <a
          class="icon-button"
          [routerLink]="['/events', event()._id]"
          [attr.aria-label]="'Ver detalle de ' + event().name"
          title="Ver detalle"
        >
          <svg
            class="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </a>

        <button
          type="button"
          class="icon-button"
          [attr.aria-label]="'Editar ' + event().name"
          title="Editar"
          (click)="edit.emit(event())"
        >
          <svg
            class="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z" />
          </svg>
        </button>

        @if (event().isActive) {
          <button
            type="button"
            class="icon-button icon-button-danger"
            [attr.aria-label]="'Eliminar ' + event().name"
            title="Eliminar"
            (click)="remove.emit(event())"
          >
            <svg
              class="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="M3 6h18" />
              <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              <path d="M10 11v6M14 11v6" />
            </svg>
          </button>
        } @else {
          <button
            type="button"
            class="icon-button icon-button-success"
            [attr.aria-label]="'Recuperar ' + event().name"
            title="Recuperar"
            (click)="restore.emit(event())"
          >
            <svg
              class="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="M3 2v6h6" />
              <path d="M3.51 9a9 9 0 1 0 2.13-5.36L3 8" />
            </svg>
          </button>
        }
      </div>
    </div>
  `
})
export class EventRow {
  event = input.required<Event>();
  pending = input(false);

  edit = output<Event>();
  remove = output<Event>();
  restore = output<Event>();
  togglePublished = output<Event>();
  toggleStatus = output<Event>();

  protected readonly formatDate = formatDate;
  protected readonly formatDistance = formatDistance;
  protected readonly formatElevation = formatElevation;
  protected readonly formatPrice = formatPrice;

  protected readonly initial = computed(() => this.event().name.trim().charAt(0).toUpperCase());

  protected readonly locationText = computed(() => {
    const location = this.event().location;
    if (!location) {
      return '';
    }
    return [location.name, location.city].filter((part): part is string => Boolean(part)).join(' · ');
  });

  protected readonly statusLabel = computed(() => (this.event().isActive ? 'Activo' : 'Inactivo'));

  protected readonly publishLabel = computed(() =>
    this.event().status === 'published' ? 'Publicado' : 'Borrador'
  );

  protected readonly publishActionLabel = computed(() =>
    this.event().status === 'published'
      ? `Pasar "${this.event().name}" a borrador`
      : `Publicar "${this.event().name}"`
  );

  protected readonly statusActionLabel = computed(() =>
    this.event().isActive
      ? `Desactivar "${this.event().name}"`
      : `Activar "${this.event().name}"`
  );
}
