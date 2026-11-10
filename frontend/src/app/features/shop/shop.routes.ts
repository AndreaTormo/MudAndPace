import { Routes } from '@angular/router';

export const SHOP_ROUTES: Routes = [
  {
    path: 'experiences',
    loadComponent: () =>
      import('./pages/shop-list/shop-list').then((m) => m.ShopList)
  },
  {
    path: 'experiences/:slug',
    loadComponent: () =>
      import('./pages/shop-detail/shop-detail').then((m) => m.ShopDetail)
  },
  {
    path: 'events',
    redirectTo: 'experiences',
    pathMatch: 'full'
  },
  {
    path: 'events/:slug',
    redirectTo: 'experiences/:slug'
  },
  {
    path: '',
    loadComponent: () =>
      import('./pages/shop-home/shop-home').then((m) => m.ShopHome)
  }
];
