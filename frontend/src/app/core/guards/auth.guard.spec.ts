import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  CanActivateFn,
  Router,
  RouterStateSnapshot,
  provideRouter
} from '@angular/router';
import { authGuard, guestGuard } from './auth.guard';
import { AuthStore } from '../stores/auth.store';

type GuardResult = ReturnType<CanActivateFn>;

describe('authGuard', () => {
  let auth: jasmine.SpyObj<AuthStore>;
  let router: Router;

  function run(url: string): GuardResult {
    return TestBed.runInInjectionContext(() =>
      authGuard({} as ActivatedRouteSnapshot, { url } as RouterStateSnapshot)
    );
  }

  beforeEach(() => {
    auth = jasmine.createSpyObj('AuthStore', ['isAuthenticated']);
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AuthStore, useValue: auth }]
    });
    router = TestBed.inject(Router);
  });

  it('permite el acceso con sesión válida', () => {
    auth.isAuthenticated.and.returnValue(true);
    expect(run('/events')).toBeTrue();
  });

  it('redirige al login con returnUrl cuando no hay sesión', () => {
    auth.isAuthenticated.and.returnValue(false);
    const result = run('/events/create');

    expect(result).toEqual(
      router.createUrlTree(['/auth/login'], { queryParams: { returnUrl: '/events/create' } })
    );
  });
});

describe('guestGuard', () => {
  let auth: jasmine.SpyObj<AuthStore>;
  let router: Router;

  function run(): GuardResult {
    return TestBed.runInInjectionContext(() =>
      guestGuard({} as ActivatedRouteSnapshot, { url: '/auth/login' } as RouterStateSnapshot)
    );
  }

  beforeEach(() => {
    auth = jasmine.createSpyObj('AuthStore', ['isAuthenticated']);
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AuthStore, useValue: auth }]
    });
    router = TestBed.inject(Router);
  });

  it('permite el acceso a invitados', () => {
    auth.isAuthenticated.and.returnValue(false);
    expect(run()).toBeTrue();
  });

  it('redirige a events a un usuario autenticado', () => {
    auth.isAuthenticated.and.returnValue(true);
    expect(run()).toEqual(router.createUrlTree(['/events']));
  });
});
