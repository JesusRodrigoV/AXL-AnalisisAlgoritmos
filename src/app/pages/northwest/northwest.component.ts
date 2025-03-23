import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { min } from 'rxjs';

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
  supplyCopy: number[] = [];
  demand: number[] = [];
  demandN: number[] = [];
  solution: number[][] = [];
  costMatrix: number[][] = []; // Agregado para almacenar costos

  ngOnInit(): void {
    this.initializeMatrix();
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
    this.setMatrix([
      [17, 20, 13, 12],
      [15, 21, 26, 25],
      [15, 14, 15, 17]
    ]);
    this.supply = [70, 90, 115];
    this.demand = [50, 60, 70, 95];
    this.supplyN =  [...this.supply];
    this.demandN =  [...this.demand];
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
    console.log("Aplicando método Northwest Corner...");
    this.northwestCorner();
    console.log(`Matriz de asignación inicial:  ${this.solution}`);
    console.log("Costo inicial:", this.calculateTotalCost());

    console.log("Optimizando con método MODI...");
    console.log(`Matriz de solucion:  ${this.solution}`);
    this.optimizeMODI();
    console.log("Matriz optimizada:", this.solution);
    console.log(`Matriz de solucion:  ${this.solution}`);
    console.log("Costo mínimo obtenido:", this.calculateTotalCost());
  }

  northwestCorner() {
    let i = 0, j = 0;
    this.solution = Array.from({ length: this.supplyN.length }, () => Array(this.demandN.length).fill(0));

    console.log("Inicializando algoritmo");

    while (i < this.supplyN.length && j < this.demandN.length) {
      console.log(`i: ${i}, j: ${j}`);
      console.log(`SupplyN: ${this.supplyN[i]}`);
      console.log(`DemandN: ${this.demandN[j]}`);

      if (this.supplyN[i] === 0) {
        console.log("Suministro agotado, avanzando a la siguiente fila");
        i++;
        continue;
      }

      if (this.demandN[j] === 0) {
        console.log("Demanda satisfecha, avanzando a la siguiente columna");
        j++;
        continue;
      }

      const qty = Math.min(this.supplyN[i], this.demandN[j]);
      console.log(`Asignando cantidad: ${qty}`);

      this.solution[i][j] = qty;

      this.supplyN[i] -= qty;
      this.demandN[j] -= qty;

      console.log(`Suministro actualizado: ${this.supplyN[i]}`);
      console.log(`Demanda actualizada: ${this.demandN[j]}`);
    }
    console.log(`Matriz de solucion: ${this.solution}`);
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
    let matrixCostCopy = this.costMatrix.map(row => [...row]);  // Copia real
    let matrixMinCost = this.costMatrix.map(row => [...row]);   // Copia real
    let iteration = 0;
    let negativeValue = true;
    while (true) {
      iteration++;
      const rows = this.supply.length;
      const cols = this.demand.length;
      let u = Array(rows).fill(null);
      let v = Array(cols).fill(null);
      let pending = new Set<number>();
      u[0] = 0; // Empezamos con u[0]=0
      negativeValue=false;
      // 1. Calcular los potenciales U y V
      // Agregar todas las filas y columnas al conjunto de pendientes
      for (let i = 0; i < rows; i++) pending.add(i);
      for (let j = 0; j < cols; j++) pending.add(rows + j);

      let updated = true;
      while (updated) {
        updated = false;
        for (let i = 0; i < rows; i++) {
          for (let j = 0; j < cols; j++) {
            if (this.solution[i][j] > 0) { // Solo celdas con asignación
              if (u[i] !== null && v[j] === null) {
                v[j] = this.costMatrix[i][j] - u[i];
                pending.delete(rows + j);
                updated = true;
              } else if (u[i] === null && v[j] !== null) {
                u[i] = this.costMatrix[i][j] - v[j];
                pending.delete(i);
                updated = true;
              }
            }
          }
        }
      }

      // Verificar si quedaron valores sin definir (posible degeneración)
      if (pending.size > 0) {
        console.warn("¡Advertencia! No se pudieron calcular algunos valores de U o V.");
      }
      console.log(`U value: ${u}`)
      console.log(`V value: ${v}`)

      // 2.1 Llenar la matriz de costos minimo
      for(let i=0;i<rows; i++){
        for(let j=0;j<cols; j++){
            matrixMinCost[i][j]=u[i]+v[j];
        }
      }
      console.log(`Matiz Zij value: ${matrixMinCost}`);

      // 2.2 Obtener matriz resultante de costMatrix - matrixMinCost
      let matixCostAux = matrixCostCopy.map(row => [...row]);
      for(let i=0;i<rows; i++){
        for(let j=0;j<cols; j++){
          matixCostAux[i][j]-=matrixMinCost[i][j];
        }
      }
      console.log(`Matiz Cij - Zij value: ${matixCostAux}`);

      // 2.3 Buscar el valor mas pequenio
      let positionOfMin=[0, 0];
      let minCostValue = Infinity;
      for(let i=0;i<rows; i++){
        for(let j=0;j<cols; j++){
          if(negativeValue!==true && matixCostAux[i][j]<0){
            negativeValue=true;
          }
          if(matixCostAux[i][j]<minCostValue){
            minCostValue=matixCostAux[i][j];
            positionOfMin=[i, j];
          }
        }
      }

      if(!negativeValue){
        console.log(`Iteración ${iteration}: No se encontró una mejor solución.`);
        break;
      }

      // 2.5 Crear un ciclo cerrado para luego sumar
      let cicloCerrado = this.findCycle(positionOfMin[0],positionOfMin[1]);

      // 2.6 Aplicacion del ciclo
      if(cicloCerrado!= null){
        this.applyCycle(cicloCerrado)
      }

      console.log(`Iteración ${iteration}: Mejorando solución con la celda (${positionOfMin[0]}, ${positionOfMin[1]})`);
      console.log(`Matriz de solucion:  ${this.solution}`);
    }
  }


  // Método para encontrar el ciclo cerrado
  findCycle(startI: number, startJ: number): [number, number][] | null {
    const rows = this.solution.length;
    const cols = this.solution[0].length;
    let path: [number, number][] = [];
    let visited = new Set<string>();

    // Almacena filas y columnas visitadas para validar ciclos
    let uniqueRows = new Set<number>();
    let uniqueCols = new Set<number>();

    const dfs = (i: number, j: number, lastDir: 'row' | 'col' | null): boolean => {
        if (path.length >= 4 && i === startI && j === startJ) {
            // Un ciclo válido debe incluir al menos 2 filas y 2 columnas distintas
            if (uniqueRows.size > 1 && uniqueCols.size > 1) {
                return true;
            }
            return false;
        }

        // Explorar en la misma fila (horizontal)
        if (lastDir !== 'row') {
            for (let y = 0; y < cols; y++) {
                if (y === j) continue;
                if (i === startI && y === startJ && path.length >= 3) {
                    path.push([i, y]);
                    return true;
                }
                if (!visited.has(`${i},${y}`) && this.solution[i][y] > 0) {
                    path.push([i, y]);
                    visited.add(`${i},${y}`);
                    uniqueCols.add(y);
                    if (dfs(i, y, 'row')) return true;
                    path.pop();
                    visited.delete(`${i},${y}`);
                    if (path.length > 0) uniqueCols.delete(y);
                }
            }
        }

        // Explorar en la misma columna (vertical)
        if (lastDir !== 'col') {
            for (let x = 0; x < rows; x++) {
                if (x === i) continue;
                if (x === startI && j === startJ && path.length >= 3) {
                    path.push([x, j]);
                    return true;
                }
                if (!visited.has(`${x},${j}`) && this.solution[x][j] > 0) {
                    path.push([x, j]);
                    visited.add(`${x},${j}`);
                    uniqueRows.add(x);
                    if (dfs(x, j, 'col')) return true;
                    path.pop();
                    visited.delete(`${x},${j}`);
                    if (path.length > 0) uniqueRows.delete(x);
                }
            }
        }

        return false;
    };

    // Iniciar DFS desde la celda candidata
    path.push([startI, startJ]);
    visited.add(`${startI},${startJ}`);
    uniqueRows.add(startI);
    uniqueCols.add(startJ);

    if (dfs(startI, startJ, null)) {
        return path;
    }

    return null;
  }

  applyCycle(cycle: [number, number][]): void {
    if (!cycle || cycle.length < 4) {
        console.log("No se encontró un ciclo válido.");
        return;
    }

    let minValue = Infinity;  // Valor mínimo en posiciones de resta

    // 1. Identificar las posiciones de suma (+) y resta (-)
    for (let step = 1; step < cycle.length; step += 2) {
        const [i, j] = cycle[step];  // Posiciones de resta (-)
        minValue = Math.min(minValue, this.solution[i][j]);
    }

    // 2. Aplicar los cambios en la matriz
    for (let step = 0; step < cycle.length; step++) {
        const [i, j] = cycle[step];
        if (step % 2 === 0) {
            this.solution[i][j] += minValue;  // Sumar en posiciones pares
        } else {
            this.solution[i][j] -= minValue;  // Restar en posiciones impares
        }
    }

    console.log("Nueva solución después de aplicar el ciclo:", this.solution);
  }
}
