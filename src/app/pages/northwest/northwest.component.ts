import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-northwest',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './northwest.component.html',
  styleUrls: ['./northwest.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class NorthwestComponent {
  rows: number = 4;
  cols: number = 3;
  matrix: number[][] = [];
  supply: number[] = [];
  supplyN: number[] = [];
  demand: number[] = [];
  demandN: number[] = [];
  solution: number[][] = [];
  costMatrix: number[][] = []; // Agregado para almacenar costos

  ngOnInit(): void {
    this.initializeMatrix();
    this.setMatrix([
      [3, 1, 7, 4],
      [2, 6, 5, 9],
      [8, 3, 3, 3]
    ]);
    this.supply = [250, 350, 400];
    this.demand = [200,300,350,150];
    this.supplyN = [250, 350, 400];
    this.demandN = [200,300,350,150];
  }

/*
    0 250 0 0
    200 0 150 0
    0 50  200 150
  */

  /*
    3 1 7 4 250
    2 6 5 9 350
    8 3 3 3 400
    200 300 350 150
  */


  initializeMatrix() {
    this.matrix = Array.from({ length: this.rows }, () => Array(this.cols).fill(0));
    this.solution = Array.from({ length: this.supply.length }, () => Array(this.demand.length).fill(0));
    this.costMatrix = Array.from({ length: this.supply.length }, () => Array(this.demand.length).fill(0));
  }


  setCostMatrix(costs: number[][]) {
    this.costMatrix = costs;
  }

  setMatrix(matrix: number[][]) {
    this.matrix = matrix;
  }

  trackByIndex(index: number, obj: any): any {
    return index;
  }

  solve() {
    this.setCostMatrix(this.matrix);

    console.log("Supply:", this.supply);
    console.log("Demand:", this.demand);
    console.log("Supply and Demand Copy");
    console.log("SupplyN:", this.supplyN);
    console.log("DemandN:", this.demandN);
    console.log("Aplicando método Northwest Corner...");
    this.northwestCorner();
    console.log("Matriz de asignación inicial:", this.solution);
    console.log("Supply:", this.supply);
    console.log("Demand:", this.demand);
    console.log("Supply and Demand Copy");
    console.log("SupplyN:", this.supplyN);
    console.log("DemandN:", this.demandN);
    console.log("Costo inicial:", this.calculateTotalCost());

    console.log("Optimizando con método MODI...");
    this.optimizeMODI();
    console.log("Matriz optimizada:", this.solution);
    console.log("Costo mínimo obtenido:", this.calculateTotalCost());
  }

  northwestCorner() {
    console.log("Supply:", this.supply);
    console.log("Demand:", this.demand);
    console.log("Supply and Demand Copy");
    console.log("SupplyN:", this.supplyN);
    console.log("DemandN:", this.demandN);
    let i = 0, j = 0;
    this.solution = Array.from({ length: this.supplyN.length }, () => Array(this.demandN.length).fill(0));

    while (i < this.supplyN.length && j < this.demandN.length) {
      console.log("i:", i, " y J:", j);
      console.log("Supply:", this.supply);
      console.log("Demand:", this.demand);
      console.log("Supply and Demand Copy");
      console.log("SupplyN:", this.supplyN);
      console.log("DemandN:", this.demandN);
      const qty = Math.min(this.supplyN[i], this.demandN[j]);
      this.solution[i][j] = qty; // Asegurar que solution[i][j] está definido
      this.supplyN[i] -= qty;
      this.demandN[j] -= qty;

      if (this.supplyN[i] === 0) i++;
      if (this.demandN[j] === 0) j++;
    }
  }


  // Calcular costo total de la asignación
  calculateTotalCost(): number {
    let totalCost = 0;
    for (let i = 0; i < this.solution.length; i++) {
      for (let j = 0; j < this.solution[i].length; j++) {
        if (this.solution[i][j] !== undefined && this.costMatrix[i][j] !== undefined) {
          totalCost += this.solution[i][j] * this.costMatrix[i][j];
        }
      }
    }
    return totalCost;
  }

  // Método MODI para optimización
  optimizeMODI() {
    let iteration = 0;
    while (true) {
      iteration++;
      const rows = this.supply.length;
      const cols = this.demand.length;
      let u = Array(rows).fill(null);
      let v = Array(cols).fill(null);
      u[0] = 0; // Empezamos con u[0]=0

      // 1. Calcular los potenciales U y V
      let updated = true;
      while (updated) {
        updated = false;
        for (let i = 0; i < rows; i++) {
          for (let j = 0; j < cols; j++) {
            if (this.solution[i][j] > 0) { // Solo celdas básicas
              if (u[i] !== null && v[j] === null) {
                v[j] = this.costMatrix[i][j] - u[i];
                updated = true;
              } else if (u[i] === null && v[j] !== null) {
                u[i] = this.costMatrix[i][j] - v[j];
                updated = true;
              }
            }
          }
        }
      }

      // 2. Buscar la celda con el menor costo reducido (solo en celdas no básicas)
      let minReducedCost = Infinity;
      let minI = -1, minJ = -1;
      for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
          if (this.solution[i][j] === 0) {
            const reducedCost = this.costMatrix[i][j] - (u[i]! + v[j]!);
            if (reducedCost < minReducedCost) {
              minReducedCost = reducedCost;
              minI = i;
              minJ = j;
            }
          }
        }
      }

      // 3. Si no hay mejoras, salir del ciclo
      if (minReducedCost >= 0) {
        console.log(`Iteración ${iteration}: No se encontró una mejor solución.`);
        break;
      }

      // 4. Buscar el ciclo cerrado
      let cycle = this.findCycle(minI, minJ);
      if (!cycle) {
        console.log(`Iteración ${iteration}: No se encontró ciclo de transporte.`);
        break;
      }

      // 5. Ajustar la solución
      let theta = Infinity;
      // Se toman los nodos con signo negativo en el ciclo (empezando desde el segundo)
      for (let k = 1; k < cycle.length; k += 2) {
        let [i, j] = cycle[k];
        theta = Math.min(theta, this.solution[i][j]);
      }
      for (let k = 0; k < cycle.length; k++) {
        let [i, j] = cycle[k];
        if (k % 2 === 0) {
          this.solution[i][j] += theta;
        } else {
          this.solution[i][j] -= theta;
        }
      }

      console.log(`Iteración ${iteration}: Mejorando solución con la celda (${minI}, ${minJ}) con costo reducido ${minReducedCost}`);
    }
  }


  // Método para encontrar el ciclo cerrado
  findCycle(startI: number, startJ: number): [number, number][] | null {
    const rows = this.solution.length;
    const cols = this.solution[0].length;
    let path: [number, number][] = [];
    let visited = Array.from({ length: rows }, () => Array(cols).fill(false));

    const dfs = (i: number, j: number, lastDir: 'row' | 'col' | null): boolean => {
      // Si el camino tiene 4 o más celdas y vuelve a la celda inicial, se encontró un ciclo.
      if (path.length >= 4 && i === startI && j === startJ) {
        return true;
      }

      // Explorar en la misma fila (horizontal)
      if (lastDir !== 'row') {
        for (let y = 0; y < cols; y++) {
          if (y === j) continue;
          // Permitir la celda candidata solo para cerrar el ciclo.
          if (i === startI && y === startJ) {
            if (path.length >= 3) {
              path.push([i, y]);
              return true;
            }
            continue;
          }
          if (!visited[i][y] && this.solution[i][y] > 0) {
            visited[i][y] = true;
            path.push([i, y]);
            if (dfs(i, y, 'row')) return true;
            path.pop();
            visited[i][y] = false;
          }
        }
      }

      // Explorar en la misma columna (vertical)
      if (lastDir !== 'col') {
        for (let x = 0; x < rows; x++) {
          if (x === i) continue;
          if (x === startI && j === startJ) {
            if (path.length >= 3) {
              path.push([x, j]);
              return true;
            }
            continue;
          }
          if (!visited[x][j] && this.solution[x][j] > 0) {
            visited[x][j] = true;
            path.push([x, j]);
            if (dfs(x, j, 'col')) return true;
            path.pop();
            visited[x][j] = false;
          }
        }
      }
      return false;
    };

    // Iniciar el DFS desde la celda candidata.
    path.push([startI, startJ]);
    visited[startI][startJ] = true;
    if (dfs(startI, startJ, null)) {
      return path;
    }
    return null;
  }

}
