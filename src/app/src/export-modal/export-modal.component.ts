import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';

export type ExportType = 'json' | 'png';

@Component({
  selector: 'app-export-modal',
  imports: [
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatDialogClose,
    MatButtonModule,
  ],
  templateUrl: './export-modal.component.html',
  styleUrl: './export-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExportModalComponent {
  constructor(private dialogRef: MatDialogRef<ExportModalComponent>) {}

  selectFormat(format: ExportType) {
    this.dialogRef.close(format);
  }
}
