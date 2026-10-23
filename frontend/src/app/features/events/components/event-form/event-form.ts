import { ChangeDetectionStrategy, Component, effect, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  Event,
  EventCategory,
  EventFormValue,
  EventHost,
  EventLocation,
  EventStatus
} from '../../../../core/models/event.model';
import { toDateInputValue } from '../../../../shared/utils/format.util';
import { EDITABLE_FIELDS } from '../../utils/event-payload.util';

@Component({
  selector: 'app-event-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  template: `
    <form
      [formGroup]="form"
      (ngSubmit)="submit()"
      class="space-y-8 rounded-2xl border border-gray-200 bg-white/80 backdrop-blur-sm p-6"
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
          @if (mode() === 'create') {
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
          }

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
          @if (mode() === 'create') {
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
          }

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

          @if (mode() === 'create') {
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

            <label class="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                formControlName="isActive"
                class="h-4 w-4 rounded border-gray-300"
              />
              Evento activo (los inactivos se muestran en la lista y se pueden recuperar)
            </label>
          }
        </div>
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

  event = input<Event | null>(null);
  mode = input<'create' | 'edit'>('create');
  categories = input<EventCategory[]>([]);
  locations = input<EventLocation[]>([]);
  hosts = input<EventHost[]>([]);
  formSubmit = output<EventFormValue>();
  cancelled = output<void>();

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
    status: this.fb.nonNullable.control<EventStatus>('draft'),
    isActive: [true]
  });

  constructor() {
    effect(() => {
      const mode = this.mode();
      const controls = this.form.controls;

      for (const name of Object.keys(controls) as (keyof EventFormValue)[]) {
        const control = controls[name];
        if (mode === 'create' || EDITABLE_FIELDS.includes(name)) {
          control.enable();
        } else {
          control.disable();
        }
      }

      const event = this.event();
      if (!event) {
        return;
      }

      if (mode === 'edit') {
        this.form.patchValue({
          name: event.name,
          description: event.description ?? '',
          categoryId: event.categoryId,
          locationId: event.locationId,
          distanceKm: event.distanceKm,
          elevationGain: event.elevationGain
        });
      } else {
        this.form.patchValue({
          name: event.name,
          description: event.description ?? '',
          hostId: event.hostId,
          categoryId: event.categoryId,
          locationId: event.locationId,
          startDate: toDateInputValue(event.startDate),
          endDate: toDateInputValue(event.endDate),
          distanceKm: event.distanceKm,
          elevationGain: event.elevationGain,
          price: event.price,
          status: event.status,
          isActive: event.isActive
        });
      }
    });
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.formSubmit.emit(this.form.getRawValue());
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
