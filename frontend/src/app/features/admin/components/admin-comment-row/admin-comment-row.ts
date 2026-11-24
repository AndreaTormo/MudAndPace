import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { Comment } from '../../../../core/models/comment.model';
import { UserAvatar } from '../../../../shared/components/user-avatar/user-avatar';
import { formatDate } from '../../../../shared/utils/format.util';

@Component({
  selector: 'app-admin-comment-row',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UserAvatar],
  template: `
    <div
      class="flex flex-col gap-3 p-4 transition-colors hover:bg-gray-50/70 sm:flex-row sm:items-start sm:gap-4"
      [class.comment-card-hidden]="comment().status === 'hidden'"
    >
      <div class="flex min-w-0 flex-1 items-start gap-3">
        <app-user-avatar
          size="md"
          [name]="authorName()"
          [avatarUrl]="comment().author.avatarUrl ?? null"
        />

        <div class="min-w-0">
          <div class="flex flex-wrap items-center gap-2">
            <p class="font-semibold text-gray-900">{{ authorName() }}</p>
            <span [class]="'badge ' + statusClass()">{{ statusLabel() }}</span>
            @if (comment().variant) {
              <span class="badge bg-brand/10 text-brand">{{ comment().variant }}</span>
            }
          </div>

          <p class="comment-content mt-2 whitespace-pre-line break-words rounded-lg bg-gray-50/70 px-3 py-2 text-sm leading-relaxed text-gray-700 dark:bg-night/60">
            {{ comment().content }}
          </p>

          <div class="mt-2 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-gray-500">
            <span>
              <strong class="font-semibold text-gray-900">{{ eventName() }}</strong>
              · Evento
            </span>
            <span>
              <strong class="font-semibold text-gray-900">{{ variantLabel() }}</strong>
              · Modalidad
            </span>
            <span>Publicado: {{ formatDate(comment().created_At) }}</span>
            @if (comment().deleted_at) {
              <span>Eliminado: {{ formatDate(comment().deleted_at!) }}</span>
            }
          </div>
        </div>
      </div>

      <div class="flex shrink-0 flex-wrap items-center gap-2 self-start">
        @if (comment().deleted_at) {
          <button
            type="button"
            class="icon-button icon-button-success"
            [disabled]="busy()"
            [attr.aria-label]="'Restaurar comentario de ' + authorName()"
            title="Restaurar"
            (click)="restore.emit()"
          >
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <path d="m9 11 3 3L22 4" />
            </svg>
          </button>
        } @else {
          <button
            type="button"
            class="state-pill"
            [class.state-pill-active]="comment().status === 'visible'"
            [class.state-pill-draft]="comment().status === 'reported'"
            [class.state-pill-inactive]="comment().status === 'hidden'"
            [disabled]="busy()"
            [attr.aria-label]="statusActionLabel()"
            [title]="statusActionLabel()"
            (click)="toggle.emit()"
          >
            {{ statusLabel() }}
          </button>
          <button
            type="button"
            class="icon-button icon-button-danger"
            [disabled]="busy()"
            [attr.aria-label]="'Eliminar comentario de ' + authorName()"
            title="Eliminar"
            (click)="remove.emit()"
          >
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M3 6h18" />
              <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              <path d="M10 11v6M14 11v6" />
            </svg>
          </button>
        }
      </div>
    </div>
  `
})
export class AdminCommentRow {
  readonly comment = input.required<Comment>();
  readonly busy = input(false);
  readonly toggle = output<void>();
  readonly remove = output<void>();
  readonly restore = output<void>();

  protected readonly formatDate = formatDate;

  protected readonly authorName = computed(() => {
    const author = this.comment().author;
    const fullName = [author.firstName, author.lastName].filter(Boolean).join(' ');
    return fullName || (author.deleted ? 'Usuario eliminado' : 'Usuario');
  });

  protected readonly eventName = computed(() => this.comment().event?.name ?? 'Evento eliminado');
  protected readonly variantLabel = computed(() => this.comment().variant ?? 'Sin modalidad');

  protected readonly statusLabel = computed(() => {
    const status = this.comment().status;
    if (status === 'hidden') return 'Oculto';
    if (status === 'reported') {
      return `Reportado (${this.comment().reportCount})`;
    }
    return 'Visible';
  });

  protected readonly statusClass = computed(() => {
    const status = this.comment().status;
    if (status === 'hidden') return 'badge-inactive';
    if (status === 'reported') return 'badge-draft';
    return 'badge-active';
  });

  protected readonly statusActionLabel = computed(() => {
    const action = this.comment().status === 'hidden' ? 'Mostrar' : 'Ocultar';
    return `${action} comentario de ${this.authorName()}`;
  });
}
