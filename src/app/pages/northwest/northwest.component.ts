import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';

@Component({
  selector: 'app-northwest',
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatTableModule,
  ],
  templateUrl: './northwest.component.html',
  styleUrls: ['./northwest.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class NorthwestComponent {
  private _rows: number = 0;
  private _cols: number = 0;
  matrix: number[][] = []; //Matriz para interfaz de costos

  get rows(): number {
    return this._rows;
  }

  set rows(value: number) {
    if (value !== this._rows) {
      this._rows = value;
      this.initializeMatrix();
      this.cdr.detectChanges();
    }
  }

  get cols(): number {
    return this._cols;
  }

  set cols(value: number) {
    if (value !== this._cols) {
      this._cols = value;
      this.initializeMatrix();
      this.cdr.detectChanges();
    }
  }

  constructor(private cdr: ChangeDetectorRef) {}
  supply: number[] = []; //Valores de supply
  supplyN: number[] = []; //Copia de oferta para trabajar northwest
  demand: number[] = []; //Valores de demand
  demandN: number[] = []; //Copia de demanda para trabajar northwest
  providerNames: string[] = []; // Nombres de los proveedores
  destinationNames: string[] = []; // Nombres de los destinos
  solutionNW: number[][] = []; //Solucion despues de NorthWest
  solution: number[][] = []; //Solucion despues de MODI
  costMatrix: number[][] = []; //Matriz de costos (copia para evitar cambios)
  iterationModi: number = 1; //Numero de iteraciones( asumimos que northwest siempre es 1 solucion minimo)
  costoSolution: number = 0; //Costo final de la solucion
  costoSolutionNW: number = 0;
  costCopyMatrix: number[][] = [];

  showResults: boolean = false; //Variable de visualizacion

  getTotalSupply(): number {
    return this.supply.reduce((acc, curr) => acc + (curr || 0), 0);
  }

  getTotalDemand(): number {
    return this.demand.reduce((acc, curr) => acc + (curr || 0), 0);
  }
  /*
  ngOnInit(): void {
    this.initializeMatrix();
  }*/

  initializeMatrix() {
    this.matrix = Array.from({ length: this.rows }, () =>
      Array(this.cols).fill(0),
    );
    this.supply = Array(this.rows).fill(0);
    this.demand = Array(this.cols).fill(0);
    this.providerNames = Array(this.rows)
      .fill('')
      .map((_, i) => `Proveedor ${i + 1}`);
    this.destinationNames = Array(this.cols)
      .fill('')
      .map((_, i) => `Destino ${i + 1}`);
    this.solution = Array.from({ length: this.supply.length }, () =>
      Array(this.demand.length).fill(0),
    );
    this.solutionNW = Array.from({ length: this.supply.length }, () =>
      Array(this.demand.length).fill(0),
    );
    this.costMatrix = Array.from({ length: this.supply.length }, () =>
      Array(this.demand.length).fill(0),
    );
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

  /*
  solveAlternativeMin(){
    this.setCostMatrix(this.matrix);
    this.supplyN = [...this.supply];
    this.demandN = [...this.demand];
    this._costos = this.costMatrix.map(row => [...row]);
    this.costCopyMatrix = [...this.costMatrix];
    this._oferta =  [...this.supply];
    this._demanda =  [...this.demand];
    this._asignacion = Array.from({ length: this.supply.length }, () =>
      Array(this.demand.length).fill(0),
    );
    this.ubicaciones = [];
    this.pv = false;
    let tipo = this.resolver(false);
    this.ajustarResultados(tipo);
    this.showResults = true;
    this.costMatrix = [...this.costCopyMatrix];
    console.log(this.calculateTotalCost());
    this.costoSolution = this.calculateTotalCost();
    console.log("Solucion min: " + JSON.stringify(this.solution));
    //this.calculateTotalCost()
  }

  solveAlternativeMax(){
    this.setCostMatrix(this.matrix);
    this.supplyN = [...this.supply];
    this.demandN = [...this.demand];
    this._costos = this.costMatrix.map(row => [...row]);
    this.costCopyMatrix = [...this.costMatrix];
    this._oferta =  [...this.supply];
    this._demanda =  [...this.demand];
    this._asignacion = Array.from({ length: this.rows }, () => Array(this.rows).fill(0));
    this.ubicaciones = [];
    this.pv = false;
    let tipo = this.resolver(true);
    this.ajustarResultados(tipo);
    this.showResults = true;
    this.costMatrix = [...this.costCopyMatrix];
    console.log(this.calculateTotalCost());
    this.costoSolution = this.calculateTotalCost();
    console.log("Solucion max: " + JSON.stringify(this.solution));
    //this.calculateTotalCost()
  }*/

  solveMin() {
    this.setCostMatrix(this.matrix);
    this.supplyN = [...this.supply];
    this.demandN = [...this.demand];
    this.costCopyMatrix = [...this.costMatrix];
    console.log('Aplicando método Northwest Corner...');
    this.northwestCornerMin();
    this.solutionNW = this.solution.map((row) => [...row]);
    console.log(`Matriz de asignación inicial:  ${this.solution}`);
    console.log('Costo inicial:', this.calculateTotalCost());
    console.log('Optimizando con método MODI...');
    console.log(`Matriz de solucion:  ${this.solution}`);
    this.optimizeMODI();
    console.log('Matriz optimizada:', this.solution);
    //console.log(`Matriz de solucion:  ${this.solution}`);
    console.log('Costo mínimo obtenido:', this.calculateTotalCost());

    this.costoSolution = this.calculateTotalCost();
    this.costoSolutionNW = this.calculateTotalCostNW();
    this.showResults = true;
  }

  solveMax() {
    this.setCostMatrix(this.matrix);
    this.supplyN = [...this.supply];
    this.demandN = [...this.demand];
    this.costCopyMatrix = [...this.costMatrix];
    console.log('Aplicando método Northwest Corner...');
    this.northwestCornerMax();
    this.solutionNW = this.solution.map((row) => [...row]);
    console.log(`Matriz de asignación inicial:  ${this.solution}`);
    console.log('Costo inicial:', this.calculateTotalCost());
    console.log('Optimizando con método MODI...');
    console.log(`Matriz de solucion:  ${this.solution}`);
    this.prepareCostMatrixForMODI();
    this.optimizeMODI();
    console.log('Matriz optimizada:', this.solution);
    console.log(`Matriz de solucion:  ${this.solution}`);
    console.log('Costo mínimo obtenido:', this.calculateTotalCost());
    this.costoSolution = this.calculateTotalCost();
    this.costoSolutionNW = this.calculateTotalCostNW();
    this.showResults = true;
  }

  solveMaxWithInversion() {
    this.setCostMatrix(this.matrix);
    this.supplyN = [...this.supply];
    this.demandN = [...this.demand];
    this.costCopyMatrix = [...this.costMatrix];
    console.log('Aplicando método Northwest Corner...');
    this.prepareCostMatrixForMODI();
    this.northwestCornerMin();
    this.solutionNW = this.solution.map((row) => [...row]);
    console.log(`Matriz de asignación inicial:  ${this.solution}`);
    console.log('Costo inicial:', this.calculateTotalCost());
    console.log('Optimizando con método MODI...');
    console.log(`Matriz de solucion:  ${this.solution}`);
    this.optimizeMODI();
    console.log('Matriz optimizada:', this.solution);
    console.log(`Matriz de solucion:  ${this.solution}`);
    console.log('Costo mínimo obtenido:', this.calculateTotalCost());
    this.costoSolution = this.calculateTotalCost();
    this.costoSolutionNW = this.calculateTotalCostNW();
    this.showResults = true;
  }

  northwestCornerMin() {
    let i = 0,
      j = 0,
      iteration = 0;
    this.solution = Array.from({ length: this.supplyN.length }, () =>
      Array(this.demandN.length).fill(0),
    );
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

    console.log('Numero de iteraciones de NorthWest: ' + iteration);
  }

  northwestCornerMax() {
    this.solution = Array.from({ length: this.supplyN.length }, () =>
      Array(this.demandN.length).fill(0),
    );
    let iteration = 0;
    while (true) {
      let maxCostCell = { i: -1, j: -1, cost: -Infinity };

      // Buscar la celda con el costo más alto
      for (let x = 0; x < this.supplyN.length; x++) {
        for (let y = 0; y < this.demandN.length; y++) {
          if (
            this.supplyN[x] > 0 &&
            this.demandN[y] > 0 &&
            this.costMatrix[x][y] > maxCostCell.cost
          ) {
            maxCostCell = { i: x, j: y, cost: this.costMatrix[x][y] };
          }
        }
      }

      // Si no hay más celdas para asignar, terminar
      if (maxCostCell.i === -1) break;
      iteration++;
      // Asignar la cantidad mínima entre oferta y demanda
      const qty = Math.min(
        this.supplyN[maxCostCell.i],
        this.demandN[maxCostCell.j],
      );
      this.solution[maxCostCell.i][maxCostCell.j] = qty;

      // Actualizar ofertas y demandas
      this.supplyN[maxCostCell.i] -= qty;
      this.demandN[maxCostCell.j] -= qty;
    }
    console.log('Numero de iteraciones de NorthWest: ' + iteration);
  }

  calculateTotalCost(): number {
    let totalCost = 0;
    let filasCostMatrix = this.costCopyMatrix.length;    // Filas de costCopyMatrix
    let columnasCostMatrix = this.costCopyMatrix[0].length; // Columnas de costCopyMatrix

    for (let i = 0; i < this.solution.length; i++) {
      for (let j = 0; j < this.solution[i].length; j++) {
        let costo = (i < filasCostMatrix && j < columnasCostMatrix)
          ? this.costCopyMatrix[i][j]
          : 0; // Si la fila o columna están fuera de costCopyMatrix, usa 0
        totalCost += (this.solution[i][j] || 0) * costo;
      }
    }

    return totalCost;
  }

  calculateTotalCostNW(): number {
    let totalCost = 0;
    for (let i = 0; i < this.solutionNW.length; i++) {
      for (let j = 0; j < this.solutionNW[i].length; j++) {
        if (
          this.solutionNW[i][j] !== undefined &&
          this.costMatrix[i][j] !== undefined
        ) {
          totalCost += this.solutionNW[i][j] * this.costMatrix[i][j];
        }
      }
    }
    return totalCost;
  }

  prepareCostMatrixForMODI() {
    this.costMatrix = this.costMatrix.map((row) => row.map((val) => -val));
  }

  // Método MODI para optimización
  optimizeMODI() {
    let matrixCostUV = this.costMatrix.map((row) => [...row]);
    let matrixCostCopy = this.costMatrix.map((row) => [...row]);
    let matrixMinCost = this.costMatrix.map((row) => [...row]);
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
      negativeValue = false;
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
            if (this.solution[i][j] > 0) {
              // Solo celdas con asignación
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

      // 2.1 Llenar la matriz de costos minimo
      for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
          matrixMinCost[i][j] = u[i] + v[j];
        }
      }

      //console.log(`Matiz Zij value: ${matrixMinCost}`);

      // 2.2 Obtener matriz resultante de costMatrix - matrixMinCost
      let matixCostAux = matrixCostCopy.map((row) => [...row]);
      for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
          matixCostAux[i][j] -= matrixMinCost[i][j];
        }
      }
      //console.log(`Matiz Cij - Zij value: ${matixCostAux}`);

      // 2.3 Buscar el valor mas pequenio
      let positionOfMin = [0, 0];
      let minCostValue = Infinity;
      for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
          if (negativeValue !== true && matixCostAux[i][j] < 0) {
            negativeValue = true;
          }
          if (matixCostAux[i][j] < minCostValue) {
            minCostValue = matixCostAux[i][j];
            positionOfMin = [i, j];
          }
        }
      }

      if (!negativeValue) {
        //console.log(`Iteración ${iteration}: No se encontró una mejor solución.`);
        break;
      }
      //console.log(`Iteración ${iteration}: Mejorando solución con la celda (${positionOfMin[0]}, ${positionOfMin[1]})`);
      // 2.5 Crear un ciclo cerrado para luego sumar
      let cicloCerrado = this.findCycle(positionOfMin[0], positionOfMin[1]);

      // 2.6 Aplicacion del ciclo
      if (cicloCerrado != null) {
        this.applyCycle(cicloCerrado);
      } else {
        console.log('No se encontró un ciclo válido.');
      }

      //console.log(`Matriz de solucion:  ${this.solution}`);
      if (iteration > 100) {
        iteration -= 100;
        break;
      }
    }

    this.checkAndBalance();
    console.log('Numero de iteraciones de MODI: ' + iteration);
    this.iterationModi = iteration + 1;
  }

  // Método para encontrar el ciclo cerrado
  findCycle(startI: number, startJ: number): [number, number][] | null {
    const rows = this.solution.length;
    const cols = this.solution[0].length;
    let path: [number, number][] = [];
    let visited = new Set<string>();

    let uniqueRows = new Set<number>();
    let uniqueCols = new Set<number>();

    const dfs = (
      i: number,
      j: number,
      lastDir: 'row' | 'col' | null,
    ): boolean => {
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
            if (!path.some((p) => p[1] === y)) uniqueCols.delete(y);
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
            if (!path.some((p) => p[0] === x)) uniqueRows.delete(x);
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

  checkAndBalance() {
    let totalSupply = this.supply.reduce((a, b) => a + b, 0);
    let totalDemand = this.demand.reduce((a, b) => a + b, 0);

    if (totalSupply > totalDemand) {
      let diff = totalSupply - totalDemand;
      this.demand.push(diff);
      this.costMatrix.forEach(row => row.push(0));
      this.solution.forEach(row => row.push(diff));
    } else if (totalDemand > totalSupply) {
      let diff = totalDemand - totalSupply;
      this.supply.push(diff);
      let newRow = new Array(this.demand.length).fill(0);
      newRow[newRow.length - 1] = diff;
      this.costMatrix.push(newRow);
      this.solution.push(newRow);
    }
  }

  applyCycle(cycle: [number, number][]): void {
    if (!cycle || cycle.length < 4) {
      //console.log("No se encontró un ciclo válido.");
      return;
    }
    cycle.reverse();
    //console.log(`Ciclo encontrado:`+cycle);
    let minValue = Infinity; // Valor mínimo en posiciones de resta

    // 1. Identificar las posiciones de suma (+) y resta (-)
    for (let step = 1; step < cycle.length; step += 2) {
      const [i, j] = cycle[step]; // Posiciones de resta (-)
      minValue = Math.min(minValue, this.solution[i][j]);
    }
    //console.log(`Valor minimo: ${minValue}`);

    // 2. Aplicar los cambios en la matriz
    for (let step = 0; step < cycle.length - 1; step++) {
      const [i, j] = cycle[step];
      if (step % 2 === 0) {
        this.solution[i][j] += minValue; // Sumar en posiciones pares
      } else {
        this.solution[i][j] -= minValue; // Restar en posiciones impares
      }
    }

    //console.log("Nueva solución después de aplicar el ciclo:", this.solution);
  }

/*
  // Define a Zero Position class


  // Global variables
  _costos: number[][] = [...this.costMatrix];
  _oferta: number[] =  [...this.supply];
  _demanda: number[] =  [...this.demand];
  _asignacion: number[][] = Array.from({ length: this.supply.length }, () =>
    Array(this.demand.length).fill(0),
  );
  ubicaciones: Ceros[] = [];
  pv: boolean = false;
  tipo: boolean = true;

  // Step 1: Column Reduction
  pasoUno(): void {
    for (let j = 0; j < this._costos[0].length; j++) {
        let minVal = Math.min(...this._costos.map(row => row[j]));

        for (let i = 0; i < this._costos.length; i++) {
            this._costos[i][j] -= minVal;
        }
    }
  }

  // Step 2: Row Reduction
  pasoDos(): void {
    for (let i = 0; i < this._costos.length; i++) {
        let minVal = Math.min(...this._costos[i]);

        for (let j = 0; j < this._costos[i].length; j++) {
            this._costos[i][j] -= minVal;
        }
    }
  }

  // Step 3: Identify Zero Positions
  pasoTres(): void {
    this.ubicaciones = []; // Reset zero positions
    for (let i = 0; i < this._costos.length; i++) {
        for (let j = 0; j < this._costos[i].length; j++) {
            if (this._costos[i][j] === 0) {
                if (!this.estaEnLista(i, j)) {
                    this.ubicaciones.push(new Ceros(i, j));
                } else {
                    this.tacharCero(i, j);
                }
            }
        }
    }
  }

  // Step 4: Assign Values Based on Supply and Demand
  pasoCuatro(): void {
    for (let i = 0; i < this.ubicaciones.length; i++) {
        let temp = this.ubicaciones[i];
        if (!temp.tachado) {
            let menor = Math.min(this._oferta[temp.x], this._demanda[temp.y]);
            if (menor !== 0) {
                this._asignacion[temp.x][temp.y] = menor;
                this._oferta[temp.x] -= menor;
                this._demanda[temp.y] -= menor;
            }
        }
    }
  }

  // Utility Functions
  estaEnLista(x: number, y: number): boolean {
    return this.ubicaciones.some(temp => temp.x === x && temp.y === y);
  }

  tacharCero(x: number, y: number): void {
    let cero = this.ubicaciones.find(temp => temp.x === x && temp.y === y);
    if (cero) cero.tachado = true;
  }

  // Find Minimum Non-Zero Value and Subtract from All Non-Zero Values
  restarMinimo(): void {
    let min = Infinity;
    for (let row of this._costos) {
        for (let val of row) {
            if (val !== 0 && val < min) {
                min = val;
            }
        }
    }

    for (let i = 0; i < this._costos.length; i++) {
        for (let j = 0; j < this._costos[i].length; j++) {
            if (this._costos[i][j] !== 0) {
                this._costos[i][j] -= min;
            }
        }
    }
  }

  // Main Algorithm Resolver
  resolver(tipo: boolean): number {
    let b = true;
    let opcion = 0;
    if (!tipo) {
        // In case of minimization
        console.log("Adjusting parameters for minimization...");
    }

    this.pasoUno();
    this.pasoDos();

    while (b) {
        opcion = this.pasoIteracion();
        if (opcion === 4) {
            this.pasoTres();
            this.pasoCuatro();
        } else {
            b = false;
        }
    }

    console.log("Final Cost Matrix: " + JSON.stringify(this._costos));
    return opcion;
  }

  // Iteration Step
  pasoIteracion(): number {
    let fOferta = this._oferta.reduce((a, b) => a + b, 0);
    let fDemanda = this._demanda.reduce((a, b) => a + b, 0);
    if (!this.tipo) {
      //cuando sea false será maximización
      this.ajustarParametros();
    }
    if (fOferta === 0 && fDemanda === 0) return 1;
    if (fOferta === 0 && fDemanda > 0) return 2;
    if (fDemanda === 0 && fOferta > 0) return 3;
    if (fDemanda > 0 && fOferta > 0) {
        if (!this.pv) {
            this.restarMinimo();
        } else {
            this.pv = false;
        }
        return 4;
    }
    return -1;
  }

  ajustarParametros() {
    //necesario para maximizar
    this._costos = [...this.costMatrix];
    for (let i = 0; i < this._costos.length; i++) {
      for (let j = 0; j < this._costos[i].length; j++) {
        this._costos[i][j] *= -1;
      }
    }
  }

  // Function to adjust results based on the given option
  ajustarResultados(opcion: number) {
    let asigMostrar: number[][] = [];
    let etFilas: string[] = [];
    let etColumnas: string[] = [];
    let etOfertas: number[] = [];
    let etDemandas: number[] = [];


    if (opcion === 2) {
        // 2 -> terminamos, pero la demanda está insatisfecha
        for (let lista of this._asignacion) {
            let nuevaLista = [...lista]; // Copiamos la lista
            asigMostrar.push(nuevaLista);
        }

        let nl: number[] = [];
        // Agregamos una fila de 0s por la demanda insatisfecha
        for (let i = 0; i < this._demanda.length; i++) {
            nl.push(this._demanda[i] !== 0 ? this._demanda[i] : 0);
        }
        asigMostrar.push(nl); // Matriz de asignación ajustada

        etFilas = [...this.providerNames, 'Fic']; // Etiquetas de oferta ajustada
        etOfertas = [...this._oferta, 0]; // Valor de oferta ajustado
        etColumnas = [...this.destinationNames];
        etDemandas = [...this._demanda];
        //this.rows++;

    } else if (opcion === 3) {
        // 3 -> terminamos, pero la oferta está insatisfecha
        let indices: number[] = [];

        for (let i = 0; i < this._oferta.length; i++) {
            if (this._oferta[i] !== 0) {
                indices.push(i);
            }
        }

        for (let lista of this._asignacion) {
            let nuevaLista = [...lista];
            asigMostrar.push(nuevaLista);
        }

        for (let i = 0; i < indices.length; i++) {
            for (let k = 0; k < asigMostrar.length; k++) {
                asigMostrar[k].push(k === indices[i] ? this._oferta[indices[i]] : 0);
            }
        } // Ajustamos para los insatisfechos

        etFilas = [...this.providerNames]; // Etiquetas de filas iguales
        etOfertas = [...this._oferta]; // Valores de oferta iguales
        etColumnas = [...this.destinationNames];
        etDemandas = [...this._demanda];

        for (let i = 0; i < indices.length; i++) {
            etColumnas.push('Fic');
            etDemandas.push(0);
        } // Etiquetas de columnas y valores de demanda ajustados
        //this.cols++;

    } else if (opcion === 1) {
        // Todo ajustado correctamente
        for (let lista of this._asignacion) {
            let nuevaLista = [...lista];
            asigMostrar.push(nuevaLista);
        }
        etFilas = [...this.providerNames];
        etColumnas = [...this.destinationNames];
        etOfertas = [...this._oferta];
        etDemandas = [...this._demanda];
    }

    this.solution = [...asigMostrar];
    this.demand = [...etDemandas];
    this.supply = [...etOfertas];
    this.providerNames = [...etFilas];
    this.destinationNames = [...etColumnas];
  }*/
}

class Ceros {
  constructor(public x: number, public y: number, public tachado: boolean = false) {}
}
