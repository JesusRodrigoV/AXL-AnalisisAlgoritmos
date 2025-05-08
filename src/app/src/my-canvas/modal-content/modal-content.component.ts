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
import {
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  NgForm,
  Validators,
} from '@angular/forms';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modal-content',
  imports: [
    FormsModule,
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
  mostrarPesoInverso = false;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<ModalContentComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      peso: number;
      dirigido: boolean;
      showBidirectionalOption: boolean;
      isNode: boolean;
    },
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
      dirigido: [data.dirigido || false],
      bidireccional: [false],
      pesoInverso: [''],
    });

    this.form.get('bidireccional')?.valueChanges.subscribe((val) => {
      this.mostrarPesoInverso = val;
      if (val) {
        this.form.get('pesoInverso')?.setValidators([
          Validators.required,
          Validators.pattern(/^-?\d*\.?\d+$/),
          Validators.min(Number.MIN_SAFE_INTEGER),
          Validators.max(Number.MAX_SAFE_INTEGER),
        ]);
      } else {
        this.form.get('pesoInverso')?.clearValidators();
        this.form.get('pesoInverso')?.setValue('');
      }
      this.form.get('pesoInverso')?.updateValueAndValidity();
    });
  }

  onSave(): void {
    this.enviado = true;

    if (this.form.invalid) {
      return;
    }

    const formValue = {
      peso: Number(this.form.get('peso')?.value),
      dirigido: this.form.get('dirigido')?.value === true,
      bidireccional: this.form.get('bidireccional')?.value === true,
      pesoInverso: this.form.get('bidireccional')?.value ? Number(this.form.get('pesoInverso')?.value) : undefined,
    };

    this.dialogRef.close(formValue);
  }

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

  onNoClick(): void {
    this.dialogRef.close();
  }
}
