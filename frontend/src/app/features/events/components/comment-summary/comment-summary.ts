import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  input
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { Subject, catchError, filter, map, of, startWith, switchMap } from 'rxjs';
import { CommentSummary as CommentSummaryData } from '../../../../core/models/aiAnalysis.model';
import { AiAnalysisService } from '../../../../core/services/aiAnalysis.service';
import { CommentSummaryStore } from '../../../../core/stores/commentSummary.store';
import { isHttpError } from '../../../../shared/utils/error.util';

@Component({
  selector: 'app-comment-summary',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [CommentSummaryStore],
  template: `
    <section class="comment-summary mt-4 rounded-xl border border-brand/20 bg-brand/5 p-4 dark:border-brand/30 dark:bg-brand/10">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <h3 class="text-sm font-semibold text-gray-900">
          Resumen de comentarios
        </h3>
        @if (!store.loading() && !store.error() && store.summary().commentCount > 0) {
          <span class="text-xs text-gray-500">
            Basado en {{ store.summary().commentCount }}
            {{ store.summary().commentCount === 1 ? 'comentario' : 'comentarios' }}
          </span>
        }
      </div>

      @if (store.loading()) {
        <p class="mt-2 text-xs text-gray-500">Generando resumen…</p>
      } @else if (store.error()) {
        <div class="mt-2 flex flex-wrap items-center gap-3">
          <p class="text-xs text-red-600" role="alert">{{ store.error() }}</p>
          <button
            type="button"
            class="text-xs font-semibold text-brand hover:underline"
            (click)="retry()"
          >
            Reintentar
          </button>
        </div>
      } @else if (store.summary().state === 'no_data') {
        <p class="mt-2 text-xs text-gray-500">
          Todavía no hay comentarios publicados sobre esta salida.
        </p>
      } @else {
        <p class="mt-2 text-sm leading-relaxed text-gray-700">
          {{ store.summary().summary }}
        </p>

        @if (store.summary().highlights.length > 0) {
          <div class="mt-3">
            <p class="text-xs font-semibold uppercase tracking-wide text-gray-500">Puntos destacados</p>
            <ul class="mt-1 list-inside list-disc space-y-0.5 text-xs text-gray-700">
              @for (item of store.summary().highlights; track item) {
                <li>{{ item }}</li>
              }
            </ul>
          </div>
        }

        @if (store.summary().improvements.length > 0) {
          <div class="mt-3">
            <p class="text-xs font-semibold uppercase tracking-wide text-gray-500">Aspectos a mejorar</p>
            <ul class="mt-1 list-inside list-disc space-y-0.5 text-xs text-gray-700">
              @for (item of store.summary().improvements; track item) {
                <li>{{ item }}</li>
              }
            </ul>
          </div>
        }
      }
    </section>
  `
})
export class CommentSummary {
  readonly departureId = input.required<string>();

  protected readonly store = inject(CommentSummaryStore);
  private readonly service = inject(AiAnalysisService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly retry$ = new Subject<void>();

  constructor() {
    toObservable(this.departureId)
      .pipe(
        filter((departureId): departureId is string => Boolean(departureId)),
        switchMap((departureId) =>
          this.retry$.pipe(
            startWith(undefined),
            map(() => departureId)
          )
        ),
        switchMap((departureId) => this.loadSummary(departureId)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(({ summary, error }) => {
        this.store.setLoading(false);
        if (error) {
          this.store.setError(error);
        } else if (summary) {
          this.store.setSummary(summary);
        }
      });
  }

  protected retry(): void {
    this.retry$.next();
  }

  private loadSummary(departureId: string) {
    this.store.reset();
    this.store.setLoading(true);
    return this.service.getCommentSummary(departureId).pipe(
      map((summary) => ({ summary, error: null as string | null })),
      catchError((error: unknown) =>
        of({ summary: null as CommentSummaryData | null, error: this.summaryErrorMessage(error) })
      )
    );
  }

  private summaryErrorMessage(error: unknown): string {
    if ((error as { name?: string } | null | undefined)?.name === 'TimeoutError') {
      return 'El resumen está tardando demasiado. Pulsa Reintentar.';
    }
    if (isHttpError(error)) {
      const code = (error.error as { error?: { code?: string } } | null | undefined)?.error?.code;
      if (code === 'TOO_MANY_REQUESTS') {
        return 'Demasiadas solicitudes al resumen. Espera un momento y reintenta.';
      }
      if (code === 'AI_INVALID_RESPONSE') {
        return 'El servicio IA ha devuelto una respuesta inesperada. Pulsa Reintentar.';
      }
      if (code === 'AI_UNAVAILABLE') {
        return 'El servicio IA no está disponible ahora mismo. Pulsa Reintentar.';
      }
    }
    return 'No se ha podido cargar el resumen. Pulsa Reintentar.';
  }
}
