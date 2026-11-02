import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, finalize, map, of } from 'rxjs';
import {
  AuthSession,
  AuthUser,
  LoginPayload,
  RegisterPayload,
  UserRole
} from '../models/auth.model';
import { AuthService } from '../services/auth.service';

const STORAGE_KEY = 'mudandpace.auth';
const MAX_TIMEOUT = 2_147_483_647;

interface StoredSession {
  token: string;
  expiresAt: string;
  user: AuthUser;
}

@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly authService = inject(AuthService);
  private expiryTimer: ReturnType<typeof setTimeout> | null = null;

  private readonly _token = signal<string | null>(null);
  private readonly _user = signal<AuthUser | null>(null);
  private readonly _expiresAt = signal<number | null>(null);
  private readonly _sessionExpired = signal(false);

  readonly token = this._token.asReadonly();
  readonly user = this._user.asReadonly();
  readonly expiresAt = this._expiresAt.asReadonly();
  readonly sessionExpired = this._sessionExpired.asReadonly();

  readonly roles = computed<UserRole[]>(() => {
    const role = this._user()?.role;
    return role ? [role] : [];
  });

  readonly isAdmin = computed(() => this._user()?.role === 'ADMIN');

  constructor() {
    this.restore();
  }

  isAuthenticated(): boolean {
    const token = this._token();
    const expiresAt = this._expiresAt();
    return Boolean(token && expiresAt && expiresAt > Date.now());
  }

  hasRole(role: string): boolean {
    return this._user()?.role === role;
  }

  register(payload: RegisterPayload): Observable<AuthUser> {
    return this.authService.register(payload);
  }

  login(payload: LoginPayload): Observable<AuthUser> {
    return this.authService.login(payload).pipe(
      map((session) => {
        this.setSession(session);
        return session.user;
      })
    );
  }

  refreshMe(): Observable<AuthUser> {
    return this.authService.me().pipe(
      map((user) => {
        this.updateUser(user);
        return user;
      })
    );
  }

  logout(): Observable<void> {
    if (!this._token()) {
      this.clear();
      return of(undefined);
    }

    return this.authService.logout().pipe(finalize(() => this.clear()));
  }

  setSession(session: AuthSession): void {
    const expiresAt = new Date(session.expiresAt).getTime();
    if (!session.token || !session.user || !Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
      this.clear();
      return;
    }

    this._sessionExpired.set(false);
    this._token.set(session.token);
    this._user.set(session.user);
    this._expiresAt.set(expiresAt);
    this.persist();
    this.scheduleExpiry();
  }

  updateUser(user: AuthUser): void {
    this._user.set(user);
    if (this._token()) {
      this.persist();
    }
  }

  clear(): void {
    this.cancelExpiry();
    this._token.set(null);
    this._user.set(null);
    this._expiresAt.set(null);
    this._sessionExpired.set(false);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Almacenamiento no disponible.
    }
  }

  private restore(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;

      const session = JSON.parse(raw) as StoredSession;
      const expiresAt = new Date(session.expiresAt).getTime();
      if (!session.token || !session.user || !Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
        this.clear();
        return;
      }

      this._token.set(session.token);
      this._user.set(session.user);
      this._expiresAt.set(expiresAt);
      this.scheduleExpiry();
    } catch {
      this.clear();
    }
  }

  private persist(): void {
    const token = this._token();
    const user = this._user();
    const expiresAt = this._expiresAt();
    if (!token || !user || !expiresAt) return;

    const session: StoredSession = {
      token,
      user,
      expiresAt: new Date(expiresAt).toISOString()
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } catch {
      // Almacenamiento no disponible.
    }
  }

  private scheduleExpiry(): void {
    this.cancelExpiry();
    const expiresAt = this._expiresAt();
    if (!expiresAt) return;

    const delay = expiresAt - Date.now();
    if (delay <= 0) {
      this.expire();
      return;
    }

    this.expiryTimer = setTimeout(() => {
      if (Date.now() >= expiresAt) {
        this.expire();
        return;
      }
      this.scheduleExpiry();
    }, Math.min(delay, MAX_TIMEOUT));
  }

  private cancelExpiry(): void {
    if (this.expiryTimer !== null) {
      clearTimeout(this.expiryTimer);
      this.expiryTimer = null;
    }
  }

  private expire(): void {
    this.clear();
    this._sessionExpired.set(true);
  }
}
