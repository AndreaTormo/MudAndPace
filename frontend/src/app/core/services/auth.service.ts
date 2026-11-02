import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiResponse } from '../models/api.model';
import { AuthSession, AuthUser, LoginPayload, RegisterPayload } from '../models/auth.model';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiService);

  register(payload: RegisterPayload): Observable<AuthUser> {
    return this.api
      .post<ApiResponse<AuthUser>>('users/register', payload)
      .pipe(map((response) => response.data));
  }

  login(payload: LoginPayload): Observable<AuthSession> {
    return this.api
      .post<ApiResponse<AuthSession>>('auth/login', payload)
      .pipe(map((response) => response.data));
  }

  me(): Observable<AuthUser> {
    return this.api
      .get<ApiResponse<AuthUser>>('auth/me')
      .pipe(map((response) => response.data));
  }

  logout(): Observable<void> {
    return this.api
      .post<ApiResponse<null>>('auth/logout', {})
      .pipe(map(() => undefined));
  }
}
