import { Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-navbar',
  imports: [
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    RouterLink,
    MatTooltipModule,
    MatMenuModule,
  ],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavbarComponent {
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
  ];
  private router: Router = inject(Router);
  private location: Location = inject(Location);

  isRouteActive(path: string): boolean {
    return this.location.path() === path;
  }
}
