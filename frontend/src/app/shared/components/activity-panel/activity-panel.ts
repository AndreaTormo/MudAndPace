import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  signal,
  untracked
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import Swal from 'sweetalert2';
import {
  ACTIVITY_STATUS_LABELS,
  ACTIVITY_STATUS_OPTIONS,
  Activity,
  ActivityPayload,
  ActivityStatus
} from '../../../core/models/activity.model';
import { ActivityStore } from '../../../core/stores/activity.store';
import { isHttpError } from '../../utils/error.util';
import { formatDate, formatDistance, formatElevation, toDateInputValue } from '../../utils/format.util';

function todayInput(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function extractErrorMessage(error: unknown): string {
  if (isHttpError(error)) {
    const body = error.error as { error?: { message?: string } } | null | undefined;
    return body?.error?.message ?? 'No se ha podido guardar la actividad.';
  }
  const message = (error as { message?: string } | null | undefined)?.message;
  if (message === 'NO_USER') {
    return 'Debes iniciar sesión para registrar actividades.';
  }
  return 'No se ha podido guardar la actividad.';
}

@Component({
  selector: 'app-activity-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  template: `
    <section class="rounded-2xl border border-gray-200 bg-surface/80 p-5 backdrop-blur-sm">
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <h2 class="text-base font-semibold text-gray-900">Mis actividades</h2>
          @if (eventName()) {
            <p class="truncate text-sm text-gray-500">{{ eventName() }}</p>
          }
        </div>
        <span class="badge shrink-0 bg-brand/10 text-brand">
          {{ store.stats().activities }} registradas
        </span>
      </div>

      @if (store.stats().activities > 0) {
        <div class="mt-4 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
          <div class="rounded-xl border border-gray-100 bg-brand/5 p-3">
            <p class="text-xs text-gray-500">Distancia</p>
            <p class="font-semibold text-gray-900">{{ formatDistance(store.stats().totalDistanceKm) }}</p>
          </div>
          <div class="rounded-xl border border-gray-100 bg-brand/5 p-3">
            <p class="text-xs text-gray-500">Desnivel +</p>
            <p class="font-semibold text-gray-900">{{ formatElevation(store.stats().totalElevationGainM) }}</p>
          </div>
          <div class="rounded-xl border border-gray-100 bg-brand/5 p-3">
            <p class="text-xs text-gray-500">Tiempo</p>
            <p class="font-semibold text-gray-900">{{ store.stats().totalDuration }}</p>
          </div>
          <div class="rounded-xl border border-gray-100 bg-brand/5 p-3">
            <p class="text-xs text-gray-500">Calorías</p>
            <p class="font-semibold text-gray-900">{{ store.stats().totalCalories }} kcal</p>
          </div>
        </div>
      }

      <div class="mt-4 rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-line dark:bg-night2">
        <div class="flex items-center justify-between gap-3">
          <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-900">
            {{ editingId() ? 'Editar actividad' : 'Registrar salida' }}
          </h3>
          @if (editingId()) {
            <button
              type="button"
              class="text-xs font-medium text-brand hover:underline"
              (click)="cancelEdit()"
            >
              Cancelar edición
            </button>
          }
        </div>

        <form [formGroup]="form" (ngSubmit)="save()" class="mt-3 space-y-3">
          <div class="grid gap-3 sm:grid-cols-2">
            <label class="sm:col-span-2">
              <span class="form-label">Título</span>
              <input
                type="text"
                formControlName="title"
                maxlength="120"
                placeholder="Salida al Montseny"
                class="form-input"
              />
              @if (form.controls.title.touched && form.controls.title.hasError('required')) {
                <p class="form-error">El título es obligatorio.</p>
              }
            </label>

            <label>
              <span class="form-label">Fecha</span>
              <input type="date" formControlName="date" class="form-input" />
              @if (form.controls.date.touched && form.controls.date.hasError('required')) {
                <p class="form-error">La fecha es obligatoria.</p>
              }
            </label>

            <label>
              <span class="form-label">Estado</span>
              <select formControlName="status" class="form-input">
                @for (option of statusOptions; track option.value) {
                  <option [value]="option.value">{{ option.label }}</option>
                }
              </select>
            </label>

            <label>
              <span class="form-label">Distancia (km)</span>
              <input
                type="number"
                formControlName="distanceKm"
                min="0.1"
                max="1000"
                step="0.1"
                class="form-input"
              />
              @if (form.controls.distanceKm.touched && form.controls.distanceKm.invalid) {
                <p class="form-error">Indica una distancia entre 0,1 y 1000 km.</p>
              }
            </label>

            <label>
              <span class="form-label">Desnivel positivo (m)</span>
              <input
                type="number"
                formControlName="elevationGainM"
                min="0"
                max="50000"
                step="1"
                placeholder="0"
                class="form-input"
              />
              @if (form.controls.elevationGainM.touched && form.controls.elevationGainM.invalid) {
                <p class="form-error">El desnivel debe estar entre 0 y 50000 m.</p>
              }
            </label>

            <label>
              <span class="form-label">Tiempo (opcional)</span>
              <input
                type="text"
                formControlName="duration"
                placeholder="1:30:00 o 5400"
                class="form-input"
              />
              <p class="mt-1 text-xs text-gray-400">Si lo dejas vacío, se estima.</p>
            </label>

            <label>
              <span class="form-label">Calorías (opcional)</span>
              <input
                type="number"
                formControlName="calories"
                min="0"
                max="50000"
                step="1"
                placeholder="Se estiman"
                class="form-input"
              />
            </label>

            <label class="sm:col-span-2">
              <span class="form-label">Notas (opcional)</span>
              <textarea
                formControlName="notes"
                rows="2"
                maxlength="1000"
                class="form-input"
                placeholder="Sensaciones, avituallamiento, material..."
              ></textarea>
            </label>
          </div>

          @if (actionError()) {
            <div class="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
              {{ actionError() }}
            </div>
          }

          <div class="flex flex-wrap items-center gap-2">
            <button type="submit" class="button-primary" [disabled]="form.invalid || store.saving()">
              {{ store.saving() ? 'Guardando...' : editingId() ? 'Guardar cambios' : 'Añadir actividad' }}
            </button>
            <button
              type="button"
              class="button-secondary"
              [disabled]="store.estimateLoading()"
              (click)="calculateEstimate()"
            >
              {{ store.estimateLoading() ? 'Calculando...' : 'Calcular estimación' }}
            </button>
          </div>
        </form>

        @if (store.estimateError()) {
          <p class="mt-3 text-sm text-amber-700">{{ store.estimateError() }}</p>
        }

        @if (store.estimatePreview(); as estimate) {
          <div class="mt-3 rounded-xl bg-brand/5 p-3 text-sm">
            <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <div>
                <p class="text-xs text-gray-500">Esfuerzo</p>
                <p class="font-semibold text-gray-900">{{ estimate.kmEffort }} km-equiv.</p>
              </div>
              <div>
                <p class="text-xs text-gray-500">Tiempo</p>
                <p class="font-semibold text-gray-900">{{ estimate.duration }}</p>
              </div>
              <div>
                <p class="text-xs text-gray-500">Rango</p>
                <p class="font-semibold text-gray-900">
                  {{ estimate.durationRange.min }} – {{ estimate.durationRange.max }}
                </p>
              </div>
              <div>
                <p class="text-xs text-gray-500">Calorías</p>
                <p class="font-semibold text-gray-900">{{ estimate.calories }} kcal</p>
              </div>
            </div>
          </div>
        }
      </div>

      @if (store.loading()) {
        <div class="mt-4 space-y-2">
          <div class="h-24 animate-pulse rounded-xl bg-gray-100"></div>
          <div class="h-24 animate-pulse rounded-xl bg-gray-100"></div>
        </div>
      } @else if (store.error()) {
        <div class="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-700">
          <p>{{ store.error() }}</p>
          <button
            type="button"
            class="mt-2 text-sm font-semibold text-brand hover:underline"
            (click)="retry()"
          >
            Reintentar
          </button>
        </div>
      } @else if (!store.hasActivities()) {
        <p class="mt-4 rounded-xl border border-dashed border-gray-200 px-3 py-6 text-center text-sm text-gray-500">
          Aún no has registrado ninguna actividad para esta experiencia.
        </p>
      } @else {
        <div class="mt-4 space-y-2">
          @for (activity of store.activities(); track activity.id) {
            <article class="rounded-xl border border-gray-100 bg-surface p-4">
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <div class="flex flex-wrap items-center gap-2">
                    <p class="font-semibold text-gray-900">{{ activity.title }}</p>
                    <span
                      class="badge"
                      [class]="activity.status === 'completed' ? 'badge-active' : 'badge-draft'"
                    >
                      {{ statusLabel(activity) }}
                    </span>
                  </div>
                  <p class="mt-0.5 text-xs text-gray-500">{{ formatDate(activity.date) }}</p>
                </div>
                <div class="flex shrink-0 gap-2">
                  <button
                    type="button"
                    class="text-xs font-medium text-brand hover:underline"
                    (click)="startEdit(activity)"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    class="text-xs font-medium text-red-600 hover:underline disabled:opacity-50"
                    [disabled]="store.saving()"
                    (click)="confirmDelete(activity)"
                  >
                    Eliminar
                  </button>
                </div>
              </div>

              <dl class="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm sm:grid-cols-4">
                <div>
                  <dt class="text-xs text-gray-500">Distancia</dt>
                  <dd class="font-medium text-gray-900">{{ formatDistance(activity.distanceKm) }}</dd>
                </div>
                <div>
                  <dt class="text-xs text-gray-500">Desnivel +</dt>
                  <dd class="font-medium text-gray-900">{{ formatElevation(activity.elevationGainM) }}</dd>
                </div>
                <div>
                  <dt class="text-xs text-gray-500">Tiempo</dt>
                  <dd class="font-medium text-gray-900">{{ activity.duration }}</dd>
                </div>
                <div>
                  <dt class="text-xs text-gray-500">Ritmo</dt>
                  <dd class="font-medium text-gray-900">{{ activity.paceMinPerKm }} /km</dd>
                </div>
              </dl>

              <div class="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                <span>{{ activity.calories }} kcal</span>
                @if (activity.estimated.time) {
                  <span class="badge bg-gray-100 text-gray-600">Tiempo estimado</span>
                }
                @if (activity.estimated.calories) {
                  <span class="badge bg-gray-100 text-gray-600">Calorías estimadas</span>
                }
              </div>

              @if (activity.notes) {
                <p class="mt-2 text-xs text-gray-500">{{ activity.notes }}</p>
              }
            </article>
          }
        </div>
      }
    </section>
  `
})
export class ActivityPanel {
  protected readonly store = inject(ActivityStore);
  private readonly fb = inject(FormBuilder);

  readonly eventId = input.required<string>();
  readonly eventName = input<string>('');
  readonly eventDate = input<string | undefined>(undefined);

  protected readonly editingId = signal<string | null>(null);
  protected readonly actionError = signal<string | null>(null);
  protected readonly statusOptions = ACTIVITY_STATUS_OPTIONS;
  protected readonly formatDate = formatDate;
  protected readonly formatDistance = formatDistance;
  protected readonly formatElevation = formatElevation;

  protected readonly form = this.fb.group({
    title: ['', [Validators.required, Validators.maxLength(120)]],
    date: [todayInput(), [Validators.required]],
    distanceKm: [null as number | null, [Validators.required, Validators.min(0.1), Validators.max(1000)]],
    elevationGainM: [null as number | null, [Validators.min(0), Validators.max(50000)]],
    duration: [''],
    calories: [null as number | null, [Validators.min(0), Validators.max(50000)]],
    status: ['completed' as ActivityStatus],
    notes: ['', [Validators.maxLength(1000)]]
  });

  private readonly syncEvent = effect(
    () => {
      const eventId = this.eventId();
      const eventDate = this.eventDate();
      untracked(() => {
        this.store.load(eventId);
        this.resetForm(eventDate);
        this.actionError.set(null);
      });
    },
    { allowSignalWrites: true }
  );

  protected retry(): void {
    this.store.load(this.eventId());
  }

  protected async save(): Promise<void> {
    if (this.form.invalid || this.store.saving()) {
      this.form.markAllAsTouched();
      return;
    }

    this.actionError.set(null);

    try {
      const payload = this.buildPayload();
      const id = this.editingId();

      if (id) {
        await firstValueFrom(this.store.update(id, payload));
      } else {
        await firstValueFrom(this.store.create(payload));
      }

      this.resetForm(this.eventDate());
    } catch (error) {
      this.actionError.set(extractErrorMessage(error));
    }
  }

  protected calculateEstimate(): void {
    const distance = Number(this.form.controls.distanceKm.value);
    if (!Number.isFinite(distance) || distance < 0.1) {
      this.form.controls.distanceKm.markAsTouched();
      return;
    }

    const elevation = Number(this.form.controls.elevationGainM.value ?? 0);
    this.store.estimate({
      distanceKm: distance,
      elevationGainM: Number.isFinite(elevation) ? elevation : 0
    });
  }

  protected startEdit(activity: Activity): void {
    this.editingId.set(activity.id);
    this.actionError.set(null);
    this.store.clearEstimate();

    this.form.reset({
      title: activity.title,
      date: toDateInputValue(activity.date),
      distanceKm: activity.distanceKm,
      elevationGainM: activity.elevationGainM,
      duration: activity.estimated.time ? '' : activity.duration,
      calories: activity.estimated.calories ? null : activity.calories,
      status: activity.status,
      notes: activity.notes ?? ''
    });
  }

  protected cancelEdit(): void {
    this.resetForm(this.eventDate());
  }

  protected async confirmDelete(activity: Activity): Promise<void> {
    const result = await Swal.fire({
      icon: 'warning',
      title: 'Eliminar actividad',
      text: `¿Seguro que quieres eliminar "${activity.title}"?`,
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#C97C72'
    });

    if (!result.isConfirmed) {
      return;
    }

    this.actionError.set(null);

    try {
      await firstValueFrom(this.store.remove(activity.id));
      if (this.editingId() === activity.id) {
        this.resetForm(this.eventDate());
      }
    } catch (error) {
      this.actionError.set(extractErrorMessage(error));
    }
  }

  protected statusLabel(activity: Activity): string {
    return ACTIVITY_STATUS_LABELS[activity.status];
  }

  private resetForm(date?: string): void {
    this.editingId.set(null);
    this.form.reset({
      title: '',
      date: toDateInputValue(date) || todayInput(),
      distanceKm: null,
      elevationGainM: null,
      duration: '',
      calories: null,
      status: 'completed',
      notes: ''
    });
    this.store.clearEstimate();
  }

  private buildPayload(): ActivityPayload {
    const raw = this.form.getRawValue();
    const payload: ActivityPayload = {
      title: (raw.title ?? '').trim(),
      date: raw.date ?? todayInput(),
      status: (raw.status ?? 'completed') as ActivityStatus,
      distanceKm: Number(raw.distanceKm),
      elevationGainM: raw.elevationGainM === null ? 0 : Number(raw.elevationGainM),
      notes: (raw.notes ?? '').trim()
    };

    const duration = (raw.duration ?? '').trim();
    if (duration) {
      payload.duration = duration;
    }

    if (raw.calories !== null) {
      payload.calories = Number(raw.calories);
    }

    if (this.eventId()) {
      payload.eventId = this.eventId();
    }

    return payload;
  }
}
