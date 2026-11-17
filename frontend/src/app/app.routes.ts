import { Routes } from '@angular/router';
import { adminGuard } from './core/guards/admin.guard';
import { authGuard } from './core/guards/auth.guard';
import { MainLayout } from './layouts/main-layout/main-layout';

export const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () =>
      import('./features/auth/auth.routes').then((m) => m.AUTH_ROUTES)
  },
  {
    path: '',
    component: MainLayout,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'shop', pathMatch: 'full' },
      {
        path: 'profile',
        loadComponent: () =>
          import('./features/profile/profile').then((m) => m.ProfilePage)
      },
      {
        path: 'admin/profiles',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./features/admin/pages/admin-profiles/admin-profiles').then(
            (m) => m.AdminProfilesPage
          )
      },
      {
        path: 'events',
        loadChildren: () =>
          import('./features/events/events.routes').then((m) => m.EVENTS_ROUTES)
      },
      {
        path: 'shop',
        loadChildren: () =>
          import('./features/shop/shop.routes').then((m) => m.SHOP_ROUTES)
      }
    ]
  },
  { path: '**', redirectTo: 'events' }
];
