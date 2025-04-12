import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { HelpContent } from '@app/models/Help.model';
import { HelpButtonComponent } from '@app/src/help-button';

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
    HelpButtonComponent,
  ],
  templateUrl: './northwest.component.html',
  styleUrls: ['./northwest.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class NorthwestComponent {
  private readonly ASSETS_PATH = 'assets/help/northwest/';
  helpContent: HelpContent = {
    title: 'Método de la Esquina Noroeste',
    description:
      'El método de la esquina noroeste es una técnica utilizada para encontrar una solución inicial factible en problemas de transporte. Este método asigna valores comenzando desde la esquina superior izquierda (noroeste) de la matriz de costos.',
    steps: [
      {
        number: 1,
        title: 'Configuración Inicial',
        description:
          'Ingresa el número de proveedores (filas) y destinos (columnas) para crear la matriz de costos. Puedes personalizar los nombres de proveedores y destinos.',
        image: `${this.ASSETS_PATH}northwest-step1.png`,
      },
      {
        number: 2,
        title: 'Matriz de Costos',
        description:
          'Completa la matriz con los costos de transporte entre cada proveedor y destino. Ingresa las ofertas (capacidades de los proveedores) y demandas (necesidades de los destinos).',
        image: `${this.ASSETS_PATH}northwest-step2.png`,
      },
      {
        number: 3,
        title: 'Selección del Modo',
        description:
          'Elige entre minimizar costos o maximizar ganancias según tu objetivo:\n- Minimizar Costos: Para encontrar la solución más económica\n- Maximizar Ganancias: Para obtener el mayor beneficio posible',
      },
      {
        number: 4,
        title: 'Interpretación de Resultados',
        description:
          'El sistema mostrará dos soluciones:\n1. Solución inicial por el método Northwest\n2. Solución optimizada utilizando el método MODI',
      },
    ],
    tips: [
      'Los costos deben ser números positivos para\nminimización y representar ganancias para maximización',
      'La solución optimizada siempre será igual o mejor\nque la solución inicial Northwest',
      'Puedes nombrar tus proveedores y destinos\npara una mejor identificación',
    ],
    images: [
      {
        url: `${this.ASSETS_PATH}northwest-matrix.png`,
        caption: 'Ejemplo de matriz de costos completada',
        alt: 'Matriz de costos del método Northwest',
      },
      {
        url: `${this.ASSETS_PATH}northwest-solution.png`,
        caption: 'Visualización de la solución optimizada',
        alt: 'Solución optimizada del método Northwest',
      },
    ] /*
    videos: [
      {
        url: 'https://www.youtube.com/watch?v=northwest-tutorial',
        title: 'Tutorial: Método de la Esquina Noroeste',
        thumbnail: 'assets/help/tutorial-thumb.png',
      },
    ],*/,
  };
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

  promptExportFileName() {
    const filename = prompt(
      '¿Con qué nombre deseas guardar el archivo?',
      'mi-matriz.json',
    );
    if (filename) {
      this.exportDataToJson(
        filename.endsWith('.json') ? filename : `${filename}.json`,
      );
    }
  }

  exportDataToJson(filename: string = 'mi-matriz.json') {
    const data = {
      rows: this.rows,
      cols: this.cols,
      matrix: this.matrix,
      supply: this.supply,
      demand: this.demand,
      providerNames: this.providerNames,
      destinationNames: this.destinationNames,
      solution: this.solution,
      solutionNW: this.solutionNW,
      costMatrix: this.costMatrix,
    };

    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  @ViewChild('fileInput', { static: false }) fileInput!: ElementRef;

  triggerFileInput() {
    this.fileInput.nativeElement.click();
  }

  importDataFromJson(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonData = JSON.parse(e.target?.result as string);
        // Asegúrate de tener estos atributos definidos en tu clase
        this.rows = jsonData.rows;
        this.cols = jsonData.cols;
        this.matrix = jsonData.matrix;
        this.supply = jsonData.supply;
        this.demand = jsonData.demand;
        this.providerNames = jsonData.providerNames;
        this.destinationNames = jsonData.destinationNames;
        this.solution = jsonData.solution;
        this.solutionNW = jsonData.solutionNW;
        this.costMatrix = jsonData.costMatrix;
        this.cdr.detectChanges();
      } catch (err) {
        console.error('Error al leer el archivo JSON', err);
        alert('Archivo inválido');
      }
    };
    reader.readAsText(file);
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
    let filasCostMatrix = this.costCopyMatrix.length; // Filas de costCopyMatrix
    let columnasCostMatrix = this.costCopyMatrix[0].length; // Columnas de costCopyMatrix

    for (let i = 0; i < this.solution.length; i++) {
      for (let j = 0; j < this.solution[i].length; j++) {
        let costo =
          i < filasCostMatrix && j < columnasCostMatrix
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

      if (pending.size > 0) {
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
      this.costMatrix.forEach((row) => row.push(0));
      this.solution.forEach((row) => row.push(diff));
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
      return;
    }
    cycle.reverse();
    let minValue = Infinity; // Valor mínimo en posiciones de resta

    // 1. Identificar las posiciones de suma (+) y resta (-)
    for (let step = 1; step < cycle.length; step += 2) {
      const [i, j] = cycle[step]; // Posiciones de resta (-)
      minValue = Math.min(minValue, this.solution[i][j]);
    }

    // 2. Aplicar los cambios en la matriz
    for (let step = 0; step < cycle.length - 1; step++) {
      const [i, j] = cycle[step];
      if (step % 2 === 0) {
        this.solution[i][j] += minValue; // Sumar en posiciones pares
      } else {
        this.solution[i][j] -= minValue; // Restar en posiciones impares
      }
    }
  }
}
