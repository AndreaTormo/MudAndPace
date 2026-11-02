import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthStore } from '../stores/auth.store';

function isPublicAuthUrl(url: string): boolean {
  return url.includes('/auth/login') || url.includes('/users/register');
}

function isLogoutUrl(url: string): boolean {
  return url.includes('/auth/logout');
}

function redirectToLogin(router: Router): void {
  if (router.url.startsWith('/auth')) return;
  void router.navigate(['/auth/login'], {
    queryParams: { returnUrl: router.url }
  });
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthStore);
  const router = inject(Router);

  const isPublicAuth = isPublicAuthUrl(req.url);
  const isLogout = isLogoutUrl(req.url);

  if (!isPublicAuth && !isLogout) {
    const expiresAt = auth.expiresAt();
    if (auth.token() && expiresAt !== null && expiresAt <= Date.now()) {
      auth.clear();
      redirectToLogin(router);
      return throwError(() => new HttpErrorResponse({ status: 401, url: req.url }));
    }
  }

  const token = isPublicAuth ? null : auth.token();
  const request = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        if (isPublicAuth) {
          // Credenciales incorrectas: no invalida la sesión ni redirige.
        } else if (isLogout) {
          // Sesión ya inválida: solo se limpia; el caller navega al login.
          auth.clear();
        } else {
          auth.clear();
          redirectToLogin(router);
        }
      }

      return throwError(() => error);
    })
  );
};
