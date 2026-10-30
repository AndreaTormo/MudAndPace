import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiResponse } from '../models/api.model';
import {
  AuthUser,
  UpdateProfilePayload,
  UpdateUserPayload,
  UserProfile
} from '../models/auth.model';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly api = inject(ApiService);

  getById(id: string): Observable<AuthUser> {
    return this.api
      .get<ApiResponse<AuthUser>>(`users/${encodeURIComponent(id)}`)
      .pipe(map((response) => response.data));
  }

  update(id: string, payload: UpdateUserPayload): Observable<AuthUser> {
    return this.api
      .patch<ApiResponse<AuthUser>>(`users/${encodeURIComponent(id)}`, payload)
      .pipe(map((response) => response.data));
  }

  getProfile(): Observable<UserProfile> {
    return this.api
      .get<ApiResponse<UserProfile>>('profile/me')
      .pipe(map((response) => response.data));
  }

  updateProfile(payload: UpdateProfilePayload): Observable<UserProfile> {
    return this.api
      .patch<ApiResponse<UserProfile>>('profile/me', payload)
      .pipe(map((response) => response.data));
  }

  getProfileByUserId(id: string): Observable<UserProfile> {
    return this.api
      .get<ApiResponse<UserProfile>>(`profile/${encodeURIComponent(id)}`)
      .pipe(map((response) => response.data));
  }

  updateProfileByUserId(id: string, payload: UpdateProfilePayload): Observable<UserProfile> {
    return this.api
      .patch<ApiResponse<UserProfile>>(`profile/${encodeURIComponent(id)}`, payload)
      .pipe(map((response) => response.data));
  }
}
