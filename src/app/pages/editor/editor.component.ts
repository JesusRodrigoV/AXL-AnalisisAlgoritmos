import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HelpContent } from '@app/models/Help.model';
import { HelpButtonComponent } from '@app/src/help-button';
import { MyCanvasComponent } from '@app/src/my-canvas';

@Component({
  selector: 'app-editor',
  imports: [MyCanvasComponent, HelpButtonComponent],
  templateUrl: './editor.component.html',
  styleUrl: './editor.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class EditorComponent {
  helpContent: HelpContent = {
    title: 'Funcionalidades del Editor',
    description:
      'Guía de las principales funcionalidades disponibles en el editor de grafos.',

    steps: [
      {
        number: 1,
        title: 'Modo Conexión',
        description: 'Permite crear conexiones entre nodos del grafo:',
        image: 'assets/conexion.png',
      },
      {
        number: 2,
        title: 'Eliminar Elementos',
        description: 'Permite borrar nodos o conexiones del grafo:',
        image: 'assets/export.png',
      },
      {
        number: 3,
        title: 'Importar Grafo',
        description: 'Carga un grafo previamente guardado:',
        image: 'assets/import.png',
      },
      {
        number: 4,
        title: 'Limpiar Todo',
        description: 'Reinicia el editor eliminando todos los elementos:',
        image: 'assets/clean.png',
      },
    ],

    tips: [
      'Usa el modo conexión para crear relaciones entre nodos de manera visual',
      'Exporta tu trabajo regularmente para evitar pérdidas',
      'Puedes importar grafos previamente guardados para continuar trabajando',
      'El botón de limpiar es útil para comenzar un nuevo proyecto desde cero',
      'Confirma siempre antes de eliminar elementos importantes',
    ],

    images: [
      {
        url: 'assets/conexion.png',
        caption: 'Modo Conexión - Creación de relaciones entre nodos',
        alt: 'Demostración del modo conexión',
      },
      {
        url: 'assets/clean.png',
        caption: 'Función de Limpieza - Reinicio del editor',
        alt: 'Botón de limpiar editor',
      },
    ],
  };
}
