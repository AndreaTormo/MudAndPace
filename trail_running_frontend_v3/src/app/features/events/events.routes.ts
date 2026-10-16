import { Routes } from '@angular/router';

export const EVENTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/event-list/event-list').then((m) => m.EventList)
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
