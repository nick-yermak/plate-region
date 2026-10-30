import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  {
    path: '',
    loadComponent: () => import('./home/home-page').then((m) => m.HomePage),
  },
  {
    path: 'plate/:plate',
    loadComponent: () => import('./plate/plate-page').then((m) => m.PlatePage),
  },
  {
    path: 'voivodeship/:slug',
    loadComponent: () =>
      import('./voivodeship/voivodeship-page').then((m) => m.VoivodeshipPage),
  },
  {
    path: 'registry',
    loadComponent: () =>
      import('./registry/registry-page').then((m) => m.RegistryPage),
  },
  {
    path: 'charts',
    loadComponent: () =>
      import('./charts/charts-page').then((m) => m.ChartsPage),
  },
  {
    path: 'about',
    loadComponent: () => import('./about/about-page').then((m) => m.AboutPage),
  },
  { path: '**', redirectTo: '' },
];
