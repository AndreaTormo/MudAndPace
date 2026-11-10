import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, finalize, map } from 'rxjs';
import {
  AuthSession,
  AuthUser,
  LoginPayload,
  RegisterPayload,
  UserRole
} from '../models/auth.model';
import { AuthService } from '../services/auth.service';

const STORAGE_KEY = 'mudandpace.session';
const LEGACY_STORAGE_KEY = 'mudandpace.auth';
const MAX_TIMEOUT = 2_147_483_647;

interface StoredSession {
  expiresAt: string;
  user: AuthUser;
}

@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly authService = inject(AuthService);
  private expiryTimer: ReturnType<typeof setTimeout> | null = null;

  private readonly _user = signal<AuthUser | null>(null);
  private readonly _expiresAt = signal<number | null>(null);
  private readonly _sessionExpired = signal(false);
  private userRevision = 0;

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
    const user = this._user();
    const expiresAt = this._expiresAt();
    return Boolean(user && expiresAt && expiresAt > Date.now());
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
    const revision = this.userRevision;

    return this.authService.me().pipe(
      map((user) => {
        if (revision === this.userRevision) {
          this.updateUser(user);
        }
        return user;
      })
    );
  }

  logout(): Observable<void> {
    return this.authService.logout().pipe(finalize(() => this.clear()));
  }

  setSession(session: AuthSession): void {
    const expiresAt = new Date(session.expiresAt).getTime();
    if (!session.user || !Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
      this.clear();
      return;
    }

    this.userRevision += 1;
    this._sessionExpired.set(false);
    this._user.set(session.user);
    this._expiresAt.set(expiresAt);
    this.persist();
    this.scheduleExpiry();
  }

  updateUser(user: AuthUser): void {
    this.userRevision += 1;
    this._user.set(user);
    if (this._expiresAt()) {
      this.persist();
    }
  }

  clear(): void {
    this.userRevision += 1;
    this.cancelExpiry();
    this._user.set(null);
    this._expiresAt.set(null);
    this._sessionExpired.set(false);
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(LEGACY_STORAGE_KEY);
    } catch {
      // Almacenamiento no disponible.
    }
  }

  private restore(): void {
    try {
      localStorage.removeItem(LEGACY_STORAGE_KEY);

      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;

      const session = JSON.parse(raw) as StoredSession;
      const expiresAt = new Date(session.expiresAt).getTime();
      if (!session.user || !Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
        this.clear();
        return;
      }

      this._user.set(session.user);
      this._expiresAt.set(expiresAt);
      this.scheduleExpiry();
    } catch {
      this.clear();
    }
  }

  private persist(): void {
    const user = this._user();
    const expiresAt = this._expiresAt();
    if (!user || !expiresAt) return;

    const session: StoredSession = {
      user,
      expiresAt: new Date(expiresAt).toISOString()
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      localStorage.removeItem(LEGACY_STORAGE_KEY);
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
