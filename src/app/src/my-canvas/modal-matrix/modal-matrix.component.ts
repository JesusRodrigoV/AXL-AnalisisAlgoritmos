import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogTitle,
} from '@angular/material/dialog';
import { AdjacencyMatrixComponent } from '@app/src/adjacency-matrix';

@Component({
  selector: 'app-modal-matrix',
  imports: [
    MatButtonModule,
    MatDialogActions,
    MatDialogClose,
    MatDialogTitle,
    MatDialogContent,
    AdjacencyMatrixComponent,
  ],
  templateUrl: './modal-matrix.component.html',
  styleUrl: './modal-matrix.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModalMatrixComponent {}
