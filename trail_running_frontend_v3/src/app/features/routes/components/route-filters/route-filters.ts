import { ChangeDetectionStrategy, Component, inject, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import {
  DIFFICULTY_LABELS,
  Difficulty,
  RouteFilters as RouteFiltersValue
} from '../../../../core/models/trail-route.model';

@Component({
  selector: 'app-route-filters',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  template: `
    <form
      [formGroup]="form"
      (ngSubmit)="apply()"
      class="rounded-2xl border border-gray-200 bg-white p-4"
    >
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
        <div>
          <label class="form-label" for="difficulty">Dificultad</label>
          <select id="difficulty" class="form-input" formControlName="difficulty">
            <option value="">Todas</option>
            @for (option of difficulties; track option.value) {
              <option [value]="option.value">{{ option.label }}</option>
            }
          </select>
        </div>

        <div>
          <label class="form-label" for="country">País</label>
          <input
            id="country"
            class="form-input"
            type="text"
            formControlName="country"
            placeholder="Ej.: España"
          />
        </div>

        <div>
          <label class="form-label" for="region">Región</label>
          <input
            id="region"
            class="form-input"
            type="text"
            formControlName="region"
            placeholder="Ej.: Pirineos"
          />
        </div>

        <div>
          <label class="form-label" for="minDistance">Distancia mín. (km)</label>
          <input id="minDistance" class="form-input" type="number" formControlName="minDistance" />
        </div>

        <div>
          <label class="form-label" for="maxDistance">Distancia máx. (km)</label>
          <input id="maxDistance" class="form-input" type="number" formControlName="maxDistance" />
        </div>

        <div>
          <label class="form-label" for="status">Estado</label>
          <select id="status" class="form-input" formControlName="status">
            <option value="all">Todas</option>
            <option value="active">Activas</option>
            <option value="inactive">Inactivas</option>
          </select>
        </div>

        <div class="sm:col-span-2 lg:col-span-2">
          <label class="form-label" for="isPublished">Publicación</label>
          <select id="isPublished" class="form-input" formControlName="isPublished">
            <option value="">Todas</option>
            <option value="true">Publicadas</option>
            <option value="false">Borradores</option>
          </select>
        </div>
      </div>

      <div class="mt-4 flex justify-end gap-3">
        <button type="button" class="button-secondary" (click)="clear()">Limpiar</button>
        <button type="submit" class="button-primary">Aplicar filtros</button>
      </div>
    </form>
  `
})
export class RouteFilters {
  private readonly fb = inject(FormBuilder);

  filtersChange = output<RouteFiltersValue>();

  protected readonly difficulties = (
    Object.entries(DIFFICULTY_LABELS) as [Difficulty, string][]
  ).map(([value, label]) => ({ value, label }));

  protected readonly form = this.fb.nonNullable.group({
    difficulty: [''],
    country: [''],
    region: [''],
    minDistance: [null as number | null],
    maxDistance: [null as number | null],
    status: ['all'],
    isPublished: ['']
  });

  protected apply(): void {
    const value = this.form.getRawValue();
    const filters: RouteFiltersValue = { status: value.status as RouteFiltersValue['status'] };

    if (value.difficulty) {
      filters.difficulty = value.difficulty as Difficulty;
    }
    if (value.country.trim()) {
      filters.country = value.country.trim();
    }
    if (value.region.trim()) {
      filters.region = value.region.trim();
    }
    if (value.minDistance !== null) {
      filters.minDistance = value.minDistance;
    }
    if (value.maxDistance !== null) {
      filters.maxDistance = value.maxDistance;
    }
    if (value.isPublished !== '') {
      filters.isPublished = value.isPublished === 'true';
    }

    this.filtersChange.emit(filters);
  }

  protected clear(): void {
    this.form.reset({
      difficulty: '',
      country: '',
      region: '',
      minDistance: null,
      maxDistance: null,
      status: 'all',
      isPublished: ''
    });
    this.filtersChange.emit({ status: 'all' });
  }
}
