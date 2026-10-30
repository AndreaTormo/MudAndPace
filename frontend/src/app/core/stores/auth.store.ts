import { Injectable, computed, signal } from '@angular/core';
import { AuthSession, AuthUser } from '../models/auth.model';

const STORAGE_KEY = 'mudandpace.auth';

interface StoredSession {
  token: string;
  expiresAt: string;
  user: AuthUser;
}

@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly _token = signal<string | null>(null);
  private readonly _user = signal<AuthUser | null>(null);
  private readonly _expiresAt = signal<number | null>(null);

  readonly token = this._token.asReadonly();
  readonly user = this._user.asReadonly();
  readonly expiresAt = this._expiresAt.asReadonly();
  isAuthenticated(): boolean {
    const token = this._token();
    const expiresAt = this._expiresAt();
    return Boolean(token && expiresAt && expiresAt > Date.now());
  }

  readonly isAdmin = computed(() => this._user()?.role === 'ADMIN');

  constructor() {
    this.restore();
  }

  setSession(session: AuthSession): void {
    const expiresAt = new Date(session.expiresAt).getTime();
    if (!session.token || !session.user || !Number.isFinite(expiresAt)) {
      this.clear();
      return;
    }

    this._token.set(session.token);
    this._user.set(session.user);
    this._expiresAt.set(expiresAt);
    this.persist();
  }

  updateUser(user: AuthUser): void {
    this._user.set(user);
    if (this._token()) {
      this.persist();
    }
  }

  clear(): void {
    this._token.set(null);
    this._user.set(null);
    this._expiresAt.set(null);
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
}
