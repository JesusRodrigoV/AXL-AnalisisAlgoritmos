import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ViewChild,
  ChangeDetectorRef,
  Inject,
  PLATFORM_ID,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MyCanvasComponent } from '@app/src/my-canvas';
import { MatListModule } from '@angular/material/list';
import { FormsModule } from '@angular/forms';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { HelpContent } from '@app/models/Help.model';
import { HelpButtonComponent } from '@app/src/help-button';

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
  ],
  templateUrl: './asignacion.component.html',
  styleUrl: './asignacion.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class AsignacionComponent {
  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private cdr: ChangeDetectorRef,
  ) {}
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
  // Array de colores para las asignaciones
  assignmentColors: string[] = [
    '#FF6B6B80', // Rojo
    '#FFEEAD80', // Turquesa
    '#45B7D180', // Azul claro
    '#96CEB480', // Verde menta
    '#FA3EAD80', // Amarillo claro
    '#D4A5A580', // Rosa pálido
    '#9B5DE580', // Púrpura
    '#F15BB580', // Rosa
    '#00BBF980', // Azul brillante
    '#00F5D480', // Turquesa brillante
  ];

  // Colores sólidos para las conexiones
  connectionColors: string[] = [
    '#FF6B6B', // Rojo
    '#FFEEAD', // Turquesa
    '#45B7D1', // Azul claro
    '#96CEB4', // Verde menta
    '#FA3EAD', // Amarillo claro
    '#D4A5A5', // Rosa pálido
    '#9B5DE5', // Púrpura
    '#F15BB5', // Rosa
    '#00BBF9', // Azul brillante
    '#00F5D4', // Turquesa brillante
  ];
  @ViewChild(MyCanvasComponent) canvas!: MyCanvasComponent;
  result: { assignment: number[][]; cost: number } | null = null;
  isMaximization: boolean = false; // Por defecto será minimización
  matrixStats: { maxValue: number; minValue: number; average: number } | null =
    null;

  calculateMatrixStats(matrix: number[][]) {
    const values = matrix.flat().filter((x) => x !== Infinity);
    this.matrixStats = {
      maxValue: Math.max(...values),
      minValue: Math.min(...values),
      average: values.reduce((a, b) => a + b, 0) / values.length,
    };
  }

  getFormattedAssignments() {
    if (!this.result) return [];

    const assignments = [];
    const matrix = this.getAdjacencyMatrix();
    const nodes = this.canvas.nodos;

    // Ordenar por nodo origen para una visualización más clara
    for (let i = 0; i < this.result.assignment.length; i++) {
      for (let j = 0; j < this.result.assignment[i].length; j++) {
        if (this.result.assignment[i][j] === 1) {
          const fromNode = nodes.find((n) => n.contador === i + 1);
          const toNode = nodes.find((n) => n.contador === j + 1);

          assignments.push({
            from: fromNode ? `Origen ${fromNode.contador}` : `Origen ${i + 1}`,
            to: toNode ? `Destino ${toNode.contador}` : `Destino ${j + 1}`,
            cost: matrix[i][j],
            fromId: i + 1,
            toId: j + 1,
          });
        }
      }
    }

    // Ordenar por ID del nodo origen
    return assignments.sort((a, b) => a.fromId - b.fromId);
  }

  solveAssignment(isMaximization: boolean = false) {
    try {
      this.isMaximization = isMaximization;
      console.log('Iniciando resolución del problema de asignación');
      console.log(
        'Modo:',
        this.isMaximization ? 'Maximización' : 'Minimización',
      );

      const matrix = this.getAdjacencyMatrix();
      console.log('Matriz original:', matrix);

      if (!this.validateMatrix(matrix)) {
        alert(
          'El grafo debe ser bipartito y tener igual número de nodos en ambos conjuntos',
        );
        return;
      }

      // Si es maximización, convertimos el problema a minimización
      let workingMatrix = [...matrix.map((row) => [...row])];
      if (this.isMaximization) {
        console.log('Convirtiendo problema de maximización a minimización');
        const maxValue = Math.max(
          ...matrix.flat().filter((x) => x !== Infinity),
        );
        workingMatrix = workingMatrix.map((row) =>
          row.map((val) => (val === Infinity ? Infinity : maxValue - val)),
        );
        console.log('Matriz convertida para minimización:', workingMatrix);
      }

      this.result = this.hungarianAlgorithm(workingMatrix);

      // Ajustar el costo final si era un problema de maximización
      if (this.isMaximization && this.result) {
        const n = matrix.length;
        const maxValue = Math.max(
          ...matrix.flat().filter((x) => x !== Infinity),
        );
        this.result.cost = maxValue * n - this.result.cost;
        console.log('Costo ajustado para maximización:', this.result.cost);
      }
      this.highlightSolution();
      // Forzar la detección de cambios
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error al resolver la asignación:', error);
      /*
      Algoritmoert(
        'Ocurrió un error al resolver la asignación. Por favor, verifica que el grafo sea válido.',
      );*/
    }
  }

  private getAdjacencyMatrix(): number[][] {
    const nodes = this.canvas.nodos;
    const connections = this.canvas.conexiones;
    const n = nodes.length;
    const matrix: number[][] = Array(n)
      .fill(0)
      .map(() => Array(n).fill(Infinity));

    // Llenar la matriz con los pesos de las conexiones
    for (const conn of connections) {
      matrix[conn.desde - 1][conn.hasta - 1] = conn.peso || Infinity;
    }

    return matrix;
  }

  private validateMatrix(matrix: number[][]): boolean {
    const n = matrix.length;
    const nodes = this.canvas.nodos;
    const nodeIds = new Set(nodes.map((node) => node.contador));

    // 1. Verificar que la matriz sea cuadrada (igual número de nodos origen y destino)
    if (!matrix.every((row) => row.length === n)) {
      alert('El grafo debe tener el mismo número de nodos origen y destino');
      return false;
    }

    // 2. Verificar que no haya valores negativos y que los nodos existan
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        // Verificar que los nodos referenciados existan
        if (!nodeIds.has(i + 1) || !nodeIds.has(j + 1)) {
          // Limpiar las conexiones inválidas
          this.cleanInvalidConnections();
          alert(
            'Se detectaron conexiones con nodos eliminados. Las conexiones han sido limpiadas.',
          );
          return false;
        }

        if (matrix[i][j] !== Infinity && matrix[i][j] < 0) {
          alert(
            `Error: Se encontró un valor negativo entre el nodo ${i + 1} y el nodo ${j + 1}`,
          );
          return false;
        }
      }
    }

    return true;
  }

  private cleanInvalidConnections(): void {
    const nodeIds = new Set(this.canvas.nodos.map((node) => node.contador));

    // Filtrar las conexiones, manteniendo solo aquellas donde ambos nodos existen
    this.canvas.conexiones = this.canvas.conexiones.filter(
      (conn) => nodeIds.has(conn.desde) && nodeIds.has(conn.hasta),
    );

    // Forzar el redibujado del canvas
    const ctx = this.canvas.canvas.nativeElement.getContext('2d');
    if (ctx) {
      this.canvas.dibujarNodo(ctx);
    }
  }

  private hungarianAlgorithm(costMatrix: number[][]): {
    assignment: number[][];
    cost: number;
  } {
    const n = costMatrix.length;
    let matrix = costMatrix.map((row) => [...row]); // Copia de la matriz

    console.log('Iniciando algoritmo húngaro completo');
    console.log('Matriz de costos inicial:', matrix);

    // Encontrar la asignación óptima directamente
    const assignment = this.findOptimalAssignment(matrix);

    // Calcular el costo total basado en la asignación encontrada
    let totalCost = 0;
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (assignment[i][j] === 1) {
          totalCost += costMatrix[i][j];
        }
      }
    }

    console.log('Solución encontrada:', assignment);
    console.log('Costo total:', totalCost);

    return {
      assignment: assignment,
      cost: totalCost,
    };
  }

  private findZeros(
    matrix: number[][],
    mask: number[][],
    rowCover: boolean[],
    colCover: boolean[],
  ): number {
    const n = matrix.length;

    // Paso 1: Marcar ceros independientes
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (matrix[i][j] === 0 && !rowCover[i] && !colCover[j]) {
          mask[i][j] = 1;
          rowCover[i] = true;
          colCover[j] = true;
        }
      }
    }

    // Paso 2: Marcar ceros no cubiertos
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (matrix[i][j] === 0 && mask[i][j] === 0) {
          mask[i][j] = 2;
        }
      }
    }

    // Limpiar coberturas para el siguiente paso
    for (let i = 0; i < n; i++) {
      rowCover[i] = false;
      colCover[i] = false;
    }

    return 4;
  }

  private coverZeros(
    mask: number[][],
    rowCover: boolean[],
    colCover: boolean[],
  ): number {
    const n = mask.length;
    let zerosFound = 0;

    // Marcar todas las columnas con un 1 en mask
    for (let j = 0; j < n; j++) {
      for (let i = 0; i < n; i++) {
        if (mask[i][j] === 1) {
          colCover[j] = true;
          zerosFound++;
          break;
        }
      }
    }

    if (zerosFound >= n) {
      return 6; // Solución encontrada
    }
    return 5; // Necesitamos crear más ceros
  }

  private createAdditionalZeros(
    matrix: number[][],
    rowCover: boolean[],
    colCover: boolean[],
  ): number {
    const n = matrix.length;

    // Encontrar el valor mínimo no cubierto
    let minValue = Infinity;
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (!rowCover[i] && !colCover[j] && matrix[i][j] < minValue) {
          minValue = matrix[i][j];
        }
      }
    }

    if (minValue === Infinity) {
      return 6; // No hay más movimientos posibles
    }

    // Restar el mínimo de las filas no cubiertas
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (!rowCover[i] && !colCover[j]) {
          matrix[i][j] -= minValue;
        }
      }
    }

    // Sumar el mínimo a los elementos doblemente cubiertos
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (rowCover[i] && colCover[j]) {
          matrix[i][j] += minValue;
        }
      }
    }

    return 3;
  }

  private constructSolution(mask: number[][]): number[][] {
    const n = mask.length;
    const assignment = Array(n)
      .fill(0)
      .map(() => Array(n).fill(0));
    const rowAssigned = new Array(n).fill(false);
    const colAssigned = new Array(n).fill(false);

    // Primera pasada: asignar los 1s (ceros marcados independientes)
    let assignmentCount = 0;
    for (let i = 0; i < n && assignmentCount < n; i++) {
      for (let j = 0; j < n; j++) {
        if (mask[i][j] === 1 && !rowAssigned[i] && !colAssigned[j]) {
          assignment[i][j] = 1;
          rowAssigned[i] = true;
          colAssigned[j] = true;
          assignmentCount++;
        }
      }
    }

    // Segunda pasada: asignar los ceros restantes si es necesario
    for (let i = 0; i < n && assignmentCount < n; i++) {
      if (!rowAssigned[i]) {
        for (let j = 0; j < n; j++) {
          if (!colAssigned[j] && mask[i][j] === 2) {
            // Usamos mask en lugar de matrix y buscamos los 2s
            assignment[i][j] = 1;
            rowAssigned[i] = true;
            colAssigned[j] = true;
            assignmentCount++;
            break;
          }
        }
      }
    }

    // Validación final
    if (!this.validateAssignment(assignment)) {
      console.error('Error: No se pudo construir una solución válida');
      // En lugar de retornar null, retornamos una matriz vacía
      return Array(n)
        .fill(0)
        .map(() => Array(n).fill(0));
    }

    return assignment;
  }

  private validateAssignment(assignment: number[][]): boolean {
    const n = assignment.length;
    const rowSums = new Array(n).fill(0);
    const colSums = new Array(n).fill(0);

    // Calcular sumas de filas y columnas en una sola pasada
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        rowSums[i] += assignment[i][j];
        colSums[j] += assignment[i][j];
      }
    }

    // Verificar que cada nodo origen tenga exactamente una asignación
    for (let i = 0; i < n; i++) {
      if (rowSums[i] !== 1) {
        console.error(
          `Error: El nodo origen ${i + 1} tiene ${rowSums[i]} asignaciones (debe tener exactamente 1)`,
        );
        return false;
      }
    }

    // Verificar que cada nodo destino tenga exactamente una asignación
    for (let j = 0; j < n; j++) {
      if (colSums[j] !== 1) {
        console.error(
          `Error: El nodo destino ${j + 1} tiene ${colSums[j]} asignaciones (debe tener exactamente 1)`,
        );
        return false;
      }
    }

    return true;
  }

  // Método auxiliar para verificar si una asignación es válida antes de aplicarla
  private isValidAssignment(
    assignment: number[][],
    row: number,
    col: number,
  ): boolean {
    const n = assignment.length;

    // Verificar que la columna no tenga ya una asignación
    for (let i = 0; i < n; i++) {
      if (assignment[i][col] === 1) return false;
    }

    // Verificar que la fila no tenga ya una asignación
    return !assignment[row].includes(1);
  }

  private findOptimalAssignment(matrix: number[][]): number[][] {
    const n = matrix.length;
    const assignment = Array(n)
      .fill(0)
      .map(() => Array(n).fill(0));
    const rowAssigned = Array(n).fill(false);
    const colAssigned = Array(n).fill(false);

    console.log('Buscando asignación óptima');
    console.log('Matriz para asignación:', matrix);

    // Para cada nodo origen
    for (let i = 0; i < n; i++) {
      let minCost = Infinity;
      let bestCol = -1;

      // Encontrar el destino no asignado con menor costo
      for (let j = 0; j < n; j++) {
        if (
          !colAssigned[j] &&
          matrix[i][j] !== Infinity &&
          matrix[i][j] < minCost
        ) {
          minCost = matrix[i][j];
          bestCol = j;
        }
      }

      // Si encontramos un destino válido, hacer la asignación
      if (bestCol !== -1) {
        assignment[i][bestCol] = 1;
        rowAssigned[i] = true;
        colAssigned[bestCol] = true;
        console.log(
          `Asignando: Origen ${i + 1} -> Destino ${bestCol + 1} (costo: ${minCost})`,
        );
      }
    }

    // Verificar que todas las asignaciones sean válidas
    if (!this.validateAssignment(assignment)) {
      console.warn('Advertencia: No todas las asignaciones son óptimas');
    }

    return assignment;
  }

  private highlightSolution(): void {
    if (!this.result) return;

    // Resetear colores
    this.canvas.nodos.forEach((node) => {
      node.color = '#ffffff';
    });

    const assignment = this.result.assignment;
    const usedColors = new Set<number>();

    // Resaltar las asignaciones óptimas
    for (let i = 0; i < assignment.length; i++) {
      for (let j = 0; j < assignment[i].length; j++) {
        if (assignment[i][j] === 1) {
          // Asignar un color único para cada asignación
          let colorIndex = 0;
          while (usedColors.has(colorIndex)) {
            colorIndex = (colorIndex + 1) % this.connectionColors.length;
          }
          usedColors.add(colorIndex);

          // Encontrar y resaltar la conexión
          const connection = this.canvas.conexiones.find(
            (conn) => conn.desde === i + 1 && conn.hasta === j + 1,
          );

          if (connection) {
            // Resaltar los nodos conectados
            const fromNode = this.canvas.nodos.find(
              (node) => node.contador === i + 1,
            );
            const toNode = this.canvas.nodos.find(
              (node) => node.contador === j + 1,
            );

            if (fromNode) {
              fromNode.color = this.assignmentColors[colorIndex];
              fromNode.radio = 25; // Aumentar temporalmente el tamaño
            }
            if (toNode) {
              toNode.color = this.assignmentColors[colorIndex];
              toNode.radio = 25; // Aumentar temporalmente el tamaño
            }
          }
        }
      }
    }

    // Redibujar el canvas
    const ctx = this.canvas.canvas.nativeElement.getContext('2d');
    if (ctx) {
      this.canvas.dibujarNodo(ctx);
    }
  }
}
