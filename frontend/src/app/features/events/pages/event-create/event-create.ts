import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import Swal from 'sweetalert2';
import {
  EventCategory,
  EventFormValue,
  EventHost,
  EventLocation
} from '../../../../core/models/event.model';
import { EventService } from '../../../../core/services/event.service';
import { ReferenceService } from '../../../../core/services/reference.service';
import { EventsStore } from '../../../../core/stores/events.store';
import { ErrorState } from '../../../../shared/components/error-state/error-state';
import { isHttpError, showUnexpectedError } from '../../../../shared/utils/error.util';
import { EventForm } from '../../components/event-form/event-form';
import { toEventPayload } from '../../utils/event-payload.util';

@Component({
  selector: 'app-event-create',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, EventForm, ErrorState],
  template: `
    <div class="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <nav class="mb-6 flex items-center gap-2 text-sm text-gray-500">
        <a routerLink="/events" class="hover:text-gray-800 hover:underline">Eventos</a>
        <span>/</span>
        <span class="font-medium text-gray-800">Nuevo evento</span>
      </nav>

      <div class="mb-6">
        <h1 class="text-2xl font-semibold text-gray-900">Crear evento</h1>
        <p class="mt-0.5 text-sm text-gray-500">
          Rellena los datos obligatorios para dar de alta un evento en la API.
        </p>
      </div>

      @if (referenceError(); as message) {
        <div class="mb-6">
          <app-error-state [message]="message" (retry)="loadReferences()" />
        </div>
      }

      <app-event-form
        [event]="null"
        [categories]="categories()"
        [locations]="locations()"
        [hosts]="hosts()"
        (formSubmit)="onCreate($event)"
        (cancelled)="onCancel()"
      />
    </div>
  `
})
export class EventCreate implements OnInit {
  private readonly service = inject(EventService);
  private readonly reference = inject(ReferenceService);
  private readonly store = inject(EventsStore);
  private readonly router = inject(Router);

  protected readonly submitting = signal(false);

  protected readonly categories = signal<EventCategory[]>([]);
  protected readonly locations = signal<EventLocation[]>([]);
  protected readonly hosts = signal<EventHost[]>([]);
  protected readonly referenceError = signal<string | null>(null);

  ngOnInit(): void {
    void this.loadReferences();
  }

  protected async loadReferences(): Promise<void> {
    this.referenceError.set(null);

    try {
      const [categories, locations, hosts] = await Promise.all([
        firstValueFrom(this.reference.categories()),
        firstValueFrom(this.reference.locations()),
        firstValueFrom(this.reference.hosts())
      ]);
      this.categories.set(categories);
      this.locations.set(locations);
      this.hosts.set(hosts);
    } catch (error) {
      this.categories.set([]);
      this.locations.set([]);
      this.hosts.set([]);
      this.referenceError.set(
        'No se han podido cargar las categorías, las ubicaciones y los organizadores.'
      );
      if (!isHttpError(error)) {
        showUnexpectedError(error);
      }
    }
  }

  protected async onCreate(value: EventFormValue): Promise<void> {
    if (this.submitting()) {
      return;
    }

    this.submitting.set(true);

    try {
      const created = await firstValueFrom(this.service.create(toEventPayload(value)));
      this.store.markStale();
      this.router.navigate(['/events', created._id]);
      Swal.fire({
        icon: 'success',
        title: 'Evento creado',
        text: `${created.name} se ha guardado correctamente.`,
        timer: 2000,
        showConfirmButton: false
      });
    } catch (error) {
      if (!isHttpError(error)) {
        showUnexpectedError(error);
      }
    } finally {
      this.submitting.set(false);
    }
  }

  protected onCancel(): void {
    this.router.navigate(['/events']);
  }
}
