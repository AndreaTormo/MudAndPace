import { Routes } from '@angular/router';
import { adminGuard } from '../../core/guards/admin.guard';

export const EVENTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/event-list/event-list').then((m) => m.EventList)
  },
  {
    path: 'trash',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./pages/event-trash/event-trash').then((m) => m.EventTrash)
  },
  {
    path: 'create',
    loadComponent: () =>
      import('./pages/event-create/event-create').then((m) => m.EventCreate)
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./pages/event-edit/event-edit').then((m) => m.EventEdit)
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./pages/event-detail/event-detail').then((m) => m.EventDetail)
  }
];
