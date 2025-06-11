import { Location, NgClass } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router, RouterLink } from '@angular/router';
import { ThemeService } from '@app/services/theme/theme-service';

interface Ruta {
  label: string;
  path: string;
  icon: string;
  description: string;
  external?: boolean;
  endpoint?: string;
}

@Component({
  selector: 'app-navbar',
  imports: [
    MatToolbarModule,
    MatButtonModule,
    RouterLink,
    MatTooltipModule,
    MatMenuModule,
    NgClass
  ],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NavbarComponent {
  readonly themeService: ThemeService = inject(ThemeService);
  private router: Router = inject(Router);
  private location: Location = inject(Location);
  private http = inject(HttpClient);

  protected rutas: Ruta[] = [
    {
      label: 'Home',
      path: '/home',
      icon: 'bxs-home',
      description: 'Página principal'
    },
    {
      label: 'Editor Simple',
      path: '/editor',
      icon: 'bxs-edit',
      description: 'Editor básico de grafos'
    },
    {
      label: 'Johnson',
      path: '/johnson',
      icon: 'bx-git-branch',
      description: 'Algoritmo de Johnson para encontrar caminos más cortos'
    },
    {
      label: 'Asignación',
      path: '/asignacion',
      icon: 'bx-task',
      description: 'Algoritmo de asignación para optimización'
    },
    {
      label: 'Nor Oeste',
      path: '/northwest',
      icon: 'bx-compass',
      description: 'Algoritmo Nor Oeste para optimización'
    },
    {
      label: 'Sorts',
      path: '/sorts',
      icon: 'bx-sort-alt-2',
      description: 'Algoritmos de ordenamiento'
    },
    {
      label: 'Árboles',
      path: '/arboles',
      icon: 'bx bxs-tree',
      description: 'Simulador de árboles binarios'
    },
    {
      label: 'Kruskal',
      path: '/kruskal',
      icon: 'bx-network-chart',
      description: 'Algoritmo de Kruskal para árbol de expansión mínima'
    },
    {
      label: 'Dijkstra',
      path: '/dijkstra',
      icon: 'bx bx-network-chart',
      description: 'Algoritmo de Dijkstra para encontrar el camino más corto'
    },
    {
      label: 'Fuzzy',
      path: '/fuzzy',
      icon: 'bx bx-cloud',
      description: 'Lógica difusa para sistemas de control',
      external: true,
      endpoint: 'http://localhost:3000/open-fuzzy'
    },
    {
      label: 'Laplace',
      path: '/laplace',
      icon: 'bx bx-calculator',
      description: 'Transformada de Laplace',
      external: true,
      endpoint: 'http://localhost:3000/open-laplace'
    }
  ];

  navigateTo(ruta: Ruta): void {
    if (ruta.external && ruta.endpoint) {
      this.http.get(ruta.endpoint).subscribe({
        next: () => console.log(`Abriendo MATLAB para ${ruta.label}`),
        error: (err: any) => console.error(`Error al abrir MATLAB: ${err.message}`)
      });
    } else {
      this.router.navigate([ruta.path]);
    }
  }

  isRouteActive(path: string): boolean {
    return this.location.path() === path;
  }
}