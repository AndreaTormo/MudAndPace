import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of } from 'rxjs';
import { AuthStore } from './auth.store';
import { AuthService } from '../services/auth.service';
import { AuthSession, AuthUser, UserRole } from '../models/auth.model';

const STORAGE_KEY = 'mudandpace.auth';

function makeUser(role: UserRole = 'USER'): AuthUser {
  return {
    _id: 'u1',
    name: 'Test User',
    email: 'user@test.com',
    role,
    isActive: true,
    emailVerified: true
  };
}

function makeSession(expiresAt: number = Date.now() + 3_600_000): AuthSession {
  return {
    token: 'test-token',
    expiresAt: new Date(expiresAt).toISOString(),
    user: makeUser()
  };
}

describe('AuthStore', () => {
  let authService: jasmine.SpyObj<AuthService>;

  function store(): AuthStore {
    return TestBed.inject(AuthStore);
  }

  beforeEach(() => {
    localStorage.removeItem(STORAGE_KEY);
    authService = jasmine.createSpyObj('AuthService', ['login', 'logout', 'me', 'register']);
    TestBed.configureTestingModule({
      providers: [{ provide: AuthService, useValue: authService }]
    });
  });

  afterEach(() => {
    localStorage.removeItem(STORAGE_KEY);
  });

  describe('restore (arranque desde localStorage)', () => {
    it('arranca sin sesión cuando no hay nada en localStorage', () => {
      const s = store();
      expect(s.isAuthenticated()).toBeFalse();
      expect(s.token()).toBeNull();
      expect(s.user()).toBeNull();
    });

    it('restaura token, usuario y expiración desde localStorage', () => {
      const session = makeSession();
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ token: session.token, expiresAt: session.expiresAt, user: session.user })
      );

      const s = store();
      expect(s.isAuthenticated()).toBeTrue();
      expect(s.token()).toBe('test-token');
      expect(s.user()?.email).toBe('user@test.com');
    });

    it('descarta una sesión caducada en localStorage', () => {
      const session = makeSession(Date.now() - 1000);
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ token: session.token, expiresAt: session.expiresAt, user: session.user })
      );

      const s = store();
      expect(s.isAuthenticated()).toBeFalse();
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    });

    it('limpia localStorage si el contenido está corrupto', () => {
      localStorage.setItem(STORAGE_KEY, '{not-json');

      const s = store();
      expect(s.isAuthenticated()).toBeFalse();
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    });
  });

  describe('login', () => {
    it('guarda la sesión en signals y localStorage', () => {
      const session = makeSession();
      authService.login.and.returnValue(of(session));

      const s = store();
      let result: AuthUser | undefined;
      s.login({ email: 'user@test.com', password: 'secret' }).subscribe((u) => (result = u));

      expect(authService.login).toHaveBeenCalled();
      expect(s.token()).toBe('test-token');
      expect(s.isAuthenticated()).toBeTrue();
      expect(result?.email).toBe('user@test.com');

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
      expect(stored?.token).toBe('test-token');
      expect(stored?.user?.email).toBe('user@test.com');
    });

    it('setSession con una sesión caducada limpia todo', () => {
      const s = store();
      s.setSession(makeSession(Date.now() - 1000));

      expect(s.token()).toBeNull();
      expect(s.user()).toBeNull();
      expect(s.isAuthenticated()).toBeFalse();
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    });
  });

  describe('refreshMe', () => {
    it('actualiza el usuario y re-persiste en localStorage', () => {
      const s = store();
      s.setSession(makeSession());

      const updated: AuthUser = { ...makeUser(), name: 'Nombre Actualizado' };
      authService.me.and.returnValue(of(updated));
      s.refreshMe().subscribe();

      expect(s.user()?.name).toBe('Nombre Actualizado');
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
      expect(stored?.user?.name).toBe('Nombre Actualizado');
    });
  });

  describe('logout', () => {
    it('con token llama al backend y limpia la sesión', () => {
      authService.logout.and.returnValue(of(undefined));

      const s = store();
      s.setSession(makeSession());
      s.logout().subscribe();

      expect(authService.logout).toHaveBeenCalled();
      expect(s.token()).toBeNull();
      expect(s.isAuthenticated()).toBeFalse();
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    });

    it('sin token limpia sin llamar al backend', () => {
      const s = store();
      s.logout().subscribe();

      expect(authService.logout).not.toHaveBeenCalled();
      expect(s.token()).toBeNull();
    });
  });

  describe('isAuthenticated', () => {
    it('exige token y expiración futura', () => {
      const s = store();
      expect(s.isAuthenticated()).toBeFalse();

      s.setSession(makeSession());
      expect(s.isAuthenticated()).toBeTrue();

      s.clear();
      expect(s.isAuthenticated()).toBeFalse();
    });
  });

  describe('expiración por timer', () => {
    it('expira la sesión al llegar expiresAt y marca sessionExpired', fakeAsync(() => {
      const s = store();
      s.setSession(makeSession(Date.now() + 1000));
      expect(s.isAuthenticated()).toBeTrue();
      expect(s.sessionExpired()).toBeFalse();

      tick(1000);

      expect(s.isAuthenticated()).toBeFalse();
      expect(s.sessionExpired()).toBeTrue();
      expect(s.token()).toBeNull();
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    }));
  });

  describe('roles', () => {
    it('expone el rol como array isAdmin detecta ADMIN', () => {
      const s = store();
      s.setSession(makeSession());
      expect(s.roles()).toEqual(['USER']);
      expect(s.isAdmin()).toBeFalse();

      s.setSession({ ...makeSession(), user: makeUser('ADMIN') });
      expect(s.roles()).toEqual(['ADMIN']);
      expect(s.isAdmin()).toBeTrue();

      s.clear();
      expect(s.roles()).toEqual([]);
      expect(s.isAdmin()).toBeFalse();
    });
  });
});
