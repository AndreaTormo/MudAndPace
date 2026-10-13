import { ChangeDetectionStrategy, Component, effect, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  DIFFICULTY_LABELS,
  SURFACE_LABELS,
  Difficulty,
  Surface,
  TrailRoute,
  TrailRoutePayload
} from '../../../../core/models/trail-route.model';
import { urlValidator } from '../../../../shared/utils/validators';

@Component({
  selector: 'app-route-form',
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
              placeholder="Ej.: Ultra Trail Picos de Europa"
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
              placeholder="Recorrido, señalización, puntos de agua, accesos..."
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
        <h2 class="text-base font-semibold text-gray-900">Ubicación</h2>
        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <label class="form-label" for="country">País *</label>
            <input
              id="country"
              type="text"
              class="form-input"
              formControlName="country"
              placeholder="Ej.: España"
              [attr.aria-invalid]="errorFor('country') ? true : null"
              [attr.aria-describedby]="errorFor('country') ? 'country-error' : null"
            />
            @if (errorFor('country'); as message) {
              <p id="country-error" class="form-error" role="alert">{{ message }}</p>
            }
          </div>

          <div>
            <label class="form-label" for="region">Región</label>
            <input
              id="region"
              type="text"
              class="form-input"
              formControlName="region"
              placeholder="Ej.: Cantabria"
              [attr.aria-invalid]="errorFor('region') ? true : null"
              [attr.aria-describedby]="errorFor('region') ? 'region-error' : null"
            />
            @if (errorFor('region'); as message) {
              <p id="region-error" class="form-error" role="alert">{{ message }}</p>
            }
          </div>

          <div>
            <label class="form-label" for="province">Provincia</label>
            <input
              id="province"
              type="text"
              class="form-input"
              formControlName="province"
              [attr.aria-invalid]="errorFor('province') ? true : null"
              [attr.aria-describedby]="errorFor('province') ? 'province-error' : null"
            />
            @if (errorFor('province'); as message) {
              <p id="province-error" class="form-error" role="alert">{{ message }}</p>
            }
          </div>

          <div>
            <label class="form-label" for="municipality">Municipio</label>
            <input
              id="municipality"
              type="text"
              class="form-input"
              formControlName="municipality"
              [attr.aria-invalid]="errorFor('municipality') ? true : null"
              [attr.aria-describedby]="errorFor('municipality') ? 'municipality-error' : null"
            />
            @if (errorFor('municipality'); as message) {
              <p id="municipality-error" class="form-error" role="alert">{{ message }}</p>
            }
          </div>
        </div>
      </section>

      <section class="space-y-4">
        <h2 class="text-base font-semibold text-gray-900">Métricas</h2>
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
            <label class="form-label" for="elevationGainM">Desnivel + (m) *</label>
            <input
              id="elevationGainM"
              type="number"
              step="1"
              class="form-input"
              formControlName="elevationGainM"
              [attr.aria-invalid]="errorFor('elevationGainM') ? true : null"
              [attr.aria-describedby]="errorFor('elevationGainM') ? 'elevationGainM-error' : null"
            />
            @if (errorFor('elevationGainM'); as message) {
              <p id="elevationGainM-error" class="form-error" role="alert">{{ message }}</p>
            }
          </div>

          <div>
            <label class="form-label" for="elevationLossM">Desnivel − (m)</label>
            <input
              id="elevationLossM"
              type="number"
              step="1"
              class="form-input"
              formControlName="elevationLossM"
              [attr.aria-invalid]="errorFor('elevationLossM') ? true : null"
              [attr.aria-describedby]="errorFor('elevationLossM') ? 'elevationLossM-error' : null"
            />
            @if (errorFor('elevationLossM'); as message) {
              <p id="elevationLossM-error" class="form-error" role="alert">{{ message }}</p>
            }
          </div>

          <div>
            <label class="form-label" for="difficulty">Dificultad</label>
            <select
              id="difficulty"
              class="form-input"
              formControlName="difficulty"
              [attr.aria-invalid]="errorFor('difficulty') ? true : null"
              [attr.aria-describedby]="errorFor('difficulty') ? 'difficulty-error' : null"
            >
              @for (option of difficulties; track option.value) {
                <option [value]="option.value">{{ option.label }}</option>
              }
            </select>
            @if (errorFor('difficulty'); as message) {
              <p id="difficulty-error" class="form-error" role="alert">{{ message }}</p>
            }
          </div>
        </div>

        <label class="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            formControlName="isPublished"
            class="h-4 w-4 rounded border-gray-300"
          />
          Ruta publicada (aparece como Publicada, no como Borrador)
        </label>
      </section>

      <section class="space-y-4">
        <h2 class="text-base font-semibold text-gray-900">Terreno y etiquetas</h2>
        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <label class="form-label" for="surface">Superficies</label>
            <input
              id="surface"
              type="text"
              class="form-input"
              formControlName="surface"
              [placeholder]="surfaceHint"
              [attr.aria-invalid]="errorFor('surface') ? true : null"
              [attr.aria-describedby]="'surface-hint' + (errorFor('surface') ? ' surface-error' : '')"
            />
            <p id="surface-hint" class="mt-1 text-xs text-gray-500">
              Separadas por comas. Opciones: {{ surfaceHint }}
            </p>
            @if (errorFor('surface'); as message) {
              <p id="surface-error" class="form-error" role="alert">{{ message }}</p>
            }
          </div>

          <div>
            <label class="form-label" for="tags">Etiquetas</label>
            <input
              id="tags"
              type="text"
              class="form-input"
              formControlName="tags"
              placeholder="montaña, carrera, altitude"
              [attr.aria-invalid]="errorFor('tags') ? true : null"
              [attr.aria-describedby]="'tags-hint' + (errorFor('tags') ? ' tags-error' : '')"
            />
            <p id="tags-hint" class="mt-1 text-xs text-gray-500">Separadas por comas.</p>
            @if (errorFor('tags'); as message) {
              <p id="tags-error" class="form-error" role="alert">{{ message }}</p>
            }
          </div>
        </div>
      </section>

      <section class="space-y-4">
        <h2 class="text-base font-semibold text-gray-900">Imágenes y archivos</h2>
        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <label class="form-label" for="imageUrl">URL de imagen</label>
            <input
              id="imageUrl"
              type="url"
              class="form-input"
              formControlName="imageUrl"
              placeholder="https://..."
              [attr.aria-invalid]="errorFor('imageUrl') ? true : null"
              [attr.aria-describedby]="errorFor('imageUrl') ? 'imageUrl-error' : null"
            />
            @if (errorFor('imageUrl'); as message) {
              <p id="imageUrl-error" class="form-error" role="alert">{{ message }}</p>
            }
          </div>

          <div>
            <label class="form-label" for="gpxUrl">URL del archivo GPX</label>
            <input
              id="gpxUrl"
              type="url"
              class="form-input"
              formControlName="gpxUrl"
              placeholder="https://..."
              [attr.aria-invalid]="errorFor('gpxUrl') ? true : null"
              [attr.aria-describedby]="errorFor('gpxUrl') ? 'gpxUrl-error' : null"
            />
            @if (errorFor('gpxUrl'); as message) {
              <p id="gpxUrl-error" class="form-error" role="alert">{{ message }}</p>
            }
          </div>
        </div>
      </section>

      <section class="space-y-4">
        <h2 class="text-base font-semibold text-gray-900">Punto de inicio</h2>
        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <label class="form-label" for="longitude">Longitud *</label>
            <input
              id="longitude"
              type="number"
              step="any"
              class="form-input"
              formControlName="longitude"
              placeholder="-4.9"
              [attr.aria-invalid]="errorFor('longitude') ? true : null"
              [attr.aria-describedby]="errorFor('longitude') ? 'longitude-error' : null"
            />
            @if (errorFor('longitude'); as message) {
              <p id="longitude-error" class="form-error" role="alert">{{ message }}</p>
            }
          </div>

          <div>
            <label class="form-label" for="latitude">Latitud *</label>
            <input
              id="latitude"
              type="number"
              step="any"
              class="form-input"
              formControlName="latitude"
              placeholder="43.1"
              [attr.aria-invalid]="errorFor('latitude') ? true : null"
              [attr.aria-describedby]="errorFor('latitude') ? 'latitude-error' : null"
            />
            @if (errorFor('latitude'); as message) {
              <p id="latitude-error" class="form-error" role="alert">{{ message }}</p>
            }
          </div>
        </div>
        <p class="text-xs text-gray-500">
          Orden GeoJSON: la API recibe [longitud, latitud]. Ejemplo de Picos de Europa: -4.9, 43.1.
        </p>
      </section>

      <div class="flex justify-end gap-3 border-t border-gray-100 pt-4">
        <button type="button" class="button-secondary" (click)="cancelled.emit()">Cancelar</button>
        <button type="submit" class="button-primary" [disabled]="form.invalid">
          {{ route() ? 'Guardar cambios' : 'Crear ruta' }}
        </button>
      </div>
    </form>
  `
})
export class RouteForm {
  private readonly fb = inject(FormBuilder);

  route = input<TrailRoute | null>(null);
  formSubmit = output<TrailRoutePayload>();
  cancelled = output<void>();

  protected readonly difficulties = (
    Object.entries(DIFFICULTY_LABELS) as [Difficulty, string][]
  ).map(([value, label]) => ({ value, label }));

  protected readonly surfaceHint = (Object.keys(SURFACE_LABELS) as Surface[]).join(', ');

  protected readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(120)]],
    description: ['', [Validators.maxLength(3000)]],
    country: ['', [Validators.required]],
    region: [''],
    province: [''],
    municipality: [''],
    distanceKm: [null as number | null, [Validators.required, Validators.min(0.1)]],
    elevationGainM: [null as number | null, [Validators.required, Validators.min(0)]],
    elevationLossM: [null as number | null, [Validators.min(0)]],
    difficulty: ['moderate'],
    surface: [''],
    tags: [''],
    imageUrl: ['', [urlValidator]],
    gpxUrl: ['', [urlValidator]],
    longitude: [
      null as number | null,
      [Validators.required, Validators.min(-180), Validators.max(180)]
    ],
    latitude: [
      null as number | null,
      [Validators.required, Validators.min(-90), Validators.max(90)]
    ],
    isPublished: [true]
  });

  constructor() {
    effect(() => {
      const route = this.route();
      if (route) {
        this.form.patchValue({
          name: route.name,
          description: route.description ?? '',
          country: route.location.country,
          region: route.location.region ?? '',
          province: route.location.province ?? '',
          municipality: route.location.municipality ?? '',
          distanceKm: route.distanceKm,
          elevationGainM: route.elevationGainM,
          elevationLossM: route.elevationLossM ?? null,
          difficulty: route.difficulty ?? 'moderate',
          surface: (route.surface ?? []).join(', '),
          tags: (route.tags ?? []).join(', '),
          imageUrl: route.imageUrl ?? '',
          gpxUrl: route.gpxUrl ?? '',
          longitude: route.startPoint.coordinates[0],
          latitude: route.startPoint.coordinates[1],
          isPublished: route.isPublished
        });
      }
    });
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const payload: TrailRoutePayload = {
      name: value.name.trim(),
      location: {
        country: value.country.trim(),
        region: value.region.trim() || undefined,
        province: value.province.trim() || undefined,
        municipality: value.municipality.trim() || undefined
      },
      startPoint: {
        type: 'Point',
        coordinates: [value.longitude ?? 0, value.latitude ?? 0]
      },
      distanceKm: value.distanceKm ?? 0,
      elevationGainM: value.elevationGainM ?? 0,
      elevationLossM: value.elevationLossM ?? undefined,
      difficulty: value.difficulty as Difficulty,
      surface: this.parseList(value.surface) as Surface[],
      tags: this.parseList(value.tags),
      imageUrl: value.imageUrl.trim() || undefined,
      gpxUrl: value.gpxUrl.trim() || undefined,
      isPublished: value.isPublished
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
    if (errors['max']) {
      return `El valor debe ser como máximo ${errors['max'].max}.`;
    }
    if (errors['invalidUrl']) {
      return 'Introduce una URL válida que empiece por http:// o https://.';
    }
    return 'Valor no válido.';
  }

  private parseList(raw: string): string[] {
    return raw
      .split(',')
      .map((item) => item.trim().toLowerCase())
      .filter((item) => item.length > 0);
  }
}
