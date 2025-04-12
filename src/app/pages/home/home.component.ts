import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { BenefitComponent } from './benefit';
import { FeatureComponent } from './feature';
import { FooterComponent } from '@app/src/footer';

export interface RouteCard {
  icon: string;
  title: string;
  description: string;
  route: string;
  buttonText: string;
}

export interface Benefits {
  icon: string;
  title: string;
  description: string;
}

@Component({
  selector: 'app-home',
  imports: [
    MatCardModule,
    MatButtonModule,
    BenefitComponent,
    FeatureComponent,
    FooterComponent,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class HomeComponent {
  protected rutas: RouteCard[] = [
    {
      icon: 'bx-edit-alt',
      title: 'Editor de Grafos',
      description:
        'Crea y edita grafos de manera intuitiva con nuestro editor visual interactivo.',
      route: '/editor',
      buttonText: 'COMENZAR',
    },
    {
      icon: 'bx-git-repo-forked',
      title: 'Algoritmo de Johnson',
      description:
        'Encuentra todos los caminos más cortos entre todos los pares de vértices en grafos dispersos.',
      route: '/johnson',
      buttonText: 'EXPLORAR',
    },
    {
      icon: 'bx-task',
      title: 'Algoritmo de Asignación',
      description:
        'Optimiza la asignación de recursos con nuestro algoritmo de asignación eficiente.',
      route: '/asignacion',
      buttonText: 'COMENZAR',
    },
    {
      icon: 'bx-compass',
      title: 'Algoritmo Esquina Noroeste',
      description:
        'Resuelve problemas de transporte utilizando el método de la esquina noroeste.',
      route: '/northwest',
      buttonText: 'COMENZAR',
    },
    {
      icon: 'bx-sort',
      title: 'Algoritmos de Ordenamiento',
      description:
        'Visualiza y comprende diferentes algoritmos de ordenamiento y su rendimiento.',
      route: '/sorts/selection',
      buttonText: 'COMENZAR',
    },
  ];

  protected beneficios: Benefits[] = [
    {
      icon: 'bx-show',
      title: 'Visualización Clara',
      description:
        'Interfaz intuitiva para la creación y manipulación de grafos',
    },
    {
      icon: 'bx-fast-forward',
      title: 'Rendimiento Optimizado',
      description: 'Implementaciones eficientes de algoritmos complejos',
    },
    {
      icon: 'bx-book',
      title: 'Herramienta Educativa',
      description:
        'Perfecta para aprender y enseñar conceptos de teoría de grafos',
    },
    {
      icon: 'bx-chart',
      title: 'Análisis Detallado',
      description: 'Resultados paso a paso y métricas detalladas',
    },
  ];
}
