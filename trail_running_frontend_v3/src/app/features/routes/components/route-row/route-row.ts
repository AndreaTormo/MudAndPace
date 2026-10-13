import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DIFFICULTY_LABELS, STATUS_LABELS, TrailRoute } from '../../../../core/models/trail-route.model';
import { formatDistance, formatElevation } from '../../../../shared/utils/format.util';

@Component({
  selector: 'app-route-row',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <div class="flex flex-col gap-3 bg-white p-4 sm:flex-row sm:items-center sm:gap-4">
      <div class="flex min-w-0 flex-1 items-center gap-4">
        <div
          class="route-avatar"
          [class.route-avatar-published]="route().isPublished"
          [class.route-avatar-draft]="!route().isPublished"
          [class.opacity-60]="route().status !== 'active'"
        >
          @if (route().imageUrl) {
            <img
              [src]="route().imageUrl"
              [alt]="route().name"
              class="h-full w-full object-cover"
              [class.grayscale]="!route().isPublished"
            />
            @if (route().isPublished) {
              <span class="route-avatar-tint" aria-hidden="true"></span>
            }
          } @else {
            <span aria-hidden="true">{{ initial() }}</span>
          }
        </div>

        <div class="min-w-0">
          <a
            [routerLink]="['/routes', route()._id]"
            class="line-clamp-1 font-semibold text-gray-900 hover:text-brand"
          >
            {{ route().name }}
          </a>
          <p class="text-sm text-gray-500">
            {{ route().location.country }}
            @if (route().location.region) {
              · {{ route().location.region }}
            }
          </p>
          <div class="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-gray-500">
            <span>
              <strong class="font-semibold text-gray-900">
                {{ formatDistance(route().distanceKm) }}
              </strong>
              · Distancia
            </span>
            <span>
              <strong class="font-semibold text-gray-900">
                {{ formatElevation(route().elevationGainM) }}
              </strong>
              · Desnivel +
            </span>
            <span>
              <strong class="font-semibold text-gray-900">{{ difficultyLabel() }}</strong>
              · Dificultad
            </span>
          </div>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <button
          type="button"
          class="state-pill"
          [class.state-pill-published]="route().isPublished"
          [class.state-pill-draft]="!route().isPublished"
          [disabled]="pending()"
          [attr.aria-label]="publishActionLabel()"
          [title]="publishActionLabel()"
          (click)="togglePublished.emit(route())"
        >
          {{ publishLabel() }}
        </button>
        <button
          type="button"
          class="state-pill"
          [class.state-pill-active]="route().status === 'active'"
          [class.state-pill-inactive]="route().status !== 'active'"
          [disabled]="pending()"
          [attr.aria-label]="statusActionLabel()"
          [title]="statusActionLabel()"
          (click)="toggleStatus.emit(route())"
        >
          {{ statusLabel() }}
        </button>
      </div>

      <div class="flex items-center gap-2 sm:justify-end">
        <a
          class="icon-button"
          [routerLink]="['/routes', route()._id]"
          [attr.aria-label]="'Ver detalle de ' + route().name"
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
          [attr.aria-label]="'Editar ' + route().name"
          title="Editar"
          (click)="edit.emit(route())"
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

        @if (route().status === 'active') {
          <button
            type="button"
            class="icon-button icon-button-danger"
            [attr.aria-label]="'Eliminar ' + route().name"
            title="Eliminar"
            (click)="remove.emit(route())"
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
            [attr.aria-label]="'Recuperar ' + route().name"
            title="Recuperar"
            (click)="restore.emit(route())"
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
export class RouteRow {
  route = input.required<TrailRoute>();
  pending = input(false);

  edit = output<TrailRoute>();
  remove = output<TrailRoute>();
  restore = output<TrailRoute>();
  togglePublished = output<TrailRoute>();
  toggleStatus = output<TrailRoute>();

  protected readonly formatDistance = formatDistance;
  protected readonly formatElevation = formatElevation;

  protected readonly initial = computed(() => this.route().name.trim().charAt(0).toUpperCase());

  protected readonly statusLabel = computed(() => STATUS_LABELS[this.route().status]);

  protected readonly difficultyLabel = computed(
    () => DIFFICULTY_LABELS[this.route().difficulty ?? 'moderate']
  );

  protected readonly publishLabel = computed(() =>
    this.route().isPublished ? 'Publicada' : 'Borrador'
  );

  protected readonly publishActionLabel = computed(() =>
    this.route().isPublished
      ? `Pasar "${this.route().name}" a borrador`
      : `Publicar "${this.route().name}"`
  );

  protected readonly statusActionLabel = computed(() =>
    this.route().status === 'active'
      ? `Desactivar "${this.route().name}"`
      : `Activar "${this.route().name}"`
  );
}
