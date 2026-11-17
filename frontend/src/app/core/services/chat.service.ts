import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiResponse } from '../models/api.model';
import { ChatRequest, ChatResponseData } from '../models/chat.model';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class ChatService {
  private readonly api = inject(ApiService);

  sendMessage(payload: ChatRequest): Observable<ApiResponse<ChatResponseData>> {
    return this.api.postAi<ApiResponse<ChatResponseData>>('agent/chat', payload);
  }
}
