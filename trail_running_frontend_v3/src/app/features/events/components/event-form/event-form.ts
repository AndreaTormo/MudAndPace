import { ChangeDetectionStrategy, Component, effect, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ReferenceService } from '../../../../core/services/reference.service';
import {
  Event,
  EventCategory,
  EventHost,
  EventLocation,
  EventPayload,
  EventStatus
} from '../../../../core/models/event.model';

@Component({
  selector: 'app-event-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  template: `
    <form
      [formGroup]="form"
      (ngSubmit)="submit()"
      class="space-y-8 rounded-2xl border border-gray-200 bg-white p-6"
    >
      <section class="space-y-4">
        <h2 class="text-base font-semibold text-gray-900">Datos generales</h2>
        <div class="grid gap-4 sm:grid-cols-2">
          <div class="sm:col-span-2">
            <label class="form-label" for="name">Nombre *</label>
            <input
              id="name"
              type="text"
              class="form-input"
              formControlName="name"
              placeholder="Ej.: Ultra Trail Vall de Boí 2027"
              [attr.aria-invalid]="errorFor('name') ? true : null"
              [attr.aria-describedby]="errorFor('name') ? 'name-error' : null"
            />
            @if (errorFor('name'); as message) {
              <p id="name-error" class="form-error" role="alert">{{ message }}</p>
            }
          </div>

          <div class="sm:col-span-2">
            <label class="form-label" for="description">Descripción</label>
            <textarea
              id="description"
              rows="4"
              class="form-input"
              formControlName="description"
              placeholder="Recorrido, desnivel, puntos de avituallamiento, accesos..."
              [attr.aria-invalid]="errorFor('description') ? true : null"
              [attr.aria-describedby]="errorFor('description') ? 'description-error' : null"
            ></textarea>
            @if (errorFor('description'); as message) {
              <p id="description-error" class="form-error" role="alert">{{ message }}</p>
            }
          </div>
        </div>
      </section>

      <section class="space-y-4">
        <h2 class="text-base font-semibold text-gray-900">Organización y clasificación</h2>
        <div class="grid gap-4 sm:grid-cols-3">
          <div>
            <label class="form-label" for="hostId">Organizador *</label>
            <select
              id="hostId"
              class="form-input"
              formControlName="hostId"
              [attr.aria-invalid]="errorFor('hostId') ? true : null"
              [attr.aria-describedby]="errorFor('hostId') ? 'hostId-error' : null"
            >
              <option value="">Selecciona…</option>
              @for (option of hosts(); track option._id) {
                <option [value]="option._id">{{ option.name }}</option>
              }
            </select>
            @if (errorFor('hostId'); as message) {
              <p id="hostId-error" class="form-error" role="alert">{{ message }}</p>
            }
          </div>

          <div>
            <label class="form-label" for="categoryId">Categoría *</label>
            <select
              id="categoryId"
              class="form-input"
              formControlName="categoryId"
              [attr.aria-invalid]="errorFor('categoryId') ? true : null"
              [attr.aria-describedby]="errorFor('categoryId') ? 'categoryId-error' : null"
            >
              <option value="">Selecciona…</option>
              @for (option of categories(); track option._id) {
                <option [value]="option._id">{{ option.name }}</option>
              }
            </select>
            @if (errorFor('categoryId'); as message) {
              <p id="categoryId-error" class="form-error" role="alert">{{ message }}</p>
            }
          </div>

          <div>
            <label class="form-label" for="locationId">Ubicación *</label>
            <select
              id="locationId"
              class="form-input"
              formControlName="locationId"
              [attr.aria-invalid]="errorFor('locationId') ? true : null"
              [attr.aria-describedby]="errorFor('locationId') ? 'locationId-error' : null"
            >
              <option value="">Selecciona…</option>
              @for (option of locations(); track option._id) {
                <option [value]="option._id">{{ option.name }}</option>
              }
            </select>
            @if (errorFor('locationId'); as message) {
              <p id="locationId-error" class="form-error" role="alert">{{ message }}</p>
            }
          </div>
        </div>
      </section>

      <section class="space-y-4">
        <h2 class="text-base font-semibold text-gray-900">Fechas y métricas</h2>
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label class="form-label" for="startDate">Inicio *</label>
            <input
              id="startDate"
              type="date"
              class="form-input"
              formControlName="startDate"
              [attr.aria-invalid]="errorFor('startDate') ? true : null"
              [attr.aria-describedby]="errorFor('startDate') ? 'startDate-error' : null"
            />
            @if (errorFor('startDate'); as message) {
              <p id="startDate-error" class="form-error" role="alert">{{ message }}</p>
            }
          </div>

          <div>
            <label class="form-label" for="endDate">Fin *</label>
            <input
              id="endDate"
              type="date"
              class="form-input"
              formControlName="endDate"
              [attr.aria-invalid]="errorFor('endDate') ? true : null"
              [attr.aria-describedby]="errorFor('endDate') ? 'endDate-error' : null"
            />
            @if (errorFor('endDate'); as message) {
              <p id="endDate-error" class="form-error" role="alert">{{ message }}</p>
            }
          </div>

          <div>
            <label class="form-label" for="distanceKm">Distancia (km) *</label>
            <input
              id="distanceKm"
              type="number"
              step="0.1"
              class="form-input"
              formControlName="distanceKm"
              [attr.aria-invalid]="errorFor('distanceKm') ? true : null"
              [attr.aria-describedby]="errorFor('distanceKm') ? 'distanceKm-error' : null"
            />
            @if (errorFor('distanceKm'); as message) {
              <p id="distanceKm-error" class="form-error" role="alert">{{ message }}</p>
            }
          </div>

          <div>
            <label class="form-label" for="elevationGain">Desnivel + (m) *</label>
            <input
              id="elevationGain"
              type="number"
              step="1"
              class="form-input"
              formControlName="elevationGain"
              [attr.aria-invalid]="errorFor('elevationGain') ? true : null"
              [attr.aria-describedby]="errorFor('elevationGain') ? 'elevationGain-error' : null"
            />
            @if (errorFor('elevationGain'); as message) {
              <p id="elevationGain-error" class="form-error" role="alert">{{ message }}</p>
            }
          </div>

          <div>
            <label class="form-label" for="price">Precio (€) *</label>
            <input
              id="price"
              type="number"
              step="0.01"
              class="form-input"
              formControlName="price"
              [attr.aria-invalid]="errorFor('price') ? true : null"
              [attr.aria-describedby]="errorFor('price') ? 'price-error' : null"
            />
            @if (errorFor('price'); as message) {
              <p id="price-error" class="form-error" role="alert">{{ message }}</p>
            }
          </div>

          <div>
            <label class="form-label" for="status">Estado</label>
            <select id="status" class="form-input" formControlName="status">
              <option value="draft">Borrador</option>
              <option value="published">Publicado</option>
            </select>
          </div>
        </div>

        <label class="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            formControlName="isActive"
            class="h-4 w-4 rounded border-gray-300"
          />
          Evento activo (los inactivos se muestran en la lista y se pueden recuperar)
        </label>
      </section>

      <div class="flex justify-end gap-3 border-t border-gray-100 pt-4">
        <button type="button" class="button-secondary" (click)="cancelled.emit()">Cancelar</button>
        <button type="submit" class="button-primary" [disabled]="form.invalid">
          {{ event() ? 'Guardar cambios' : 'Crear evento' }}
        </button>
      </div>
    </form>
  `
})
export class EventForm {
  private readonly fb = inject(FormBuilder);
  private readonly reference = inject(ReferenceService);

  event = input<Event | null>(null);
  formSubmit = output<EventPayload>();
  cancelled = output<void>();

  protected readonly categories = signal<EventCategory[]>([]);
  protected readonly locations = signal<EventLocation[]>([]);
  protected readonly hosts = signal<EventHost[]>([]);

  protected readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(120)]],
    description: ['', [Validators.maxLength(3000)]],
    hostId: ['', [Validators.required]],
    categoryId: ['', [Validators.required]],
    locationId: ['', [Validators.required]],
    startDate: ['', [Validators.required]],
    endDate: ['', [Validators.required]],
    distanceKm: [null as number | null, [Validators.required, Validators.min(0.1)]],
    elevationGain: [null as number | null, [Validators.required, Validators.min(0)]],
    price: [null as number | null, [Validators.required, Validators.min(0)]],
    status: ['draft'],
    isActive: [true]
  });

  constructor() {
    void this.loadReferences();

    effect(() => {
      const event = this.event();
      if (event) {
        this.form.patchValue({
          name: event.name,
          description: event.description ?? '',
          hostId: event.hostId,
          categoryId: event.categoryId,
          locationId: event.locationId,
          startDate: toLocalDate(event.startDate),
          endDate: toLocalDate(event.endDate),
          distanceKm: event.distanceKm,
          elevationGain: event.elevationGain,
          price: event.price,
          status: event.status,
          isActive: event.isActive
        });
      }
    });
  }

  private async loadReferences(): Promise<void> {
    const [categories, locations, hosts] = await Promise.all([
      firstValueFrom(this.reference.categories()),
      firstValueFrom(this.reference.locations()),
      firstValueFrom(this.reference.hosts())
    ]);
    this.categories.set(categories);
    this.locations.set(locations);
    this.hosts.set(hosts);
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const payload: EventPayload = {
      name: value.name.trim(),
      description: value.description.trim() || undefined,
      hostId: value.hostId,
      categoryId: value.categoryId,
      locationId: value.locationId,
      startDate: value.startDate,
      endDate: value.endDate,
      distanceKm: value.distanceKm ?? 0,
      elevationGain: value.elevationGain ?? 0,
      price: value.price ?? 0,
      status: value.status as EventStatus,
      isActive: value.isActive
    };

    this.formSubmit.emit(payload);
  }

  protected errorFor(controlName: string): string | null {
    const control = this.form.get(controlName);
    if (!control || control.valid || (!control.touched && !control.dirty)) {
      return null;
    }

    const errors = control.errors;
    if (!errors) {
      return null;
    }
    if (errors['required']) {
      return 'Este campo es obligatorio.';
    }
    if (errors['minlength']) {
      return `Mínimo ${errors['minlength'].requiredLength} caracteres.`;
    }
    if (errors['maxlength']) {
      return `Máximo ${errors['maxlength'].requiredLength} caracteres.`;
    }
    if (errors['min']) {
      return `El valor debe ser como mínimo ${errors['min'].min}.`;
    }
    return 'Valor no válido.';
  }
}

function toLocalDate(iso: string | undefined): string {
  if (!iso) {
    return '';
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
