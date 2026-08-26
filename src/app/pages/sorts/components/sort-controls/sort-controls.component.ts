import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatMenuModule } from '@angular/material/menu';

@Component({
  selector: 'app-sort-controls',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatButtonToggleModule, MatMenuModule],
  templateUrl: './sort-controls.component.html',
  styleUrls: ['./sort-controls.component.scss'],
})
export class SortControlsComponent {
  @Input() isSorting = false;
  @Input() isArrayEmpty = true;
  @Input() isPaused = false;
  @Input() speedMultiplier = 1;

  @Output() generate = new EventEmitter<void>();
  @Output() sort = new EventEmitter<void>();
  @Output() clear = new EventEmitter<void>();
  @Output() importFile = new EventEmitter<File>();
  @Output() exportFile = new EventEmitter<'json' | 'txt'>();
  @Output() speedChange = new EventEmitter<number>();

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.importFile.emit(input.files[0]);
      input.value = '';
    }
  }

  onSpeedChange(value: number) {
    this.speedChange.emit(value);
  }
}
