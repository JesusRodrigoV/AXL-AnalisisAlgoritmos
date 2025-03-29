import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AssignmentSolverService {
  solve(
    matrix: number[][],
    isMaximization: boolean,
  ): { assignment: number[][]; cost: number } {
    if (matrix.length === 0 || matrix[0].length === 0) {
      throw new Error('La matriz no puede estar vacía');
    }

    const squaredMatrix = this.makeSquare(matrix, isMaximization);
    const processedMatrix = squaredMatrix.map((row) => [...row]);

    if (isMaximization) {
      const validValues = processedMatrix.flat().filter((v) => v !== Infinity);
      if (validValues.length === 0) {
        throw new Error('Matriz inválida: todos los valores son Infinity');
      }
      const maxValue = Math.max(...validValues);
      processedMatrix.forEach((row, i) => {
        row.forEach((_, j) => {
          if (processedMatrix[i][j] !== Infinity) {
            processedMatrix[i][j] = maxValue - processedMatrix[i][j];
          }
        });
      });
    }

    const assignment = this.hungarianAlgorithm(processedMatrix);

    const originalAssignment = assignment
      .slice(0, matrix.length)
      .map((row) => row.slice(0, matrix[0].length));

    // Validar asignación completa
    const assignedCount = originalAssignment
      .flat()
      .filter((v) => v === 1).length;
    if (assignedCount !== matrix.length) {
      throw new Error(
        `Asignación incompleta (${assignedCount}/${matrix.length})`,
      );
    }

    return {
      assignment: originalAssignment,
      cost: this.calculateTotalCost(matrix, originalAssignment),
    };
  }

  private makeSquare(matrix: number[][], isMaximization: boolean): number[][] {
    const n = matrix.length;
    const m = matrix[0].length;
    if (n === m) return matrix;

    const size = Math.max(n, m);
    const fillValue = isMaximization ? -Infinity : 0;

    const newMatrix = Array(size)
      .fill(fillValue)
      .map(() => Array(size).fill(fillValue));

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < m; j++) {
        newMatrix[i][j] = matrix[i][j];
      }
    }

    return newMatrix;
  }

  private hungarianAlgorithm(matrix: number[][]): number[][] {
    const n = matrix.length;
    const m = matrix[0].length;
    const matrixCopy = matrix.map((row) =>
      row.map((v) => (v === Infinity ? Infinity : v)),
    );
    let rowMatches = new Array(n).fill(-1);
    let colMatches = new Array(m).fill(-1);

    // Reducción de filas
    for (let i = 0; i < n; i++) {
      const validValues = matrixCopy[i].filter((v) => v !== Infinity);
      if (validValues.length === 0) throw new Error('Fila inválida');
      const minVal = Math.min(...validValues);
      matrixCopy[i] = matrixCopy[i].map((v) =>
        v !== Infinity ? v - minVal : v,
      );
    }

    // Reducción de columnas
    for (let j = 0; j < m; j++) {
      const column = matrixCopy.map((row) => row[j]);
      const validValues = column.filter((v) => v !== Infinity);
      if (validValues.length === 0) throw new Error('Columna inválida');
      const minVal = Math.min(...validValues);
      for (let i = 0; i < n; i++) {
        if (matrixCopy[i][j] !== Infinity) {
          matrixCopy[i][j] -= minVal;
        }
      }
    }

    const findAugmentingPath = (i: number, visited: boolean[]): boolean => {
      for (let j = 0; j < m; j++) {
        if (matrixCopy[i][j] === 0 && !visited[j]) {
          visited[j] = true;
          if (
            colMatches[j] === -1 ||
            findAugmentingPath(colMatches[j], visited)
          ) {
            rowMatches[i] = j;
            colMatches[j] = i;
            return true;
          }
        }
      }
      return false;
    };

    let iteration = 0;
    const maxIterations = n * 50;

    while (true) {
      // Reiniciamos las asignaciones
      rowMatches.fill(-1);
      colMatches.fill(-1);
      let assigned = 0;
      for (let i = 0; i < n; i++) {
        if (findAugmentingPath(i, new Array(m).fill(false))) {
          assigned++;
        }
      }
      if (assigned === n) break; // Asignación completa

      // --- Cálculo de líneas de cobertura ---
      // 1. Marcar todas las filas que NO tienen asignación.
      const markedRows = new Array(n).fill(false);
      const markedCols = new Array(m).fill(false);
      for (let i = 0; i < n; i++) {
        if (rowMatches[i] === -1) {
          markedRows[i] = true;
        }
      }

      // 2. Propagar las marcas: para cada fila marcada, marcar las columnas donde hay cero.
      let change = true;
      while (change) {
        change = false;
        for (let i = 0; i < n; i++) {
          if (markedRows[i]) {
            for (let j = 0; j < m; j++) {
              if (matrixCopy[i][j] === 0 && !markedCols[j]) {
                markedCols[j] = true;
                change = true;
              }
            }
          }
        }
        // Para cada columna marcada, marcar la fila asignada en ella (si no está ya marcada).
        for (let j = 0; j < m; j++) {
          if (
            markedCols[j] &&
            colMatches[j] !== -1 &&
            !markedRows[colMatches[j]]
          ) {
            markedRows[colMatches[j]] = true;
            change = true;
          }
        }
      }
      // Según el algoritmo, las líneas de cobertura se definen como:
      //   - Las filas **no marcadas** se cubren.
      //   - Las columnas **marcadas** se cubren.
      const coverRows = markedRows.map((mark) => !mark); // true si se debe cubrir la fila
      const coverCols = [...markedCols];

      // Buscar el mínimo valor no cubierto (elementos en filas no cubiertas y columnas no cubiertas)
      let minUncovered = Infinity;
      for (let i = 0; i < n; i++) {
        if (!coverRows[i]) {
          // fila no cubierta
          for (let j = 0; j < m; j++) {
            if (!coverCols[j] && matrixCopy[i][j] < minUncovered) {
              minUncovered = matrixCopy[i][j];
            }
          }
        }
      }

      if (minUncovered === Infinity) {
        throw new Error(
          'No se encontró valor mínimo no cubierto; la matriz podría ser inválida.',
        );
      }

      // Ajuste de la matriz:
      // - Se resta minUncovered a los elementos no cubiertos (fila no cubierta y columna no cubierta).
      // - Se suma minUncovered a los elementos que están en la intersección de una fila cubierta y columna cubierta.
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < m; j++) {
          if (!coverRows[i] && !coverCols[j]) {
            if (matrixCopy[i][j] !== Infinity) {
              matrixCopy[i][j] -= minUncovered;
            }
          } else if (coverRows[i] && coverCols[j]) {
            if (matrixCopy[i][j] !== Infinity) {
              matrixCopy[i][j] += minUncovered;
            }
          }
        }
      }

      if (++iteration > maxIterations) {
        throw new Error(`No converge en ${maxIterations} iteraciones`);
      }
    }

    // Construir la asignación final
    const assignment = Array(n)
      .fill(0)
      .map(() => Array(m).fill(0));
    rowMatches.forEach((j, i) => {
      if (j !== -1) assignment[i][j] = 1;
    });

    return assignment;
  }

  private calculateTotalCost(
    originalMatrix: number[][],
    assignment: number[][],
  ): number {
    let total = 0;
    assignment.forEach((row, i) =>
      row.forEach((val, j) => {
        if (val === 1) {
          if (originalMatrix[i]?.[j] === undefined) {
            throw new Error(
              'Asignación fuera de los límites de la matriz original',
            );
          }
          if (originalMatrix[i][j] === Infinity) {
            throw new Error(
              'Asignación inválida en celda prohibida (Infinity)',
            );
          }
          total += originalMatrix[i][j];
        }
      }),
    );
    return total;
  }
}
