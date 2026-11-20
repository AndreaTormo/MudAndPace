import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthStore } from '../stores/auth.store';

export const adminGuard: CanActivateFn = async (_route, state) => {
  const auth = inject(AuthStore);
  const router = inject(Router);

  const loginTree = () =>
    router.createUrlTree(['/auth/login'], {
      queryParams: { returnUrl: state.url }
    });

  if (!auth.isAuthenticated()) {
    return loginTree();
  }

  if (!auth.user() || auth.canManage() === null) {
    try {
      await firstValueFrom(auth.refreshMe());
    } catch {
      return loginTree();
    }
  }

  return auth.isAdmin() ? true : router.createUrlTree(['/events']);
};
