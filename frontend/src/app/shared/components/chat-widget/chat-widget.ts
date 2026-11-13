import { ChangeDetectionStrategy, Component, ElementRef, effect, inject, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ChatStore } from '../../../core/stores/chat.store';

@Component({
  selector: 'app-chat-widget',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  template: `
    <div class="chat-widget">
      @if (chat.isOpen()) {
        <section class="chat-panel" aria-label="Asistente de trail running">
          <header class="chat-panel-header">
            <div class="chat-header-brand">
              <span class="chat-header-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M3 20h18L14 6l-3 5-2-3-6 12z"></path>
                  <path d="M9 20l3-5 3 5"></path>
                </svg>
              </span>
              <div>
                <p class="chat-panel-title">Asistente Mud and Pace</p>
                <p class="chat-panel-subtitle">Guía de trail y eventos</p>
              </div>
            </div>
            <button type="button" class="chat-icon-button" (click)="chat.close()" aria-label="Cerrar chat">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
            </button>
            <svg class="chat-header-mountains" viewBox="0 0 320 80" preserveAspectRatio="none" aria-hidden="true">
              <path d="M0 80 L60 28 L95 52 L150 10 L210 48 L255 22 L320 80 Z" fill="rgba(255,255,255,0.16)"></path>
              <path d="M0 80 L45 44 L85 62 L140 30 L190 58 L250 38 L320 80 Z" fill="rgba(255,255,255,0.10)"></path>
            </svg>
          </header>

          <div class="chat-messages" #messagesContainer>
            @if (!chat.hasMessages()) {
              <div class="chat-empty-state">
                <span class="chat-empty-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M3 20h18L14 6l-3 5-2-3-6 12z"></path>
                    <path d="M12 10v3"></path>
                  </svg>
                </span>
                <p class="chat-empty-title">¡Hola, corredor!</p>
                <p class="chat-empty">Pregúntame por rutas, material, preparación o eventos de trail.</p>
              </div>
            }
            @for (msg of chat.messages(); track $index) {
              <div class="chat-message" [class.chat-message-user]="msg.role === 'user'" [class.chat-message-assistant]="msg.role === 'assistant'">
                <p class="chat-message-role">{{ msg.role === 'user' ? 'Tú' : 'Asistente' }}</p>
                <p class="chat-message-content" [innerHTML]="formatMessage(msg.content)"></p>
              </div>
            }
            @if (chat.loading()) {
              <p class="chat-loading">El asistente está escribiendo...</p>
            }
          </div>

          @if (chat.error()) {
            <p class="chat-error">{{ chat.error() }}</p>
          }

          <form class="chat-input-row" (ngSubmit)="send()">
            <input
              class="chat-input"
              type="text"
              name="message"
              [(ngModel)]="draft"
              [disabled]="chat.loading()"
              maxlength="1000"
              placeholder="Escribe tu pregunta sobre trail..."
              autocomplete="off"
            />
            <button class="chat-send-button" type="submit" [disabled]="chat.loading() || !draft.trim()" aria-label="Enviar mensaje">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12l16-8-5 16-3-6-8-2z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>
            </button>
          </form>
        </section>
      }

      <button
        type="button"
        class="chat-fab"
        (click)="chat.toggle()"
        [attr.aria-expanded]="chat.isOpen()"
        [attr.aria-label]="chat.isOpen() ? 'Cerrar asistente' : 'Abrir asistente'"
      >
        @if (chat.isOpen()) {
          <svg class="chat-fab-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
        } @else {
          <span class="chat-fab-mountain" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 20h18L14 6l-3 5-2-3-6 12z"></path>
            </svg>
          </span>
          <span class="chat-fab-label">Asistente</span>
        }
      </button>
    </div>
  `
})
export class ChatWidget {
  readonly chat = inject(ChatStore);
  draft = '';

  private readonly messagesContainer = viewChild<ElementRef<HTMLDivElement>>('messagesContainer');

  constructor() {
    effect(() => {
      this.chat.messages();
      this.chat.loading();
      queueMicrotask(() => {
        const el = this.messagesContainer()?.nativeElement;
        if (el) el.scrollTop = el.scrollHeight;
      });
    });
  }

  protected formatMessage(content: string): string {
    const escaped = content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

    return escaped
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/__([^_]+)__/g, '<strong>$1</strong>')
      .replace(/`([^`]+)`/g, '<code>$1</code>');
  }

  send(): void {
    const text = this.draft;
    this.draft = '';
    this.chat.sendMessage(text);
  }
}
