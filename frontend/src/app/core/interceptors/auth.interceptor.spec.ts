import { TestBed } from '@angular/core/testing';
import {
  HttpClient,
  HttpErrorResponse,
  provideHttpClient,
  withInterceptors
} from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { authInterceptor } from './auth.interceptor';
import { AuthStore } from '../stores/auth.store';

const EVENTS_URL = 'http://localhost:3000/api/v1/events';
const LOGIN_URL = 'http://localhost:3000/api/v1/auth/login';
const REGISTER_URL = 'http://localhost:3000/api/v1/users/register';
const LOGOUT_URL = 'http://localhost:3000/api/v1/auth/logout';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let auth: {
    token: jasmine.Spy;
    expiresAt: jasmine.Spy;
    clear: jasmine.Spy;
  };
  let router: { url: string; navigate: jasmine.Spy };

  beforeEach(() => {
    auth = {
      token: jasmine.createSpy('token'),
      expiresAt: jasmine.createSpy('expiresAt'),
      clear: jasmine.createSpy('clear')
    };
    router = {
      url: '/events',
      navigate: jasmine.createSpy('navigate').and.returnValue(Promise.resolve(true))
    };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthStore, useValue: auth },
        { provide: Router, useValue: router }
      ]
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('cabecera Authorization', () => {
    it('adjunta el Bearer cuando hay token válido', () => {
      auth.token.and.returnValue('abc123');
      auth.expiresAt.and.returnValue(Date.now() + 60_000);

      http.get(EVENTS_URL).subscribe();

      const req = httpMock.expectOne(EVENTS_URL);
      expect(req.request.headers.get('Authorization')).toBe('Bearer abc123');
      req.flush({ data: [] });
    });

    it('no adjunta Authorization sin token', () => {
      auth.token.and.returnValue(null);
      auth.expiresAt.and.returnValue(null);

      http.get(EVENTS_URL).subscribe();

      const req = httpMock.expectOne(EVENTS_URL);
      expect(req.request.headers.get('Authorization')).toBeNull();
      req.flush({ data: [] });
    });

    it('no adjunta Authorization en endpoints públicos de auth', () => {
      auth.token.and.returnValue('abc123');
      auth.expiresAt.and.returnValue(Date.now() + 60_000);

      http.post(LOGIN_URL, { email: 'a@b.c', password: 'x' }).subscribe();

      const req = httpMock.expectOne(LOGIN_URL);
      expect(req.request.headers.get('Authorization')).toBeNull();
      req.flush({ data: {} });
    });
  });

  describe('token caducado (expiración proactiva)', () => {
    it('aborta la petición sin enviarla, limpia y redirige al login', () => {
      auth.token.and.returnValue('abc123');
      auth.expiresAt.and.returnValue(Date.now() - 1000);

      let captured: HttpErrorResponse | undefined;
      http.get(EVENTS_URL).subscribe({ error: (e) => (captured = e) });

      httpMock.expectNone(EVENTS_URL);
      expect(captured?.status).toBe(401);
      expect(auth.clear).toHaveBeenCalled();
      expect(router.navigate).toHaveBeenCalledWith(['/auth/login'], {
        queryParams: { returnUrl: '/events' }
      });
    });

    it('no interrumpe las peticiones si expiresAt es null', () => {
      auth.token.and.returnValue('abc123');
      auth.expiresAt.and.returnValue(null);

      http.get(EVENTS_URL).subscribe();

      const req = httpMock.expectOne(EVENTS_URL);
      expect(req.request.headers.get('Authorization')).toBe('Bearer abc123');
      req.flush({ data: [] });
    });
  });

  describe('401 del servidor', () => {
    function flush401(url: string, method: 'get' | 'post' = 'get'): HttpErrorResponse {
      let captured: HttpErrorResponse | undefined;
      if (method === 'get') {
        http.get(url).subscribe({ error: (e) => (captured = e) });
      } else {
        http.post(url, {}).subscribe({ error: (e) => (captured = e) });
      }

      const req = httpMock.expectOne(url);
      req.flush({ error: { code: 'UNAUTHORIZED', message: 'Token inválido' } }, {
        status: 401,
        statusText: 'Unauthorized'
      });
      return captured as HttpErrorResponse;
    }

    it('en un recurso protegido limpia la sesión y redirige con returnUrl', () => {
      auth.token.and.returnValue('abc123');
      auth.expiresAt.and.returnValue(Date.now() + 60_000);

      const captured = flush401(EVENTS_URL);

      expect(captured.status).toBe(401);
      expect(auth.clear).toHaveBeenCalled();
      expect(router.navigate).toHaveBeenCalledWith(['/auth/login'], {
        queryParams: { returnUrl: '/events' }
      });
    });

    it('en login no limpia ni redirige (credenciales incorrectas)', () => {
      auth.token.and.returnValue(null);
      auth.expiresAt.and.returnValue(null);

      const captured = flush401(LOGIN_URL, 'post');

      expect(captured.status).toBe(401);
      expect(auth.clear).not.toHaveBeenCalled();
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('en registro no limpia ni redirige', () => {
      auth.token.and.returnValue(null);
      auth.expiresAt.and.returnValue(null);

      const captured = flush401(REGISTER_URL, 'post');

      expect(captured.status).toBe(401);
      expect(auth.clear).not.toHaveBeenCalled();
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('en logout solo limpia, sin redirigir (ya navega el caller)', () => {
      auth.token.and.returnValue('abc123');
      auth.expiresAt.and.returnValue(Date.now() + 60_000);

      const captured = flush401(LOGOUT_URL, 'post');

      expect(captured.status).toBe(401);
      expect(auth.clear).toHaveBeenCalled();
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('no redirige si ya se está en /auth (evita bucles)', () => {
      router.url = '/auth/login';
      auth.token.and.returnValue('abc123');
      auth.expiresAt.and.returnValue(Date.now() + 60_000);

      flush401(EVENTS_URL);

      expect(auth.clear).toHaveBeenCalled();
      expect(router.navigate).not.toHaveBeenCalled();
    });
  });

  describe('otros códigos', () => {
    it('un 403 no limpia ni redirige (lo gestiona errorInterceptor)', () => {
      auth.token.and.returnValue('abc123');
      auth.expiresAt.and.returnValue(Date.now() + 60_000);

      let captured: HttpErrorResponse | undefined;
      http.get(EVENTS_URL).subscribe({ error: (e) => (captured = e) });

      const req = httpMock.expectOne(EVENTS_URL);
      req.flush({ error: { code: 'FORBIDDEN', message: 'Denegado' } }, {
        status: 403,
        statusText: 'Forbidden'
      });

      expect(captured?.status).toBe(403);
      expect(auth.clear).not.toHaveBeenCalled();
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('propaga un 500 con body inválido sin tocar la sesión', () => {
      auth.token.and.returnValue('abc123');
      auth.expiresAt.and.returnValue(Date.now() + 60_000);

      let captured: unknown;
      http.get(EVENTS_URL).subscribe({ error: (e) => (captured = e) });

      const req = httpMock.expectOne(EVENTS_URL);
      req.flush('<html>error</html>', { status: 500, statusText: 'Server Error' });

      expect((captured as HttpErrorResponse).status).toBe(500);
      expect(auth.clear).not.toHaveBeenCalled();
      expect(router.navigate).not.toHaveBeenCalled();
    });
  });
});
