import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  CanActivateFn,
  Router,
  RouterStateSnapshot,
  provideRouter
} from '@angular/router';
import { adminGuard } from './admin.guard';
import { AuthStore } from '../stores/auth.store';

type GuardResult = ReturnType<CanActivateFn>;

describe('adminGuard', () => {
  let auth: jasmine.SpyObj<AuthStore>;
  let router: Router;

  function run(url: string): GuardResult {
    return TestBed.runInInjectionContext(() =>
      adminGuard({} as ActivatedRouteSnapshot, { url } as RouterStateSnapshot)
    );
  }

  beforeEach(() => {
    auth = jasmine.createSpyObj('AuthStore', ['isAuthenticated', 'isAdmin']);
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AuthStore, useValue: auth }]
    });
    router = TestBed.inject(Router);
  });

  it('redirige al login con returnUrl sin sesión', () => {
    auth.isAuthenticated.and.returnValue(false);

    const result = run('/events/create');
    expect(result).toEqual(
      router.createUrlTree(['/auth/login'], { queryParams: { returnUrl: '/events/create' } })
    );
  });

  it('redirige a events cuando el rol no es ADMIN', () => {
    auth.isAuthenticated.and.returnValue(true);
    auth.isAdmin.and.returnValue(false);

    expect(run('/events/trash')).toEqual(router.createUrlTree(['/events']));
  });

  it('permite el acceso a un ADMIN autenticado', () => {
    auth.isAuthenticated.and.returnValue(true);
    auth.isAdmin.and.returnValue(true);

    expect(run('/events/create')).toBeTrue();
  });
});
