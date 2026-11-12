import { Injectable, computed, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';
import { ChatMessage } from '../models/chat.model';
import { ChatService } from '../services/chat.service';

@Injectable({ providedIn: 'root' })
export class ChatStore {
  private readonly chatService = inject(ChatService);

  private readonly messagesSignal = signal<ChatMessage[]>([]);
  private readonly openSignal = signal(false);
  private readonly loadingSignal = signal(false);
  private readonly errorSignal = signal<string | null>(null);

  readonly messages = this.messagesSignal.asReadonly();
  readonly isOpen = this.openSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly hasMessages = computed(() => this.messagesSignal().length > 0);

  toggle(): void {
    this.openSignal.update((open) => !open);
  }

  close(): void {
    this.openSignal.set(false);
  }

  clearError(): void {
    this.errorSignal.set(null);
  }

  sendMessage(content: string): void {
    const message = content.trim();
    if (!message || this.loadingSignal()) return;

    this.errorSignal.set(null);
    const history = this.messagesSignal().slice(-10);
    const userMessage: ChatMessage = { role: 'user', content: message };
    this.messagesSignal.update((messages) => [...messages, userMessage]);
    this.loadingSignal.set(true);

    this.chatService
      .sendMessage({ message, history })
      .pipe(finalize(() => this.loadingSignal.set(false)))
      .subscribe({
        next: (response) => {
          const reply = response.data?.reply?.trim();
          if (!reply) {
            this.errorSignal.set('El asistente no ha devuelto una respuesta.');
            return;
          }
          this.messagesSignal.update((messages) => [
            ...messages,
            { role: 'assistant', content: reply }
          ]);
        },
        error: () => {
          this.errorSignal.set('No se ha podido obtener respuesta del asistente. Inténtalo de nuevo.');
        }
      });
  }
}
