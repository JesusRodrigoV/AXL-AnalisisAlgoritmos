import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () => import('./pages/home/home.component'),
  },
  {
    path: 'editor',
    loadComponent: () => import('./pages/editor/editor.component'),
  },
  {
    path: 'johnson',
    loadComponent: () => import('./pages/johnson/johnson.component'),
  },
  {
    path: 'asignacion',
    loadComponent: () => import('./pages/asignacion/asignacion.component'),
  },
  {
    path: 'sorts',
    loadComponent: () =>
      import('./pages/sorts/sorts.component').then((m) => m.SortsComponent),
  },
  {
    path: '',
    redirectTo: '/home',
    pathMatch: 'full',
  },
];
