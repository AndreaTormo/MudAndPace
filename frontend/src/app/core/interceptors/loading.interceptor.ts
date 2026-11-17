import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';
import { LoadingService } from '../services/loading.service';

function isSilentLoadingUrl(url: string): boolean {
  return url.includes('/agent/weather');
}

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  if (isSilentLoadingUrl(req.url)) {
    return next(req);
  }

  const loadingService = inject(LoadingService);
  loadingService.show();
  return next(req).pipe(finalize(() => loadingService.hide()));
};
