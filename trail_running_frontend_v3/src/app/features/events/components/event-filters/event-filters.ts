import { ChangeDetectionStrategy, Component, inject, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ReferenceService } from '../../../../core/services/reference.service';
import {
  EventCategory,
  EventFilters as EventFiltersValue,
  EventLocation
} from '../../../../core/models/event.model';

@Component({
  selector: 'app-event-filters',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  template: `
    <form
      [formGroup]="form"
      (ngSubmit)="apply()"
      class="rounded-2xl border border-gray-200 bg-white p-4"
    >
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div>
          <label class="form-label" for="category">Categoría</label>
          <select id="category" class="form-input" formControlName="categoryId">
            <option value="">Todas</option>
            @for (option of categories(); track option._id) {
              <option [value]="option._id">{{ option.name }}</option>
            }
          </select>
        </div>

        <div>
          <label class="form-label" for="location">Ubicación</label>
          <select id="location" class="form-input" formControlName="locationId">
            <option value="">Todas</option>
            @for (option of locations(); track option._id) {
              <option [value]="option._id">{{ option.name }}</option>
            }
          </select>
        </div>

        <div>
          <label class="form-label" for="status">Estado</label>
          <select id="status" class="form-input" formControlName="status">
            <option value="all">Todos</option>
            <option value="published">Publicados</option>
            <option value="draft">Borradores</option>
          </select>
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
          <label class="form-label" for="fromDate">Desde</label>
          <input id="fromDate" class="form-input" type="date" formControlName="fromDate" />
        </div>

        <div>
          <label class="form-label" for="toDate">Hasta</label>
          <input id="toDate" class="form-input" type="date" formControlName="toDate" />
        </div>
      </div>

      <div class="mt-4 flex justify-end gap-3">
        <button type="button" class="button-secondary" (click)="clear()">Limpiar</button>
        <button type="submit" class="button-primary">Aplicar filtros</button>
      </div>
    </form>
  `
})
export class EventFilters {
  private readonly fb = inject(FormBuilder);
  private readonly reference = inject(ReferenceService);

  filtersChange = output<EventFiltersValue>();

  protected readonly categories = signal<EventCategory[]>([]);
  protected readonly locations = signal<EventLocation[]>([]);

  protected readonly form = this.fb.nonNullable.group({
    categoryId: [''],
    locationId: [''],
    status: ['all'],
    minDistance: [null as number | null],
    maxDistance: [null as number | null],
    fromDate: [''],
    toDate: ['']
  });

  constructor() {
    void this.loadReferences();
  }

  private async loadReferences(): Promise<void> {
    const [categories, locations] = await Promise.all([
      firstValueFrom(this.reference.categories()),
      firstValueFrom(this.reference.locations())
    ]);
    this.categories.set(categories);
    this.locations.set(locations);
  }

  protected apply(): void {
    const value = this.form.getRawValue();
    const filters: EventFiltersValue = { status: value.status as EventFiltersValue['status'] };

    if (value.categoryId) {
      filters.categoryId = value.categoryId;
    }
    if (value.locationId) {
      filters.locationId = value.locationId;
    }
    if (value.minDistance !== null) {
      filters.minDistance = value.minDistance;
    }
    if (value.maxDistance !== null) {
      filters.maxDistance = value.maxDistance;
    }
    if (value.fromDate) {
      filters.fromDate = value.fromDate;
    }
    if (value.toDate) {
      filters.toDate = value.toDate;
    }

    this.filtersChange.emit(filters);
  }

  protected clear(): void {
    this.form.reset({
      categoryId: '',
      locationId: '',
      status: 'all',
      minDistance: null,
      maxDistance: null,
      fromDate: '',
      toDate: ''
    });
    this.filtersChange.emit({ status: 'all' });
  }
}
