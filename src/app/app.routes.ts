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
    path: 'northwest',
    loadComponent: () => import('./pages/northwest/northwest.component'),
  },
  {
    path: 'sorts',
    loadComponent: () => import('./pages/sorts/sorts.component'),
  },
  {
    path: 'arboles',
    loadComponent: () => import('./pages/arboles/arboles.component'),
  },
  {
    path: 'dijkstra',
    loadComponent: () =>
      import('./pages/Dijsktra/dijkstra.component').then((m) => m.default),
  },
  {
    path: 'proyecto',
    loadComponent: () => import('./pages/proyecto/proyecto.component'),
  },
  {
    path: 'kruskal',
    loadComponent: () => import('./pages/kruskal/kruskal.component'),
  },
  {
    path: 'fuzzy',
    loadComponent: () => import('./pages/fuzzy/fuzzy.component'),
  },
  {
    path: 'laplace',
    loadComponent: () => import('./pages/laplace/laplace.component'),
  },
  {
    path: '',
    redirectTo: '/home',
    pathMatch: 'full',
  },
];
