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
      icon: 'bx-sort-alt-2',
      description: 'Algoritmos de ordenamiento',
      submenu: [
        {
          label: 'Bubble Sort',
          path: '/sorts/bubble',
          icon: 'bx-sort',
          description: 'Ordenamiento de burbuja',
        },
        {
          label: 'Insertion Sort',
          path: '/sorts/insertion',
          icon: 'bx-sort',
          description: 'Ordenamiento por inserción',
        },
        {
          label: 'Merge Sort',
          path: '/sorts/merge',
          icon: 'bx-sort',
          description: 'Ordenamiento por mezcla',
        },
        {
          label: 'Selection Sort',
          path: '/sorts/selection',
          icon: 'bx-sort',
          description: 'Ordenamiento por selección',
        },
        {
          label: 'Shell Sort',
          path: '/sorts/shell',
          icon: 'bx-sort',
          description: 'Ordenamiento Shell',
        },
      ],
    },
  ];
  private router: Router = inject(Router);
  private location: Location = inject(Location);

  isRouteActive(path: string): boolean {
    return this.location.path() === path;
  }
}
