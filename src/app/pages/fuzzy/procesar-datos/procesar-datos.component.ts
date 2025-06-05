import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-procesar-datos',
  imports: [
    FormsModule,
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
  ],
  templateUrl: './procesar-datos.component.html',
  styleUrl: './procesar-datos.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProcesarDatosComponent {
  private http = inject(HttpClient);

  // Form group for 4 variables
  form = new FormGroup({
    variable1: new FormControl<number>(0, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(0), Validators.max(100)],
    }),
    variable2: new FormControl<number>(0, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(0), Validators.max(100)],
    }),
    variable3: new FormControl<number>(0, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(0), Validators.max(100)],
    }),
    variable4: new FormControl<number>(0, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(0), Validators.max(100)],
    }),
  });

  resultados = signal<any>(null);
  error = signal<string | null>(null);

  enviarDatos() {
    if (this.form.invalid) {
      this.error.set('Todas las variables deben estar entre 0 y 100');
      return;
    }

    const variables = [
      this.form.value.variable1!,
      this.form.value.variable2!,
      this.form.value.variable3!,
      this.form.value.variable4!,
    ];

    this.http.post('http://localhost:3000/procesar', { variables }).subscribe({
      next: (response: any) => {
        this.resultados.set(response);
        this.error.set(null);
      },
      error: (err: { error: { error: any } }) => {
        this.error.set(err.error?.error || 'Error al procesar los datos');
        this.resultados.set(null);
      },
    });
  }
}
