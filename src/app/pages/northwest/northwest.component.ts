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
  rows: number = 2;
  cols: number = 2;
  matrix: number[][] = [];
  supply: number[] = [];
  demand: number[] = [];
  solution: number[][] = [];
  minimize: boolean = true; // Variable para almacenar el modo seleccionado

  ngOnInit(): void {
    this.initializeMatrix();
  }

  initializeMatrix() {
    if (this.rows > 0 && this.cols > 0) {
      this.matrix = Array.from({ length: this.rows }, () => Array(this.cols).fill(0));
      this.solution = Array.from({ length: this.rows }, () => Array(this.cols).fill(0));
      this.supply = Array(this.rows).fill(0);
      this.demand = Array(this.cols).fill(0);
    }
  }

  trackByIndex(index: number, obj: any): any {
    return index;
  }

  solve() {
    //this.initializeMatrix()
    this.northwestMethod();
    this.optimizeSolution();
  }

  northwestMethod() {
    const supply = [...this.supply];
    const demand = [...this.demand];
    this.solution = Array.from({ length: this.rows }, () => Array(this.cols).fill(0));

    let i = 0, j = 0;

    while (i < this.rows && j < this.cols) {
      const quantity = Math.min(supply[i], demand[j]);
      this.solution[i][j] = quantity;
      supply[i] -= quantity;
      demand[j] -= quantity;

      if (supply[i] === 0) i++;
      if (demand[j] === 0) j++;
    }
  }

  optimizeSolution() {
    for (let i = 0; i < this.rows; i++) {
      for (let j = 0; j < this.cols; j++) {
        if (this.solution[i][j] === 0) {
          this.adjustSolution(i, j, this.minimize);
        }
      }
    }
  }

  adjustSolution(row: number, col: number, minimize: boolean) {
    const path = this.findCycle(row, col);
    if (!path.length) return;

    let minValue = Infinity;
    for (let [r, c] of path.filter((_, idx) => idx % 2 !== 0)) {
      minValue = Math.min(minValue, this.solution[r][c]);
    }

    if (!minimize) minValue *= -1; // Invertir el ajuste para maximización

    for (let i = 0; i < path.length; i++) {
      const [r, c] = path[i];
      if (i % 2 === 0) {
        this.solution[r][c] += minValue;
      } else {
        this.solution[r][c] -= minValue;
      }
    }
  }

  findCycle(startRow: number, startCol: number): [number, number][] {
    const path: [number, number][] = [];
    const visited = new Set<string>();

    const dfs = (r: number, c: number, direction: 'row' | 'col'): boolean => {
      const key = `${r},${c}`;
      if (visited.has(key)) return false;
      visited.add(key);
      path.push([r, c]);

      if (path.length > 3 && path[0][0] === r && path[0][1] === c) {
        return true;
      }

      if (direction === 'row') {
        for (let j = 0; j < this.cols; j++) {
          if (j !== c && this.solution[r][j] > 0) {
            if (dfs(r, j, 'col')) return true;
          }
        }
      } else {
        for (let i = 0; i < this.rows; i++) {
          if (i !== r && this.solution[i][c] > 0) {
            if (dfs(i, c, 'row')) return true;
          }
        }
      }

      path.pop();
      return false;
    };

    dfs(startRow, startCol, 'row');
    dfs(startRow, startCol, 'col');

    return path.length > 3 ? path : [];
  }
}
