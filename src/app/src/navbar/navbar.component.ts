import { Location, NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router, RouterLink } from '@angular/router';
import { ThemeService } from '@app/services/theme/theme-service';

@Component({
  selector: 'app-navbar',
  imports: [
    MatToolbarModule,
    MatButtonModule,
    RouterLink,
    MatTooltipModule,
    MatMenuModule,
    NgClass,
  ],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavbarComponent {
  readonly themeService: ThemeService = inject(ThemeService);

  protected rutas = [
    {
      label: 'Home',
      path: '/home',
      icon: 'bxs-home',
      description: 'Página principal',
    },
    {
      label: 'Proyecto',
      path: '/proyecto',
      icon: 'bx-book',
      description: 'Información del proyecto',
    },
    {
      label: 'Editor Simple',
      path: '/editor',
      icon: 'bxs-edit',
      description: 'Editor básico de grafos',
    },
    {
      label: 'Johnson',
      path: '/johnson',
      icon: 'bx-git-branch',
      description: 'Algoritmo de Johnson para encontrar caminos más cortos',
    },
    {
      label: 'Asignación',
      path: '/asignacion',
      icon: 'bx-task',
      description: 'Algoritmo de asignación para optimización',
    },
    {
      label: 'Nor Oeste',
      path: '/northwest',
      icon: 'bx-compass',
      description: 'Algoritmo Nor Oeste para optimización',
    },
    {
      label: 'Sorts',
      path: '/sorts',
      icon: 'bx-sort-alt-2',
      description: 'Algoritmos de ordenamiento',
    },
    {
      label: 'Árboles',
      path: '/arboles',
      icon: 'bx bxs-tree',
      description: 'Simulador de árboles binarios',
    },
    {
      label: 'Kruskal',
      path: '/kruskal',
      icon: 'bx-network-chart',
      description: 'Algoritmo de Kruskal para árbol de expansión mínima',
    },
    {
      label: 'Dijkstra',
      path: '/dijkstra',
      icon: 'bx-git-pull-request',
      description: 'Algoritmo de Dijkstra para encontrar el camino más corto',
    },
  ];
  private location: Location = inject(Location);

  isRouteActive(path: string): boolean {
    return this.location.path() === path;
  }
}
