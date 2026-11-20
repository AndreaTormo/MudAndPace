import { HttpContextToken, HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthStore } from '../stores/auth.store';

const RETRY_AFTER_REFRESH = new HttpContextToken<boolean>(() => false);

function isPublicAuthUrl(url: string): boolean {
  return (
    url.includes('/auth/login') ||
    url.includes('/users/register') ||
    url.includes('/agent/chat') ||
    url.includes('/agent/weather') ||
    url.includes('/agent/activities')
  );
}

function isLogoutUrl(url: string): boolean {
  return url.includes('/auth/logout');
}

function isRefreshUrl(url: string): boolean {
  return url.includes('/auth/refresh');
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
  const isRefresh = isRefreshUrl(req.url);
  const alreadyRetried = req.context.get(RETRY_AFTER_REFRESH);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status !== 401) {
        return throwError(() => error);
      }

      if (isLogout) {
        auth.clear();
        return throwError(() => error);
      }

      if (isPublicAuth || isRefresh || alreadyRetried) {
        return throwError(() => error);
      }

      return auth.refreshSession().pipe(
        switchMap(() =>
          next(req.clone({ context: req.context.set(RETRY_AFTER_REFRESH, true) }))
        ),
        catchError(() => {
          auth.clear();
          redirectToLogin(router);
          return throwError(() => error);
        })
      );
    })
  );
};
