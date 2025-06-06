import {
  Component,
  ChangeDetectorRef,
  ViewChild,
  inject,
  ChangeDetectionStrategy,
} from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MyCanvasComponent } from '@app/src/my-canvas';
import { HelpButtonComponent } from '@app/src/help-button';
import { AssignmentSolverService } from '@app/services/assignment-solver';
import { HelpContent } from '@app/models/Help.model';
import { Conexion, Nodo } from '@app/models';
import { AsignacionMatrixComponent } from './asignacion-matrix';

@Component({
  selector: 'app-asignacion',
  imports: [
    CommonModule,
    MatButtonModule,
    MyCanvasComponent,
    MatListModule,
    FormsModule,
    MatButtonToggleModule,
    MatCardModule,
    HelpButtonComponent,
    AsignacionMatrixComponent,
  ],
  templateUrl: './asignacion.component.html',
  styleUrls: ['./asignacion.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class AsignacionComponent {
  private isProcessing = false;
  @ViewChild(MyCanvasComponent) canvas!: MyCanvasComponent;
  private assignmentSolver = inject(AssignmentSolverService);
  currentNodes: Nodo[] = [];
  currentConections: Conexion[] = [];

  readonly DEFAULT_NODE_COLOR = '#aa0';
  readonly HIGHLIGHT_RADIUS = 25;

  assignmentColors: string[] = [
    '#FF000085',
    '#00FF0085',
    '#0000FF85',
    '#FFA50085',
    '#80008085',
    '#00FFFF85',
    '#FF00FF85',
    '#FFD70085',
    '#4B008285',
    '#98FB9885',
  ];

  connectionColors: string[] = [
    '#FF0000',
    '#00FF00',
    '#0000FF',
    '#FFA500',
    '#800080',
    '#00FFFF',
    '#FF00FF',
    '#FFD700',
    '#4B0082',
    '#98FB98',
  ];

  result: { assignment: number[][]; cost: number } | null = null;
  isMaximization = false;
  matrixStats: { maxValue: number; minValue: number; average: number } | null =
    null;
  private originalRadii = new Map<number, number>();
  private snackBar = inject(MatSnackBar);

  constructor(private cdr: ChangeDetectorRef) {}

  solveAssignment(): void {
    try {
      if (this.isProcessing) {
        console.warn('Ya hay un proceso de resolución en curso');
        return;
      }
      this.isProcessing = true;

      setTimeout(() => {
        try {
          this.resetPreviousState();
          const { matrix, originNodes, destNodes } = this.prepareData();

          // Validación temprana
          if (!this.validateProblem(originNodes, destNodes, matrix)) {
            this.isProcessing = false;
            return;
          }

          console.time('hungarianAlgorithm');
          this.result = this.assignmentSolver.solve(
            matrix,
            this.isMaximization,
          );
          console.timeEnd('hungarianAlgorithm');

          // Actualizar UI en un nuevo ciclo
          requestAnimationFrame(() => {
            this.calculateMatrixStats(matrix);
            this.highlightSolution(originNodes, destNodes);

            // Forzar sincronización con el canvas
            if (this.canvas) {
              this.canvas.nodos = [...this.currentNodes];
              this.canvas.conexiones = [...this.currentConections];
              const ctx = this.canvas.canvas.nativeElement.getContext('2d');
              if (ctx) {
                this.canvas.dibujarNodo(ctx);
              }
            }

            this.cdr.detectChanges();
            this.isProcessing = false;
          });
        } catch (error) {
          this.isProcessing = false;
          this.handleError(error);
        }
      }, 0);
    } catch (error) {
      this.isProcessing = false;
      this.handleError(error);
    }
  }

  private prepareData() {
    if (!this.currentNodes || this.currentNodes.length === 0) {
      throw new Error('No hay nodos en el canvas');
    }

    if (!this.currentConections || this.currentConections.length === 0) {
      throw new Error('No hay conexiones definidas');
    }

    this.updateNodeTypes();

    const nodes = [...this.currentNodes];
    const connections = [...this.currentConections];

    const originNodes = nodes.filter((n) => n.esOrigen);
    const destNodes = nodes.filter((n) => !n.esOrigen);

    if (originNodes.length === 0) {
      throw new Error(
        'No se encontraron nodos origen. Asegúrate de crear conexiones desde los nodos que deberían ser origen.',
      );
    }

    if (originNodes.length !== destNodes.length) {
      throw new Error(
        `El número de nodos origen (${originNodes.length}) debe ser igual al número de nodos destino (${destNodes.length})`,
      );
    }

    const matrix = this.buildAdjacencyMatrix(originNodes, destNodes);

    return {
      matrix,
      originNodes,
      destNodes,
    };
  }

  private updateNodeTypes(): void {
    if (!this.currentNodes || !this.currentConections) {
      console.warn('No hay nodos o conexiones disponibles');
      return;
    }

    // Crear un Set de los IDs de nodos origen para mejor rendimiento
    const origenIds = new Set(
      this.currentConections.map((conexion) => conexion.desde),
    );

    // Actualizar el estado de todos los nodos
    this.currentNodes.forEach((node) => {
      const esOrigen = origenIds.has(node.contador);
      if (node.esOrigen !== esOrigen) {
        console.log(
          `Actualizando nodo ${node.contador}: esOrigen = ${esOrigen}`,
        );
        node.esOrigen = esOrigen;
      }
    });

    // Validación después de la actualización
    const origenes = this.currentNodes.filter((n) => n.esOrigen);
    const destinos = this.currentNodes.filter((n) => !n.esOrigen);
  }

  private buildAdjacencyMatrix(
    origins: Nodo[],
    destinations: Nodo[],
  ): number[][] {
    if (!this.currentConections || this.currentConections.length === 0) {
      throw new Error('No hay conexiones disponibles');
    }

    const matrix = origins.map((origin) =>
      destinations.map((dest) => {
        const conexion = this.currentConections.find(
          (c) => c.desde === origin.contador && c.hasta === dest.contador,
        );
        const peso = conexion?.peso;

        return peso ?? Infinity;
      }),
    );

    // Validación de la matriz generada
    if (matrix.length === 0 || matrix[0].length === 0) {
      throw new Error('La matriz generada está vacía');
    }

    // Validar que al menos cada nodo origen tenga una conexión válida
    const rowsWithoutConnections = matrix.map((row, i) => ({
      nodeId: origins[i].contador,
      hasConnection: row.some((value) => value !== Infinity),
    }));

    const invalidNodes = rowsWithoutConnections.filter(
      (row) => !row.hasConnection,
    );
    if (invalidNodes.length > 0) {
      throw new Error(
        `Los siguientes nodos origen no tienen conexiones válidas: ${invalidNodes
          .map((n) => n.nodeId)
          .join(', ')}`,
      );
    }

    console.log('Matriz final:', matrix);
    return matrix;
  }

  private highlightSolution(origins: Nodo[], destinations: Nodo[]): void {
    this.storeOriginalSizes();

    // Primero, restaurar todos los nodos a su estado original
    this.currentNodes.forEach((node) => {
      node.color = this.DEFAULT_NODE_COLOR;
      const originalSize = this.originalRadii.get(node.contador);
      if (originalSize) {
        node.radio = originalSize;
      }
    });

    // Luego aplicar los nuevos estilos
    this.result?.assignment.forEach((row, i) => {
      const j = row.indexOf(1);
      if (j === -1) {
        console.warn(`No se encontró asignación para el origen ${i}`);
        return;
      }

      const color = this.assignmentColors[i % this.assignmentColors.length];
      console.log(
        `Asignando color ${color} a nodos: origen ${i} -> destino ${j}`,
      );

      // Actualizar tanto en currentNodes como en los arrays originales
      const originNode = origins[i];
      const destNode = destinations[j];

      if (!originNode || !destNode) {
        console.error(`Nodos no encontrados para asignación ${i} -> ${j}`);
        return;
      }

      this.applyNodeStyle(originNode, color);
      this.applyNodeStyle(destNode, color);

      // Actualizar en currentNodes
      const currentOrigin = this.currentNodes.find(
        (n) => n.contador === originNode.contador,
      );
      const currentDest = this.currentNodes.find(
        (n) => n.contador === destNode.contador,
      );

      if (currentOrigin) {
        this.applyNodeStyle(currentOrigin, color);
        console.log(
          `Nodo origen ${currentOrigin.contador} coloreado con ${color}`,
        );
      }
      if (currentDest) {
        this.applyNodeStyle(currentDest, color);
        console.log(
          `Nodo destino ${currentDest.contador} coloreado con ${color}`,
        );
      }
    });

    if (this.canvas) {
      this.canvas.nodos = [...this.currentNodes];
      const ctx = this.canvas.canvas.nativeElement.getContext('2d');
      if (ctx) {
        requestAnimationFrame(() => {
          this.canvas.dibujarNodo(ctx);
          this.cdr.detectChanges();
        });
      }
    }
  }

  private calculateMatrixStats(matrix: number[][]): void {
    const values = matrix.flat().filter((v) => v !== Infinity);

    if (values.length === 0) {
      this.matrixStats = null;
      return;
    }

    this.matrixStats = {
      maxValue: Math.max(...values),
      minValue: Math.min(...values),
      average: values.reduce((a, b) => a + b, 0) / values.length,
    };
  }

  private handleError(error: any): void {
    console.error('Error:', error);
    this.snackBar.open(
      error.message || 'Error al resolver la asignación',
      'Cerrar',
      { duration: 5000, panelClass: ['error-snackbar'] },
    );
  }

  trackByAssignment(index: number, item: any): number {
    return index;
  }

  private validateProblem(
    origins: Nodo[],
    destinations: Nodo[],
    matrix: number[][],
  ): boolean {
    if (origins.length !== destinations.length) {
      this.handleError('Debe haber igual cantidad de nodos origen y destino');
      return false;
    }

    if (origins.length === 0 || destinations.length === 0) {
      this.handleError('Debe existir al menos un nodo origen y un destino');
      return false;
    }

    if (matrix.some((row) => row.every((v) => v === Infinity))) {
      this.handleError('Existen nodos origen sin conexiones válidas');
      return false;
    }

    return true;
  }
  private storeOriginalSizes(): void {
    this.canvas.nodos.forEach((n) => {
      this.originalRadii.set(n.contador, n.radio);
    });
  }
  private applyNodeStyle(node: Nodo, color: string): void {
    node.color = color;
    node.radio = this.HIGHLIGHT_RADIUS;
  }
  private resetPreviousState(): void {
    this.result = null;
    this.matrixStats = null;

    if (this.currentNodes && this.currentNodes.length > 0) {
      this.currentNodes.forEach((node) => {
        node.color = this.DEFAULT_NODE_COLOR;
        const originalSize = this.originalRadii.get(node.contador);
        if (originalSize) {
          node.radio = originalSize;
        }
      });
    }

    if (this.canvas) {
      this.canvas.nodos = [...this.currentNodes];
      this.canvas.conexiones = [...this.currentConections];

      requestAnimationFrame(() => {
        const ctx = this.canvas.canvas.nativeElement.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#ffffff'; // O el color de fondo que uses
          ctx.fillRect(
            0,
            0,
            this.canvas.canvas.nativeElement.width,
            this.canvas.canvas.nativeElement.height,
          );
          this.canvas.dibujarNodo(ctx);
        }
        this.cdr.detectChanges();
      });
    }

    this.snackBar.dismiss();
  }
  getNodeName(rowIndex: number, isOrigin: boolean): string {
    if (!this.currentNodes || !this.result) return '';

    const nodes = this.currentNodes.filter((n) => n.esOrigen === isOrigin);
    if (isOrigin) {
      return nodes[rowIndex]?.nombre || '';
    } else {
      const destIndex = this.result.assignment[rowIndex].indexOf(1);
      return nodes[destIndex]?.nombre || '';
    }
  }

  getAssignmentCost(rowIndex: number, assignmentRow: number[]): number {
    const colIndex = assignmentRow.indexOf(1);
    if (colIndex === -1) return 0;

    const origins = this.currentNodes.filter((n) => n.esOrigen);
    const destinations = this.currentNodes.filter((n) => !n.esOrigen);

    // Verificar que los índices sean válidos
    if (rowIndex >= origins.length || colIndex >= destinations.length) return 0;

    const originId = origins[rowIndex].contador;
    const destinationId = destinations[colIndex].contador;

    const conexion = this.currentConections.find(
      (c) => c.desde === originId && c.hasta === destinationId,
    );

    return conexion?.peso || 0;
  }
  onNodosActual(nodos: Nodo[]): void {
    this.currentNodes = [...nodos];
    this.cdr.detectChanges();
  }

  onConectionActual(conn: Conexion[]): void {
    this.currentConections = [...conn];
    this.cdr.detectChanges();
  }

  helpContent: HelpContent = {
    title: 'Ayuda - Algoritmo de Asignación',
    description:
      'Este componente implementa el método húngaro (algoritmo de asignación) para resolver problemas de optimización de asignación de recursos. Requisitos:\n\n' +
      '1. Los nodos deben dividirse en dos grupos: origen y destino\n' +
      '2. Debe haber el mismo número de nodos en cada grupo\n' +
      '3. Las conexiones solo pueden ir de nodos origen a nodos destino\n\n' +
      'El algoritmo encontrará la asignación óptima minimizando o maximizando el costo total basándose en las conexiones existentes.',
    steps: [
      {
        number: 1,
        title: 'Crear Nodos',
        description:
          'Haz doble clic en el canvas para crear los nodos que representarán recursos y tareas. El grafo debe ser bipartito con igual número de nodos en ambos conjuntos.',
        image: 'assets/asignacion/create-node.png',
      },
      {
        number: 2,
        title: 'Establecer Conexiones',
        description:
          'Selecciona el modo "Conexión" y haz clic en dos nodos para crear una conexión. Ingresa el costo/peso de la asignación en el diálogo emergente.',
        image: 'assets/asignacion/create-connection.png',
      },
      {
        number: 3,
        title: 'Configurar Optimización',
        description:
          'Elige entre minimización o maximización según tu objetivo. La minimización busca reducir el costo total, mientras que la maximización busca aumentarlo.',
        image: 'assets/asignacion/optimization-toggle.png',
      },
      {
        number: 4,
        title: 'Resolver',
        description:
          'Presiona el botón "Resolver Asignación" para ejecutar el algoritmo. Las asignaciones óptimas se mostrarán resaltadas en el grafo y en el panel de resultados.',
        image: 'assets/asignacion/solve-button.png',
      },
    ],
    images: [
      {
        url: 'assets/asignacion/example1.png',
        caption: 'Ejemplo de un grafo completo',
        alt: 'Grafo de ejemplo',
      },
    ],
    tips: ['Usa el botón derecho para eliminar elementos'],
  };
}
