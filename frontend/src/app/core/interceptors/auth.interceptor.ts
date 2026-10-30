import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthStore } from '../stores/auth.store';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthStore);
  const router = inject(Router);
  const token = auth.token();
  const request = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      const isAuthEndpoint = req.url.includes('/api/v1/auth/');

      if (error.status === 401 && !isAuthEndpoint) {
        const hadToken = Boolean(auth.token());
        auth.clear();
        if (hadToken) {
          void router.navigate(['/auth/login'], {
            queryParams: { returnUrl: router.url }
          });
        }
      }

      return throwError(() => error);
    })
  );
};
