import {
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

export type SortAlgorithm = 'selection' | 'insertion' | 'shell' | 'merge';
export type InputMode = 'auto' | 'manual';
export type SortOrder = 'asc' | 'desc';

@Component({
  selector: 'app-sort-config',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './sort-config.component.html',
  styleUrls: ['./sort-config.component.scss'],
})
export class SortConfigComponent {
  @Input() selectedAlgorithm: SortAlgorithm = 'selection';
  @Input() arraySize = 20;
  @Input() minValue = 1;
  @Input() maxValue = 100;
  @Input() hValue = 10;
  @Input() sortOrder: SortOrder = 'asc';
  @Input() inputMode: InputMode = 'auto';
  @Input() manualInput = '';
  @Input() isSorting = false;

  @Output() selectedAlgorithmChange = new EventEmitter<SortAlgorithm>();
  @Output() arraySizeChange = new EventEmitter<number>();
  @Output() minValueChange = new EventEmitter<number>();
  @Output() maxValueChange = new EventEmitter<number>();
  @Output() hValueChange = new EventEmitter<number>();
  @Output() sortOrderChange = new EventEmitter<SortOrder>();
  @Output() inputModeChange = new EventEmitter<InputMode>();
  @Output() manualInputChange = new EventEmitter<string>();
  @Output() validationError = new EventEmitter<string>();

  sortOptions = [
    { value: 'asc', label: 'Menor a Mayor' },
    { value: 'desc', label: 'Mayor a Menor' },
  ];

  onAlgorithmChange(value: SortAlgorithm) {
    this.selectedAlgorithmChange.emit(value);
  }

  onInputModeChange(value: InputMode) {
    this.inputModeChange.emit(value);
  }

  onArraySizeChange(value: number) {
    this.arraySizeChange.emit(value);
  }

  onMinValueChange(value: number) {
    this.minValueChange.emit(value);
  }

  onMaxValueChange(value: number) {
    this.maxValueChange.emit(value);
  }

  onHValueChange(value: number) {
    this.hValueChange.emit(value);
  }

  onSortOrderChange(value: SortOrder) {
    this.sortOrderChange.emit(value);
  }

  onManualInputChange(value: string) {
    this.manualInputChange.emit(value);
  }

  validate(): boolean {
    if (this.minValue >= this.maxValue) {
      this.validationError.emit('El valor mínimo debe ser menor que el valor máximo');
      return false;
    }
    if (this.selectedAlgorithm === 'shell') {
      if (this.hValue <= 0 || this.hValue > this.arraySize) {
        this.validationError.emit('El valor de h debe ser mayor a 0 y menor o igual al tamaño del array');
        return false;
      }
    }
    return true;
  }

  parseManualValues(): number[] | null {
    if (!this.manualInput.trim()) {
      this.validationError.emit('Por favor ingrese valores');
      return null;
    }

    const values = this.manualInput
      .split(',')
      .map((val) => val.trim())
      .filter((val) => val !== '');

    if (values.length === 0) {
      this.validationError.emit('Por favor ingrese al menos un valor');
      return null;
    }

    const numbers = values.map((v) => Number(v));
    if (numbers.some(isNaN)) {
      this.validationError.emit('Todos los valores deben ser números válidos');
      return null;
    }

    return numbers;
  }
}
