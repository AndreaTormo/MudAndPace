import { Routes } from '@angular/router';
<<<<<<< HEAD
import { adminGuard } from '../../core/guards/admin.guard';
=======
>>>>>>> e6414492749754c86037fe5b22fe9940d3ddc0ce

export const EVENTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/event-list/event-list').then((m) => m.EventList)
  },
  {
<<<<<<< HEAD
    path: 'trash',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./pages/event-trash/event-trash').then((m) => m.EventTrash)
  },
  {
=======
>>>>>>> e6414492749754c86037fe5b22fe9940d3ddc0ce
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
