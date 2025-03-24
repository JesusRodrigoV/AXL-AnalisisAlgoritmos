import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HelpContent } from '@app/models/Help.model';
import { HelpButtonComponent } from '@app/src/help-button';
import { JohnsonCanvasComponent } from 'src/app/pages/johnson/components/johnson-canvas';

@Component({
  selector: 'app-johnson',
  imports: [JohnsonCanvasComponent, HelpButtonComponent],
  templateUrl: './johnson.component.html',
  styleUrl: './johnson.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class JohnsonComponent {
  helpContent: HelpContent = {
    title: 'Ayuda - Algoritmo de Johnson',
    description:
      'Herramienta para resolver problemas de secuenciación y ruta crítica usando el algoritmo de Johnson. Crea grafos, calcula tiempos y visualiza el camino crítico.',

    steps: [
      {
        number: 1,
        title: 'Agregar Actividades',
        description:
          'Usa el botón "Agregar Actividad" para crear nuevas filas. Completa los campos:',
        image: 'assets/help/agregar-actividad.png',
      },
      {
        number: 2,
        title: 'Configurar Relaciones',
        description:
          'En la columna "Nodo j", indica la relación entre nodos (Ej: A->B). Evita ciclos y auto-referencias.',
        image: 'assets/help/relaciones-nodos.png',
      },
      {
        number: 3,
        title: 'Establecer Pesos',
        description:
          'Ingresa valores numéricos positivos en la columna "Peso" para los tiempos de cada actividad.',
        image: 'assets/help/establecer-pesos.png',
      },
      {
        number: 4,
        title: 'Generar Grafo',
        description:
          'Haz clic en "Generar Grafo" para visualizar las relaciones. Asegúrate que todos los campos sean válidos.',
        image: 'assets/help/generar-grafo.png',
      },
      {
        number: 5,
        title: 'Manipular Vista',
        description:
          'Usa los controles de zoom (+/-) y arrastra el canvas para navegar por grafos grandes.',
        image: 'assets/help/controles-vista.png',
      },
      {
        number: 6,
        title: 'Error: Auto-referencia',
        description:
          'Si el boton de generar grafo está deshabilitado, revisa posibles errores de auto referencia.',
        image: 'assets/help/error-auto-referencia.png',
      },
      {
        number: 7,
        title: 'Interpretar Holguras',
        description:
          'Las holguras indican el margen disponible para esa actividad sin afectar la ruta crítica.',
        image: 'assets/help/holguras-explicacion.png',
      },
    ],

    images: [
      {
        url: 'assets/help/ejemplo-grafo-completo.png',
        caption: 'Ejemplo de grafo válido',
        alt: 'Grafo con nodos y conexiones',
      },
    ],

    tips: [
      'Los nombres de nodos deben ser únicos y no vacíos',
      'Exporta tu grafo regularmente para respaldar tu trabajo',
      'Mantén el grafo acíclico para resultados válidos',
    ],
    /*
    videos: [
      {
        url: 'https://youtu.be/z4x1OGfJkek?si=QDkYB8dihjTtO05n',
        title: 'Tutorial Completo',
        thumbnail: 'assets/help/video-thumbnail.jpg',
      },
    ],*/
  };
}
