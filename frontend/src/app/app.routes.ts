import { Routes } from '@angular/router';
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
      { path: '', redirectTo: 'events', pathMatch: 'full' },
      {
        path: 'profile',
        loadComponent: () =>
          import('./features/profile/profile').then((m) => m.ProfilePage)
      },
      {
        path: 'events',
        loadChildren: () =>
          import('./features/events/events.routes').then((m) => m.EVENTS_ROUTES)
      }
    ]
  },
  { path: '**', redirectTo: 'events' }
];
