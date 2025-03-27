import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { log } from 'console';
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
  rows: number = 0;
  cols: number = 0;
  matrix: number[][] = []; //Matriz para interfaz de costos
  supply: number[] = []; //Valores de supply
  supplyN: number[] = []; //Copia de oferta para trabajar northwest
  demand: number[] = [];  //Valores de demand
  demandN: number[] = []; //Copia de demanda para trabajar northwest
  solutionNW: number[][] = []; //Solucion despues de NorthWest
  solution: number[][] = []; //Solucion despues de MODI
  costMatrix: number[][] = []; //Matriz de costos (copia para evitar cambios)
  iterationModi: number = 1; //Numero de iteraciones( asumimos que northwest siempre es 1 solucion minimo)
  costoSolution: number = 0; //Costo final de la solucion

  showResults: boolean = false; //Variable de visualizacion

  ngOnInit(): void {
    this.initializeMatrix();
  }

  initializeMatrix() {
    this.matrix = Array.from({ length: this.rows }, () => Array(this.cols).fill(0));
    this.supply = Array(this.rows).fill(0);
    this.demand = Array(this.cols).fill(0);
    this.solution = Array.from({ length: this.supply.length }, () => Array(this.demand.length).fill(0));
    this.solutionNW = Array.from({ length: this.supply.length }, () => Array(this.demand.length).fill(0));
    this.costMatrix = Array.from({ length: this.supply.length }, () => Array(this.demand.length).fill(0));
    /*
    this.setMatrix([
      [17, 20, 13, 12],
      [15, 21, 26, 25],
      [15, 14, 15, 17]
    ]);
    this.supply = [70, 90, 115];
    this.demand = [50, 60, 70, 95];
    this.supplyN =  [...this.supply];
    this.demandN =  [...this.demand];*/
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

  solveMin() {
    this.setCostMatrix(this.matrix);
    this.supplyN =  [...this.supply];
    this.demandN =  [...this.demand];
    console.log("Aplicando método Northwest Corner...");
    this.northwestCornerMin();
    this.solutionNW = this.solution.map(row => [...row]);
    console.log(`Matriz de asignación inicial:  ${this.solution}`);
    console.log("Costo inicial:", this.calculateTotalCost());
    console.log("Optimizando con método MODI...");
    console.log(`Matriz de solucion:  ${this.solution}`);
    this.optimizeMODI();
    console.log("Matriz optimizada:", this.solution);
    //console.log(`Matriz de solucion:  ${this.solution}`);
    console.log("Costo mínimo obtenido:", this.calculateTotalCost());
    this.costoSolution = this.calculateTotalCost();
    this.showResults = true;
  }

  solveMax() {
    this.setCostMatrix(this.matrix);
    this.supplyN =  [...this.supply];
    this.demandN =  [...this.demand];
    console.log("Aplicando método Northwest Corner...");
    this.northwestCornerMax();
    this.solutionNW = this.solution.map(row => [...row]);
    console.log(`Matriz de asignación inicial:  ${this.solution}`);
    console.log("Costo inicial:", this.calculateTotalCost());
    console.log("Optimizando con método MODI...");
    console.log(`Matriz de solucion:  ${this.solution}`);
    this.prepareCostMatrixForMODI()
    this.optimizeMODI();
    console.log("Matriz optimizada:", this.solution);
    console.log(`Matriz de solucion:  ${this.solution}`);
    console.log("Costo mínimo obtenido:", this.calculateTotalCost());
    this.costoSolution = this.calculateTotalCost() * -1;
    this.showResults = true;
  }

  solveMaxWithInversion() {
    this.setCostMatrix(this.matrix);
    this.supplyN =  [...this.supply];
    this.demandN =  [...this.demand];
    console.log("Aplicando método Northwest Corner...");
    this.prepareCostMatrixForMODI()
    this.northwestCornerMin();
    this.solutionNW = this.solution.map(row => [...row]);
    console.log(`Matriz de asignación inicial:  ${this.solution}`);
    console.log("Costo inicial:", this.calculateTotalCost());
    console.log("Optimizando con método MODI...");
    console.log(`Matriz de solucion:  ${this.solution}`);
    this.optimizeMODI();
    console.log("Matriz optimizada:", this.solution);
    console.log(`Matriz de solucion:  ${this.solution}`);
    console.log("Costo mínimo obtenido:", this.calculateTotalCost());
    this.costoSolution = this.calculateTotalCost() * -1;
    this.showResults = true;
  }

  northwestCornerMin() {
    let i = 0, j = 0, iteration = 0;
    this.solution = Array.from({ length: this.supplyN.length }, () => Array(this.demandN.length).fill(0));
    while (i < this.supplyN.length && j < this.demandN.length) {
      iteration++;
      if (this.supplyN[i] === 0) {
        i++;
        continue;
      }

      if (this.demandN[j] === 0) {
        j++;
        continue;
      }

      const qty = Math.min(this.supplyN[i], this.demandN[j]);

      this.solution[i][j] = qty;

      this.supplyN[i] -= qty;
      this.demandN[j] -= qty;
      console.log(`Numero de iteraciones de NorthWest: ${this.solution}`);
    }

    console.log("Numero de iteraciones de NorthWest: "+iteration);
  }

  northwestCornerMax() {
    this.solution = Array.from({ length: this.supplyN.length }, () => Array(this.demandN.length).fill(0));
    let iteration = 0;
    while (true) {
      let maxCostCell = { i: -1, j: -1, cost: -Infinity };

      // Buscar la celda con el costo más alto
      for (let x = 0; x < this.supplyN.length; x++) {
        for (let y = 0; y < this.demandN.length; y++) {
          if (this.supplyN[x] > 0 && this.demandN[y] > 0 && this.costMatrix[x][y] > maxCostCell.cost) {
            maxCostCell = { i: x, j: y, cost: this.costMatrix[x][y] };
          }
        }
      }

      // Si no hay más celdas para asignar, terminar
      if (maxCostCell.i === -1) break;
      iteration++;
      // Asignar la cantidad mínima entre oferta y demanda
      const qty = Math.min(this.supplyN[maxCostCell.i], this.demandN[maxCostCell.j]);
      this.solution[maxCostCell.i][maxCostCell.j] = qty;

      // Actualizar ofertas y demandas
      this.supplyN[maxCostCell.i] -= qty;
      this.demandN[maxCostCell.j] -= qty;
    }
    console.log("Numero de iteraciones de NorthWest: "+iteration);
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

  prepareCostMatrixForMODI() {
    this.costMatrix = this.costMatrix.map(row => row.map(val => -val));
  }

  // Método MODI para optimización
  optimizeMODI() {
    let matrixCostUV = this.costMatrix.map(row => [...row]);
    let matrixCostCopy = this.costMatrix.map(row => [...row]);
    let matrixMinCost = this.costMatrix.map(row => [...row]);
    let iteration = 0;
    let negativeValue = true;
    while (true) {
      iteration++;
      const rows = this.supply.length;
      const cols = this.demand.length;
      let u = Array(rows).fill(null);
      let v = Array(cols).fill(null);
      let pending = new Set<number>();
      v[0] = 0; // Empezamos con u[0]=0
      negativeValue=false;
      // 1. Calcular los potenciales U y V
      // Agregar todas las filas y columnas al conjunto de pendientes
      for (let i = 0; i < rows; i++) pending.add(i);
      for (let j = 0; j < cols; j++) pending.add(rows + j);

      let updated = true;
      //console.log(matrixCostUV);
      while (updated) {
        updated = false;
        for (let i = 0; i < rows; i++) {
          for (let j = 0; j < cols; j++) {
            if (this.solution[i][j] > 0) { // Solo celdas con asignación
              if (u[i] != null && v[j] == null) {
                v[j] = matrixCostUV[i][j] - u[i];
                //pending.delete(rows + j);
                updated = true;
              } else if (u[i] == null && v[j] != null) {
                u[i] = matrixCostUV[i][j] - v[j];
                //pending.delete(i);
                updated = true;
              }
            }
          }
        }
      }

      // Verificar si quedaron valores sin definir (posible degeneración)
      if (pending.size > 0) {
        //console.warn("¡Advertencia! No se pudieron calcular algunos valores de U o V.");
      }
      //console.log(`U value: ${u}`)
      //console.log(`V value: ${v}`)

      // 2.1 Llenar la matriz de costos minimo
      for(let i=0;i<rows; i++){
        for(let j=0;j<cols; j++){
            matrixMinCost[i][j]=u[i]+v[j];
        }
      }

      //console.log(`Matiz Zij value: ${matrixMinCost}`);

      // 2.2 Obtener matriz resultante de costMatrix - matrixMinCost
      let matixCostAux = matrixCostCopy.map(row => [...row]);
      for(let i=0;i<rows; i++){
        for(let j=0;j<cols; j++){
          matixCostAux[i][j]-=matrixMinCost[i][j];
        }
      }
      //console.log(`Matiz Cij - Zij value: ${matixCostAux}`);

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
        //console.log(`Iteración ${iteration}: No se encontró una mejor solución.`);
        break;
      }
      //console.log(`Iteración ${iteration}: Mejorando solución con la celda (${positionOfMin[0]}, ${positionOfMin[1]})`);
      // 2.5 Crear un ciclo cerrado para luego sumar
      let cicloCerrado = this.findCycle(positionOfMin[0],positionOfMin[1]);

      // 2.6 Aplicacion del ciclo
      if(cicloCerrado!= null){
        this.applyCycle(cicloCerrado)
      }else{
        console.log("No se encontró un ciclo válido.");
      }

      //console.log(`Matriz de solucion:  ${this.solution}`);
      if(iteration>100){
        iteration-=100;
        break;
      }
    }
    console.log("Numero de iteraciones de MODI: "+iteration);
    this.iterationModi = iteration+1;
  }


  // Método para encontrar el ciclo cerrado
  findCycle(startI: number, startJ: number): [number, number][] | null {
    const rows = this.solution.length;
    const cols = this.solution[0].length;
    let path: [number, number][] = [];
    let visited = new Set<string>();

    let uniqueRows = new Set<number>();
    let uniqueCols = new Set<number>();

    const dfs = (i: number, j: number, lastDir: 'row' | 'col' | null): boolean => {
        if (path.length >= 4 && i === startI && j === startJ) {
            if (uniqueRows.size > 1 && uniqueCols.size > 1) return true;
            return false;
        }

        // Explorar en la misma fila
        if (lastDir !== 'row') {
            for (let y = 0; y < cols; y++) {
                if (y === j) continue;
                if (i === startI && y === startJ && path.length >= 3) {
                    path.push([i, y]);
                    return true;
                }
                let key = `${i},${y}`;
                if (!visited.has(key) && this.solution[i][y] > 0) {
                    path.push([i, y]);
                    visited.add(key);
                    uniqueCols.add(y);

                    if (dfs(i, y, 'row')) return true;

                    path.pop();
                    visited.delete(key);
                    if (!path.some(p => p[1] === y)) uniqueCols.delete(y);
                }
            }
        }

        // Explorar en la misma columna
        if (lastDir !== 'col') {
            for (let x = 0; x < rows; x++) {
                if (x === i) continue;
                if (x === startI && j === startJ && path.length >= 3) {
                    path.push([x, j]);
                    return true;
                }
                let key = `${x},${j}`;
                if (!visited.has(key) && this.solution[x][j] > 0) {
                    path.push([x, j]);
                    visited.add(key);
                    uniqueRows.add(x);

                    if (dfs(x, j, 'col')) return true;

                    path.pop();
                    visited.delete(key);
                    if (!path.some(p => p[0] === x)) uniqueRows.delete(x);
                }
            }
        }

        return false;
    };

    // Iniciar DFS desde la celda inicial
    let startKey = `${startI},${startJ}`;
    path.push([startI, startJ]);
    visited.add(startKey);
    uniqueRows.add(startI);
    uniqueCols.add(startJ);

    if (dfs(startI, startJ, null)) return path;

    return null;
  }

  applyCycle(cycle: [number, number][]): void {
    if (!cycle || cycle.length < 4) {
        //console.log("No se encontró un ciclo válido.");
        return;
    }
    cycle.reverse();
    //console.log(`Ciclo encontrado:`+cycle);
    let minValue = Infinity;  // Valor mínimo en posiciones de resta

    // 1. Identificar las posiciones de suma (+) y resta (-)
    for (let step = 1; step < cycle.length; step += 2) {
        const [i, j] = cycle[step];  // Posiciones de resta (-)
        minValue = Math.min(minValue, this.solution[i][j]);

    }
    //console.log(`Valor minimo: ${minValue}`);

    // 2. Aplicar los cambios en la matriz
    for (let step = 0; step < cycle.length-1; step++) {
        const [i, j] = cycle[step];
        if (step % 2 === 0) {
            this.solution[i][j] += minValue;  // Sumar en posiciones pares
        } else {
            this.solution[i][j] -= minValue;  // Restar en posiciones impares
        }
    }

    //console.log("Nueva solución después de aplicar el ciclo:", this.solution);
  }
}
