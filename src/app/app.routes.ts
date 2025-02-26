import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home';
import { EditorComponent } from './pages/editor';
import { AsignacionComponent } from './pages/asignacion';
import { JohnsonComponent } from './pages/johnson';

export const routes: Routes = [
  {
    path: 'home',
    component: HomeComponent,
  },
  {
    path: 'editor',
    component: EditorComponent,
  },
  {
    path: 'johnson',
    component: JohnsonComponent,
  },
  {
    path: 'asignacion',
    component: AsignacionComponent,
  },
  {
    path: '',
    redirectTo: '/home',
    pathMatch: 'full',
  },
];
