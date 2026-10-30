import { Routes } from '@angular/router';
import { guestGuard } from '../../core/guards/auth.guard';
import { AuthLayout } from './auth-layout';

export const AUTH_ROUTES: Routes = [
  {
    path: '',
    component: AuthLayout,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'login' },
      {
        path: 'login',
        canActivate: [guestGuard],
        loadComponent: () => import('./pages/login/login').then((m) => m.LoginPage)
      },
      {
        path: 'register',
        canActivate: [guestGuard],
        loadComponent: () => import('./pages/register/register').then((m) => m.RegisterPage)
      }
    ]
  }
];
