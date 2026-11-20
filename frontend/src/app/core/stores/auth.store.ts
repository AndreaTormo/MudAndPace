import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, finalize, map, shareReplay, tap } from 'rxjs';
import {
  AuthSession,
  AuthUser,
  LoginPayload,
  RegisterPayload
} from '../models/auth.model';
import { AuthService } from '../services/auth.service';

const STORAGE_KEY = 'mudandpace.session';
const LEGACY_STORAGE_KEY = 'mudandpace.auth';
const MAX_TIMEOUT = 2_147_483_647;

interface StoredSession {
  expiresAt: string;
  username: string;
}

@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly authService = inject(AuthService);
  private expiryTimer: ReturnType<typeof setTimeout> | null = null;

  private readonly _user = signal<AuthUser | null>(null);
  private readonly _username = signal<string | null>(null);
  private readonly _expiresAt = signal<number | null>(null);
  private readonly _canManage = signal<boolean | null>(null);
  private readonly _sessionExpired = signal(false);
  private userRevision = 0;
  private refreshInFlight: Observable<AuthSession> | null = null;

  readonly user = this._user.asReadonly();
  readonly username = this._username.asReadonly();
  readonly expiresAt = this._expiresAt.asReadonly();
  readonly canManage = this._canManage.asReadonly();
  readonly sessionExpired = this._sessionExpired.asReadonly();

  readonly isAdmin = computed(() => this._canManage() === true);

  constructor() {
    this.restore();
  }

  isAuthenticated(): boolean {
    const expiresAt = this._expiresAt();
    return Boolean(expiresAt && expiresAt > Date.now());
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

  loginUser(payload: LoginPayload): Observable<AuthUser> {
    return this.authService.userLogin(payload).pipe(
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

  refreshSession(): Observable<AuthSession> {
    if (!this.refreshInFlight) {
      const revision = this.userRevision;

      this.refreshInFlight = this.authService.refresh().pipe(
        tap((session) => {
          if (revision === this.userRevision) {
            this.setSession(session);
          }
        }),
        finalize(() => {
          this.refreshInFlight = null;
        }),
        shareReplay({ bufferSize: 1, refCount: false })
      );
    }

    return this.refreshInFlight;
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
    this._username.set(session.user.name);
    this._expiresAt.set(expiresAt);
    this._canManage.set(session.user.canManage ?? false);
    this.persist();
    this.scheduleExpiry();
  }

  updateUser(user: AuthUser): void {
    this.userRevision += 1;
    this._user.set(user);
    this._username.set(user.name);
    this._canManage.set(user.canManage ?? false);
    if (this._expiresAt()) {
      this.persist();
    }
  }

  clear(): void {
    this.userRevision += 1;
    this.refreshInFlight = null;
    this.cancelExpiry();
    this._user.set(null);
    this._username.set(null);
    this._expiresAt.set(null);
    this._canManage.set(null);
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

      const session = JSON.parse(raw) as StoredSession & { user?: AuthUser };
      const expiresAt = new Date(session.expiresAt).getTime();
      const username = session.username ?? session.user?.name;
      if (!username || !Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
        this.clear();
        return;
      }

      this._username.set(username);
      this._expiresAt.set(expiresAt);
      this.persist();
      this.scheduleExpiry();
    } catch {
      this.clear();
    }
  }

  private persist(): void {
    const username = this._username();
    const expiresAt = this._expiresAt();
    if (!username || !expiresAt) return;

    const session: StoredSession = {
      expiresAt: new Date(expiresAt).toISOString(),
      username
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
