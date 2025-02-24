import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modal-content',
  imports: [
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatDialogClose,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    ReactiveFormsModule,
    CommonModule,
  ],
  templateUrl: './modal-content.component.html',
  styleUrl: './modal-content.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModalContentComponent {
  form: FormGroup;
  enviado = false;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<ModalContentComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { peso: number; dirigido: boolean },
  ) {
    this.form = this.fb.group({
      peso: [
        data.peso,
        [
          Validators.required,
          Validators.pattern(/^-?\d*\.?\d+$/),
          Validators.min(Number.MIN_SAFE_INTEGER),
          Validators.max(Number.MAX_SAFE_INTEGER),
        ],
      ],
      dirigido: [data.dirigido],
    });
  }

  onSave(): void {
    this.enviado = true;

    if (this.form.invalid) {
      return;
    }

    const formValue = this.form.value;
    formValue.peso = Number(formValue.peso); // Convertir a número
    this.dialogRef.close(formValue);
  }

  // Método helper para obtener mensajes de error
  getMensajeError(): string {
    const control = this.form.get('peso');

    if (!control?.errors || (!this.enviado && !control.touched)) {
      return '';
    }

    if (control.errors['required']) {
      return 'El peso es requerido';
    }
    if (control.errors['pattern']) {
      return 'El peso debe ser un número válido';
    }
    if (control.errors['min']) {
      return 'El peso es demasiado pequeño';
    }
    if (control.errors['max']) {
      return 'El peso es demasiado grande';
    }

    return 'Valor inválido';
  }
}
