import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal
} from '@angular/core';
import { AbstractControl, ReactiveFormsModule, FormBuilder, ValidationErrors } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import Swal from 'sweetalert2';
import { Comment } from '../../../../core/models/comment.model';
import { CommentService } from '../../../../core/services/comment.service';
import { RatingPanel } from '../rating-panel/rating-panel';
import { CommentSummary } from '../comment-summary/comment-summary';
import { AuthStore } from '../../../../core/stores/auth.store';
import { CommentsStore } from '../../../../core/stores/comments.store';
import { Pagination } from '../../../../shared/components/pagination/pagination';
import { resolveAssetUrl } from '../../../../shared/utils/asset.util';
import { formatDate } from '../../../../shared/utils/format.util';
import { isHttpError, showUnexpectedError } from '../../../../shared/utils/error.util';

const PAGE_SIZE = 5;
const MIN_LENGTH = 3;
const MAX_LENGTH = 1500;
const HTML_PATTERN = /<[^>]*>/i;
const HTML_ENTITY_PATTERN = /&(?:lt|gt|#x?0*(?:3c|3e|60|62))\b/i;
const DANGEROUS_SCHEME_PATTERN = /\b(?:javascript|data|vbscript)\s*:/i;

function commentContentValidator(control: AbstractControl): ValidationErrors | null {
  const raw = typeof control.value === 'string' ? control.value : '';

  if (HTML_PATTERN.test(raw) || HTML_ENTITY_PATTERN.test(raw) || DANGEROUS_SCHEME_PATTERN.test(raw)) {
    return { unsafeContent: true };
  }

  const value = raw.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  if (!value) {
    return { required: true };
  }
  if (value.length < MIN_LENGTH) {
    return { minlength: { requiredLength: MIN_LENGTH, actualLength: value.length } };
  }
  if (value.length > MAX_LENGTH) {
    return { maxlength: { requiredLength: MAX_LENGTH, actualLength: value.length } };
  }

  return null;
}

@Component({
  selector: 'app-comment-section',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, Pagination, RatingPanel, CommentSummary],
  providers: [CommentsStore],
  template: `
    <section class="comment-section mt-5 border-t border-gray-200 pt-5 dark:border-line">
      <div class="mb-3 flex items-center justify-between gap-3">
        <h3 class="text-sm font-semibold text-gray-900">Comentarios</h3>
        <span class="text-xs text-gray-400">{{ store.pagination().total }} comentarios</span>
      </div>

      <app-rating-panel [departureId]="departureId()" [canRate]="canComment()" />
      <app-comment-summary [departureId]="departureId()" />

      @if (canComment() && auth.isAuthenticated()) {
        <form class="comment-form" [formGroup]="form" (ngSubmit)="onSubmit()">
          <label class="sr-only" for="comment-content-{{ departureId() }}">Nuevo comentario</label>
          <textarea
            id="comment-content-{{ departureId() }}"
            formControlName="content"
            rows="3"
            minlength="3"
            maxlength="1500"
            placeholder="Comparte cómo fue la salida…"
            class="comment-input w-full resize-y rounded-xl border border-gray-300 bg-surface p-3 text-sm text-gray-800 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20 dark:border-line dark:bg-night2 dark:text-gray-800"
          ></textarea>
          @if (form.controls.content.touched && form.controls.content.invalid) {
            <p class="mt-1 text-xs text-red-600">
              @if (form.controls.content.hasError('unsafeContent')) {
                No se permiten etiquetas HTML ni esquemas peligrosos.
              } @else if (form.controls.content.hasError('required')) {
                Escribe un comentario.
              } @else if (form.controls.content.hasError('minlength')) {
                Mínimo 3 caracteres.
              } @else if (form.controls.content.hasError('maxlength')) {
                Máximo 1500 caracteres.
              }
            </p>
          }
          <div class="mt-2 flex flex-wrap items-center justify-between gap-2">
            <span class="text-xs text-gray-400">Mínimo 3 y máximo 1500 caracteres</span>
            <button type="submit" class="button-primary" [disabled]="store.submitting() || form.invalid">
              {{ store.submitting() ? 'Publicando…' : 'Publicar comentario' }}
            </button>
          </div>
        </form>
      } @else if (!auth.isAuthenticated()) {
        <p class="rounded-xl bg-gray-50 p-3 text-xs text-gray-500 dark:bg-night2">
          Inicia sesión para comentar. Los comentarios estarán disponibles cuando finalice la salida.
        </p>
      } @else {
        <p class="rounded-xl bg-gray-50 p-3 text-xs text-gray-500 dark:bg-night2">
          Los comentarios estarán disponibles cuando finalice la salida.
        </p>
      }

      @if (actionMessage()) {
        <p class="mt-3 rounded-xl border border-brand/30 bg-brand/5 p-3 text-sm text-brand" role="status">
          {{ actionMessage() }}
        </p>
      }

      @if (actionError()) {
        <p class="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">
          {{ actionError() }}
        </p>
      }

      @if (store.loading()) {
        <p class="mt-4 text-sm text-gray-500">Cargando comentarios…</p>
      } @else if (store.error()) {
        <div class="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {{ store.error() }}
        </div>
      } @else if (store.isEmpty()) {
        <p class="mt-4 text-sm text-gray-500">Todavía no hay comentarios. ¡Sé el primero!</p>
      } @else {
        <ul class="mt-4 space-y-3">
          @for (comment of store.comments(); track comment._id) {
            <li class="comment-card" [class.comment-card-hidden]="comment.status === 'hidden'">
              <div class="flex gap-3">
                <div class="comment-avatar" aria-hidden="true">
                  @if (avatarUrl(comment); as url) {
                    <img [src]="url" [alt]="authorName(comment)" class="h-full w-full object-cover" />
                  } @else {
                    {{ avatarInitial(comment) }}
                  }
                </div>
                <div class="min-w-0 flex-1">
                  <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span class="text-sm font-semibold text-gray-900">{{ authorName(comment) }}</span>
                    <span class="text-xs text-gray-400">{{ formatDate(comment.created_At) }}</span>
                    @if (comment.status === 'hidden') {
                      <span class="badge badge-inactive">Oculto</span>
                    }
                    @if (comment.status === 'reported') {
                      <span class="badge badge-draft">Reportado · {{ comment.reportCount }}</span>
                    }
                  </div>

                  @if (editingId() === comment._id) {
                    <form class="mt-2" [formGroup]="editForm" (ngSubmit)="onSaveEdit(comment)">
                      <textarea
                        formControlName="content"
                        rows="3"
                        minlength="3"
                        maxlength="1500"
                        class="comment-input w-full resize-y rounded-xl border border-gray-300 bg-surface p-3 text-sm text-gray-800 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20 dark:border-line dark:bg-night2 dark:text-gray-800"
                      ></textarea>
                      @if (editForm.controls.content.touched && editForm.controls.content.invalid) {
                        <p class="mt-1 text-xs text-red-600">
                          @if (editForm.controls.content.hasError('unsafeContent')) {
                            No se permiten etiquetas HTML ni esquemas peligrosos.
                          } @else if (editForm.controls.content.hasError('required')) {
                            Escribe un comentario.
                          } @else if (editForm.controls.content.hasError('minlength')) {
                            Mínimo 3 caracteres.
                          } @else if (editForm.controls.content.hasError('maxlength')) {
                            Máximo 1500 caracteres.
                          }
                        </p>
                      }
                      <div class="mt-2 flex flex-wrap gap-2">
                        <button type="submit" class="button-primary" [disabled]="editForm.invalid">Guardar</button>
                        <button type="button" class="button-secondary" (click)="cancelEdit()">Cancelar</button>
                      </div>
                    </form>
                  } @else {
                    <p class="comment-content mt-2 whitespace-pre-line text-sm leading-relaxed text-gray-700">{{ comment.content }}</p>
                  }

                  <div class="mt-3 flex flex-wrap items-center gap-2">
                    @if (auth.isAdmin()) {
                      <button
                        type="button"
                        class="state-pill"
                        [class.state-pill-active]="comment.status === 'visible'"
                        [class.state-pill-draft]="comment.status === 'reported'"
                        [class.state-pill-inactive]="comment.status === 'hidden'"
                        [disabled]="actionBusyId() === comment._id"
                        [attr.aria-label]="statusActionLabel(comment)"
                        [title]="statusActionLabel(comment)"
                        (click)="onToggleStatus(comment)"
                      >
                        {{ commentStatusLabel(comment) }}
                      </button>
                    }
                    @if (canEdit(comment)) {
                      <button
                        type="button"
                        class="icon-button"
                        [disabled]="actionBusyId() === comment._id"
                        [attr.aria-label]="'Editar comentario de ' + authorName(comment)"
                        title="Editar"
                        (click)="startEdit(comment)"
                      >
                        <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                          <path d="M12 20h9" />
                          <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z" />
                        </svg>
                      </button>
                    }
                    @if (canDelete(comment)) {
                      <button
                        type="button"
                        class="icon-button icon-button-danger"
                        [disabled]="actionBusyId() === comment._id"
                        [attr.aria-label]="'Eliminar comentario de ' + authorName(comment)"
                        title="Eliminar"
                        (click)="onDelete(comment)"
                      >
                        <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                          <path d="M3 6h18" />
                          <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                          <path d="M10 11v6M14 11v6" />
                        </svg>
                      </button>
                    }
                    @if (canReport(comment)) {
                      <button
                        type="button"
                        class="icon-button"
                        [disabled]="actionBusyId() === comment._id || comment.reportedByMe"
                        [attr.aria-label]="'Reportar comentario de ' + authorName(comment)"
                        title="Reportar"
                        (click)="onReport(comment)"
                      >
                        <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                          <path d="M5 21V4" />
                          <path d="M5 5h11l-2 3 2 3H5" />
                        </svg>
                      </button>
                    }
                  </div>
                </div>
              </div>
            </li>
          }
        </ul>

        <div class="mt-4">
          <app-pagination
            [pagination]="store.pagination()"
            label="comentarios"
            (pageChange)="onPageChange($event)"
          />
        </div>
      }
    </section>
  `
})
export class CommentSection {
  readonly departureId = input.required<string>();
  readonly canComment = input(true);

  protected readonly store = inject(CommentsStore);
  protected readonly auth = inject(AuthStore);
  private readonly service = inject(CommentService);
  private readonly fb = inject(FormBuilder);

  protected readonly form = this.fb.nonNullable.group({
    content: ['', [commentContentValidator]]
  });
  protected readonly editForm = this.fb.nonNullable.group({
    content: ['', [commentContentValidator]]
  });
  protected readonly editingId = signal<string | null>(null);
  protected readonly actionBusyId = signal<string | null>(null);
  protected readonly actionMessage = signal<string | null>(null);
  protected readonly actionError = signal<string | null>(null);
  protected readonly formatDate = formatDate;
  protected readonly currentUserId = computed(() => this.auth.user()?._id ?? null);

  private currentPage = 1;
  private loadToken = 0;

  constructor() {
    effect(
      () => {
        const departureId = this.departureId();
        const token = ++this.loadToken;
        this.store.reset();
        this.editingId.set(null);
        this.actionMessage.set(null);
        this.actionError.set(null);
        this.currentPage = 1;
        if (departureId) {
          void this.load(departureId, this.currentPage, token);
        }
      },
      { allowSignalWrites: true }
    );
  }

  protected authorName(comment: Comment): string {
    if (comment.author.deleted) {
      return 'Usuario eliminado';
    }
    return `${comment.author.firstName ?? ''} ${comment.author.lastName ?? ''}`.trim() || 'Usuario';
  }

  protected avatarInitial(comment: Comment): string {
    const name = comment.author.firstName?.trim();
    return name ? name.charAt(0).toUpperCase() : '?';
  }

  protected avatarUrl(comment: Comment): string | null {
    const url = comment.author.avatarUrl;
    return url && !comment.author.deleted ? resolveAssetUrl(url) : null;
  }

  protected canEdit(comment: Comment): boolean {
    return this.currentUserId() === comment.userId;
  }

  protected canDelete(comment: Comment): boolean {
    return this.canEdit(comment) || this.auth.isAdmin();
  }

  protected canReport(comment: Comment): boolean {
    const userId = this.currentUserId();
    return Boolean(
      userId &&
        userId !== comment.userId &&
        comment.status !== 'hidden' &&
        !comment.reportedByMe
    );
  }

  protected commentStatusLabel(comment: Comment): string {
    if (comment.status === 'hidden') return 'Oculto';
    if (comment.status === 'reported') return `Reportado (${comment.reportCount})`;
    return 'Visible';
  }

  protected statusActionLabel(comment: Comment): string {
    const action = comment.status === 'hidden' ? 'Mostrar' : 'Ocultar';
    return `${action} comentario de ${this.authorName(comment)}`;
  }

  protected async onSubmit(): Promise<void> {
    if (this.form.invalid || this.store.submitting()) {
      this.form.markAllAsTouched();
      return;
    }

    const content = this.form.getRawValue().content;
    this.actionMessage.set(null);
    this.actionError.set(null);
    this.store.setSubmitting(true);
    try {
      await firstValueFrom(this.service.create(this.departureId(), { content }));
      this.form.reset();
      this.actionMessage.set('Comentario publicado correctamente.');
      await this.load(this.departureId(), 1);
    } catch (error) {
      this.actionError.set('No se ha podido publicar el comentario. Inténtalo de nuevo.');
      if (!isHttpError(error)) {
        showUnexpectedError(error);
      }
    } finally {
      this.store.setSubmitting(false);
    }
  }

  protected startEdit(comment: Comment): void {
    this.editingId.set(comment._id);
    this.editForm.setValue({ content: comment.content });
    this.editForm.markAsUntouched();
  }

  protected cancelEdit(): void {
    this.editingId.set(null);
  }

  protected async onSaveEdit(comment: Comment): Promise<void> {
    if (this.editForm.invalid || this.actionBusyId()) {
      this.editForm.markAllAsTouched();
      return;
    }

    this.actionBusyId.set(comment._id);
    this.actionMessage.set(null);
    this.actionError.set(null);
    try {
      const updated = await firstValueFrom(
        this.service.update(comment._id, { content: this.editForm.getRawValue().content })
      );
      this.store.upsert(updated);
      this.editingId.set(null);
      this.actionMessage.set('Comentario actualizado correctamente.');
    } catch (error) {
      this.actionError.set('No se ha podido actualizar el comentario. Inténtalo de nuevo.');
      if (!isHttpError(error)) {
        showUnexpectedError(error);
      }
    } finally {
      this.actionBusyId.set(null);
    }
  }

  protected async onReport(comment: Comment): Promise<void> {
    if (this.actionBusyId() || !this.canReport(comment)) {
      return;
    }

    this.actionBusyId.set(comment._id);
    this.actionMessage.set(null);
    this.actionError.set(null);
    try {
      const updated = await firstValueFrom(this.service.report(comment._id));
      if (updated.status === 'hidden' && !this.auth.isAdmin()) {
        this.store.remove(updated._id);
      } else {
        this.store.upsert(updated);
      }
      await Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Comentario reportado',
        showConfirmButton: false,
        timer: 1800,
        timerProgressBar: true
      });
    } catch (error) {
      this.actionError.set('No se ha podido reportar el comentario. Inténtalo de nuevo.');
      if (!isHttpError(error)) {
        showUnexpectedError(error);
      }
    } finally {
      this.actionBusyId.set(null);
    }
  }

  protected async onDelete(comment: Comment): Promise<void> {
    if (this.actionBusyId()) {
      return;
    }

    const result = await Swal.fire({
      title: '¿Eliminar comentario?',
      text: 'El comentario dejará de verse en esta salida.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#A3B18A',
      cancelButtonColor: 'rgb(var(--line))',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (!result.isConfirmed) {
      return;
    }

    this.actionBusyId.set(comment._id);
    this.actionMessage.set(null);
    this.actionError.set(null);
    try {
      await firstValueFrom(this.service.remove(comment._id));
      this.store.remove(comment._id);
      this.actionMessage.set('Comentario eliminado correctamente.');
    } catch (error) {
      this.actionError.set('No se ha podido eliminar el comentario. Inténtalo de nuevo.');
      if (!isHttpError(error)) {
        showUnexpectedError(error);
      }
    } finally {
      this.actionBusyId.set(null);
    }
  }

  protected async onToggleStatus(comment: Comment): Promise<void> {
    if (this.actionBusyId()) {
      return;
    }

    const status = comment.status === 'hidden' ? 'visible' : 'hidden';
    this.actionBusyId.set(comment._id);
    this.actionMessage.set(null);
    this.actionError.set(null);
    try {
      const updated = await firstValueFrom(this.service.setStatus(comment._id, status));
      this.store.upsert(updated);
      this.actionMessage.set('Estado del comentario actualizado correctamente.');
    } catch (error) {
      this.actionError.set('No se ha podido actualizar el estado del comentario. Inténtalo de nuevo.');
      if (!isHttpError(error)) {
        showUnexpectedError(error);
      }
    } finally {
      this.actionBusyId.set(null);
    }
  }

  protected onPageChange(page: number): void {
    this.currentPage = page;
    void this.load(this.departureId(), page);
  }

  private async load(
    departureId: string,
    page: number,
    token: number = this.loadToken
  ): Promise<void> {
    this.store.setLoading(true);
    this.store.setError(null);
    try {
      const list = await firstValueFrom(this.service.list(departureId, page, PAGE_SIZE));
      if (token !== this.loadToken) return;
      this.store.setList(list);
      this.currentPage = list.pagination.page;
    } catch {
      if (token === this.loadToken) {
        this.store.setError('No se han podido cargar los comentarios. Inténtalo de nuevo.');
      }
    } finally {
      if (token === this.loadToken) {
        this.store.setLoading(false);
      }
    }
  }
}
