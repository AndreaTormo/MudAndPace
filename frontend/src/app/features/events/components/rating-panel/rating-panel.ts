import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal
} from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AuthStore } from '../../../../core/stores/auth.store';
import { RatingService } from '../../../../core/services/rating.service';
import { RatingsStore } from '../../../../core/stores/ratings.store';
import { StarRating } from '../../../../shared/components/star-rating/star-rating';
import { isHttpError, showUnexpectedError } from '../../../../shared/utils/error.util';

@Component({
  selector: 'app-rating-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [StarRating],
  providers: [RatingsStore],
  template: `
    <section class="rating-panel mt-4 rounded-xl border border-gray-200 bg-surface p-4 dark:border-line dark:bg-night2">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 class="text-sm font-semibold text-gray-900">
            Valora esta salida
          </h3>
          <p class="mt-1 text-xs text-gray-500">
            @if (store.loading()) {
              Cargando valoración…
            } @else if (store.summary().total > 0) {
              {{ averageLabel() }} ·
              {{ store.summary().total }}
              {{ store.summary().total === 1 ? 'valoración' : 'valoraciones' }}
            } @else {
              Todavía no hay valoraciones.
            }
          </p>
        </div>

        <div class="flex flex-col items-end gap-2">
          <app-star-rating
            [value]="store.summary().mine"
            [readOnly]="!canEdit()"
            [disabled]="!canEdit()"
            [loading]="store.loading() || store.submitting()"
            label="Tu valoración de esta salida"
            (valueChange)="onRate($event)"
          />

          @if (canRemove()) {
            <button
              type="button"
              class="text-xs font-semibold text-brand hover:underline disabled:opacity-50"
              [disabled]="store.submitting()"
              (click)="onRemove()"
            >
              Quitar mi valoración
            </button>
          }
        </div>
      </div>

      @if (!auth.isAuthenticated()) {
        <p class="mt-3 text-xs text-gray-500">Inicia sesión para poder valorar esta salida.</p>
      } @else if (!canRate()) {
        <p class="mt-3 text-xs text-gray-500">
          Podrás valorar la salida cuando haya finalizado.
        </p>
      }

      @if (actionMessage()) {
        <p class="mt-3 rounded-lg border border-brand/30 bg-brand/5 p-2 text-xs text-brand" role="status">
          {{ actionMessage() }}
        </p>
      }
      @if (store.error()) {
        <p class="mt-3 rounded-lg border border-red-200 bg-red-50 p-2 text-xs text-red-700" role="alert">
          {{ store.error() }}
        </p>
      }
    </section>
  `
})
export class RatingPanel {
  readonly departureId = input.required<string>();
  readonly canRate = input(true);

  protected readonly store = inject(RatingsStore);
  protected readonly auth = inject(AuthStore);
  private readonly service = inject(RatingService);

  protected readonly actionMessage = signal<string | null>(null);
  protected readonly averageLabel = computed(() => {
    const average = this.store.summary().average;
    return average === null || !Number.isFinite(average)
      ? 'Sin valorar'
      : `${average.toFixed(1)} / 5`;
  });
  protected readonly canEdit = computed(
    () => this.auth.isAuthenticated() && this.canRate() && !this.store.submitting()
  );
  protected readonly canRemove = computed(
    () => this.canEdit() && this.store.summary().mine !== null
  );

  private token = 0;

  constructor() {
    effect(
      () => {
        const departureId = this.departureId();
        this.token += 1;
        this.store.reset();
        this.actionMessage.set(null);
        if (departureId) {
          void this.load(departureId, this.token);
        }
      },
      { allowSignalWrites: true }
    );
  }

  protected async onRate(score: number): Promise<void> {
    if (!this.canEdit()) return;

    this.actionMessage.set(null);
    this.store.setError(null);
    this.store.setSubmitting(true);
    try {
      const result = await firstValueFrom(
        this.service.save(this.departureId(), score)
      );
      this.store.setSummary(result.summary);
      this.actionMessage.set('Valoración guardada correctamente.');
    } catch (error) {
      this.store.setError('No se ha podido guardar la valoración. Inténtalo de nuevo.');
      if (!isHttpError(error)) {
        showUnexpectedError(error);
      }
    } finally {
      this.store.setSubmitting(false);
    }
  }

  protected async onRemove(): Promise<void> {
    if (!this.canRemove()) return;

    this.actionMessage.set(null);
    this.store.setError(null);
    this.store.setSubmitting(true);
    try {
      const result = await firstValueFrom(this.service.remove(this.departureId()));
      this.store.setSummary(result.summary);
      this.actionMessage.set('Valoración eliminada correctamente.');
    } catch (error) {
      this.store.setError('No se ha podido eliminar la valoración. Inténtalo de nuevo.');
      if (!isHttpError(error)) {
        showUnexpectedError(error);
      }
    } finally {
      this.store.setSubmitting(false);
    }
  }

  private async load(departureId: string, token: number): Promise<void> {
    this.store.setLoading(true);
    this.store.setError(null);
    try {
      const summary = await firstValueFrom(this.service.get(departureId));
      if (token !== this.token) return;
      this.store.setSummary(summary);
    } catch {
      if (token === this.token) {
        this.store.setError('No se ha podido cargar la valoración. Inténtalo de nuevo.');
      }
    } finally {
      if (token === this.token) {
        this.store.setLoading(false);
      }
    }
  }
}
