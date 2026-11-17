import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, timeout } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.API_URL;
  private readonly aiBaseUrl = environment.AI_API_URL;
  private readonly requestTimeout = environment.requestTimeout;

  private headers(): HttpHeaders {
    return new HttpHeaders({ 'Content-Type': 'application/json' });
  }

  get<T>(endpoint: string, params?: HttpParams): Observable<T> {
    return this.getFrom<T>(this.baseUrl, endpoint, params);
  }

  getAi<T>(endpoint: string, params?: HttpParams): Observable<T> {
    return this.getFrom<T>(this.aiBaseUrl, endpoint, params);
  }

  post<T>(endpoint: string, body: unknown): Observable<T> {
    return this.postTo<T>(this.baseUrl, endpoint, body);
  }

  postAi<T>(endpoint: string, body: unknown): Observable<T> {
    return this.postTo<T>(this.aiBaseUrl, endpoint, body);
  }

  private getFrom<T>(baseUrl: string, endpoint: string, params?: HttpParams): Observable<T> {
    return this.http
      .get<T>(`${baseUrl}/${endpoint}`, {
        headers: this.headers(),
        params,
        withCredentials: true
      })
      .pipe(timeout(this.requestTimeout));
  }

  private postTo<T>(baseUrl: string, endpoint: string, body: unknown): Observable<T> {
    return this.http
      .post<T>(`${baseUrl}/${endpoint}`, body, {
        headers: this.headers(),
        withCredentials: true
      })
      .pipe(timeout(this.requestTimeout));
  }

  postFormData<T>(endpoint: string, body: FormData): Observable<T> {
    return this.http
      .post<T>(`${this.baseUrl}/${endpoint}`, body, { withCredentials: true })
      .pipe(timeout(this.requestTimeout));
  }

  put<T>(endpoint: string, body: unknown): Observable<T> {
    return this.http
      .put<T>(`${this.baseUrl}/${endpoint}`, body, {
        headers: this.headers(),
        withCredentials: true
      })
      .pipe(timeout(this.requestTimeout));
  }

  patch<T>(endpoint: string, body: unknown = {}): Observable<T> {
    return this.http
      .patch<T>(`${this.baseUrl}/${endpoint}`, body, {
        headers: this.headers(),
        withCredentials: true
      })
      .pipe(timeout(this.requestTimeout));
  }

  patchAi<T>(endpoint: string, body: unknown = {}): Observable<T> {
    return this.http
      .patch<T>(`${this.aiBaseUrl}/${endpoint}`, body, {
        headers: this.headers(),
        withCredentials: true
      })
      .pipe(timeout(this.requestTimeout));
  }

  delete<T>(endpoint: string): Observable<T> {
    return this.http
      .delete<T>(`${this.baseUrl}/${endpoint}`, {
        headers: this.headers(),
        withCredentials: true
      })
      .pipe(timeout(this.requestTimeout));
  }

  deleteAi<T>(endpoint: string, params?: HttpParams): Observable<T> {
    return this.http
      .delete<T>(`${this.aiBaseUrl}/${endpoint}`, {
        headers: this.headers(),
        params,
        withCredentials: true
      })
      .pipe(timeout(this.requestTimeout));
  }
}
