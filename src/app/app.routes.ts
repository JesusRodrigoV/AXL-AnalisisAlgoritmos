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
    children: [
      {
        path: 'selection',
        loadComponent: () =>
          import(
            './pages/sorts/components/selection-sort/selection-sort.component'
          ).then((m) => m.SelectionSortComponent),
      },
      {
        path: 'insertion',
        loadComponent: () =>
          import(
            './pages/sorts/components/insertion-sort/insertion-sort.component'
          ).then((m) => m.InsertionSortComponent),
      },
      {
        path: 'shell',
        loadComponent: () =>
          import(
            './pages/sorts/components/shell-sort/shell-sort.component'
          ).then((m) => m.ShellSortComponent),
      },
      {
        path: 'merge',
        loadComponent: () =>
          import(
            './pages/sorts/components/merge-sort/merge-sort.component'
          ).then((m) => m.MergeSortComponent),
      },
      {
        path: '',
        loadComponent: () =>
          import('./pages/sorts/sorts.component').then((m) => m.SortsComponent),
      },
    ],
  },
  {
    path: '',
    redirectTo: '/home',
    pathMatch: 'full',
  },
];
