import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, ViewChild } from '@angular/core';
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
  helpContent: HelpContent = {
    title: 'Ayuda - Algoritmo de Johnson',
    description:
      'Este componente te permite resolver problemas usando el algoritmo de Johnson...',
    steps: [
      {
        number: 1,
        title: 'Crear nodos',
        description: 'Haz clic en el canvas para crear un nuevo nodo',
        image: 'assets/create-node.png',
      },
      {
        number: 2,
        title: 'Crear nodos',
        description: 'Haz clic en el canvas para crear un nuevo nodo',
        image: 'assets/create-node.png',
      },
      {
        number: 3,
        title: 'Crear nodos',
        description: 'Haz clic en el canvas para crear un nuevo nodo',
        image: 'assets/create-node.png',
      },
    ],
    images: [
      {
        url: 'assets/example1.png',
        caption: 'Ejemplo de un grafo completo',
        alt: 'Grafo de ejemplo',
      },
    ],
    tips: [
      'Puedes arrastrar los nodos para reorganizarlos',
      'Usa el botón derecho para eliminar elementos',
    ],
  };
  // Array de colores para las asignaciones
  assignmentColors: string[] = [
    '#FF6B6B80', // Rojo con transparencia
    '#4ECDC480', // Turquesa con transparencia
    '#45B7D180', // Azul claro con transparencia
    '#96CEB480', // Verde menta con transparencia
    '#FFEEAD80', // Amarillo claro con transparencia
    '#D4A5A580', // Rosa pálido con transparencia
    '#9B5DE580', // Púrpura con transparencia
    '#F15BB580', // Rosa con transparencia
    '#00BBF980', // Azul brillante con transparencia
    '#00F5D480', // Turquesa brillante con transparencia
  ];

  // Colores sólidos para las conexiones
  connectionColors: string[] = [
    '#FF6B6B', // Rojo
    '#4ECDC4', // Turquesa
    '#45B7D1', // Azul claro
    '#96CEB4', // Verde menta
    '#FFEEAD', // Amarillo claro
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

    for (let i = 0; i < this.result.assignment.length; i++) {
      for (let j = 0; j < this.result.assignment[i].length; j++) {
        if (this.result.assignment[i][j] === 1) {
          assignments.push({
            from: `Nodo ${i + 1}`,
            to: `Nodo ${j + 1}`,
            cost: matrix[i][j],
          });
        }
      }
    }

    return assignments;
  }

  solveAssignment(isMaximization: boolean = false) {
    this.isMaximization = isMaximization;
    console.log('Iniciando resolución del problema de asignación');
    console.log('Modo:', this.isMaximization ? 'Maximización' : 'Minimización');

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
      const maxValue = Math.max(...matrix.flat().filter((x) => x !== Infinity));
      workingMatrix = workingMatrix.map((row) =>
        row.map((val) => (val === Infinity ? Infinity : maxValue - val)),
      );
      console.log('Matriz convertida para minimización:', workingMatrix);
    }

    this.result = this.hungarianAlgorithm(workingMatrix);

    // Ajustar el costo final si era un problema de maximización
    if (this.isMaximization && this.result) {
      const n = matrix.length;
      const maxValue = Math.max(...matrix.flat().filter((x) => x !== Infinity));
      this.result.cost = maxValue * n - this.result.cost;
      console.log('Costo ajustado para maximización:', this.result.cost);
    }
    this.highlightSolution();
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
    // Verificar que la matriz sea cuadrada
    if (!matrix.every((row) => row.length === n)) return false;

    // Verificar que sea bipartito (simplificado)
    // Aquí podrías agregar una validación más compleja para asegurar que el grafo es bipartito
    return true;
  }

  private hungarianAlgorithm(costMatrix: number[][]): {
    assignment: number[][];
    cost: number;
  } {
    const n = costMatrix.length;
    let matrix = costMatrix.map((row) => [...row]); // Copia de la matriz

    console.log('Iniciando algoritmo húngaro completo');
    console.log('Matriz de costos inicial:', matrix);

    // Paso 1: Restar el mínimo de cada fila
    matrix = matrix.map((row, index) => {
      const validValues = row.filter((x) => x !== Infinity);
      if (validValues.length === 0) return row;
      const min = Math.min(...validValues);
      console.log(`Mínimo de la fila ${index}:`, min);
      return row.map((val) => (val === Infinity ? Infinity : val - min));
    });
    console.log('Matriz después de restar mínimos de filas:', matrix);

    // Paso 2: Restar el mínimo de cada columna
    for (let j = 0; j < n; j++) {
      const columnValues = matrix
        .map((row) => row[j])
        .filter((x) => x !== Infinity);
      if (columnValues.length === 0) continue;
      const min = Math.min(...columnValues);
      if (min > 0) {
        console.log(`Mínimo de la columna ${j}:`, min);
        for (let i = 0; i < n; i++) {
          if (matrix[i][j] !== Infinity) {
            matrix[i][j] -= min;
          }
        }
      }
    }
    console.log('Matriz después de restar mínimos de columnas:', matrix);

    // Paso 3: Encontrar la solución óptima mediante un proceso iterativo
    let assignment: number[][] = [];
    let step = 3;
    const mask = Array(n)
      .fill(0)
      .map(() => Array(n).fill(0));
    const rowCover = Array(n).fill(false);
    const colCover = Array(n).fill(false);

    while (step !== -1) {
      console.log(`Ejecutando paso ${step}`);
      switch (step) {
        case 3:
          step = this.findZeros(matrix, mask, rowCover, colCover);
          break;
        case 4:
          step = this.coverZeros(mask, rowCover, colCover);
          break;
        case 5:
          step = this.createAdditionalZeros(matrix, rowCover, colCover);
          break;
        case 6:
          assignment = this.constructSolution(mask);
          step = -1;
          break;
      }
    }

    // Calcular el costo total
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

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (matrix[i][j] === 0 && !rowCover[i] && !colCover[j]) {
          mask[i][j] = 1;
          rowCover[i] = true;
          colCover[j] = true;
        }
      }
    }

    // Limpiar coberturas para el siguiente paso
    rowCover.fill(false);
    colCover.fill(false);

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

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (mask[i][j] === 1) {
          assignment[i][j] = 1;
        }
      }
    }

    return assignment;
  }

  private findOptimalAssignment(matrix: number[][]): number[][] {
    const n = matrix.length;
    const assignment = Array(n)
      .fill(0)
      .map(() => Array(n).fill(0));
    const rowCovered = Array(n).fill(false);
    const colCovered = Array(n).fill(false);

    console.log('Buscando asignación óptima');
    console.log('Matriz para asignación:', matrix);

    // Encontrar asignación inicial
    let numAssigned = 0;
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (matrix[i][j] === 0 && !rowCovered[i] && !colCovered[j]) {
          assignment[i][j] = 1;
          rowCovered[i] = true;
          colCovered[j] = true;
          numAssigned++;
          console.log(`Asignación encontrada: (${i},${j})`);
        }
      }
    }

    console.log('Número de asignaciones realizadas:', numAssigned);
    console.log('Asignación final:', assignment);

    // Si no se han asignado todos los elementos, se podría mejorar
    // el algoritmo aquí implementando los pasos adicionales del
    // método húngaro completo (líneas, etc.)
    if (numAssigned < n) {
      console.warn('No se encontró una asignación completa óptima');
    }

    return assignment;
  }

  private highlightSolution(): void {
    if (!this.result) return;

    // Resetear colores
    this.canvas.nodos.forEach((node) => {
      node.color = '#ffffff';
    });

    // Resetear colores de conexiones
    this.canvas.conexiones.forEach((conn) => {
      conn._color = '#666';
    });

    // Resaltar las conexiones de la solución
    const assignment = this.result.assignment;
    const usedColors = new Set<number>(); // Para trackear los colores usados

    for (let i = 0; i < assignment.length; i++) {
      for (let j = 0; j < assignment[i].length; j++) {
        if (assignment[i][j] === 1) {
          // Asignar un nuevo índice de color que no haya sido usado
          let colorIndex = 0;
          while (usedColors.has(colorIndex)) {
            colorIndex = (colorIndex + 1) % this.assignmentColors.length;
          }
          usedColors.add(colorIndex);

          // Encontrar la conexión correspondiente
          const connection = this.canvas.conexiones.find(
            (conn) => conn.desde === i + 1 && conn.hasta === j + 1,
          );

          if (connection) {
            // Resaltar los nodos conectados con colores semi-transparentes
            const fromNode = this.canvas.nodos.find(
              (node) => node.contador === i + 1,
            );
            const toNode = this.canvas.nodos.find(
              (node) => node.contador === j + 1,
            );

            if (fromNode) fromNode.color = this.assignmentColors[colorIndex];
            if (toNode) toNode.color = this.assignmentColors[colorIndex];
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
