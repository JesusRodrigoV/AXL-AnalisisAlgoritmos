import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  signal,
  ViewChild,
} from '@angular/core';
import {
  FormGroup,
  FormControl,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { HttpErrorResponse } from '@angular/common/http';
import katex from 'katex';
import 'katex/dist/katex.min.css';

@Component({
  selector: 'app-procesar-laplace',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule
  ],
  templateUrl: './procesar-laplace.component.html',
  styleUrl: './procesar-laplace.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProcesarLaplaceComponent {
 private http = inject(HttpClient);

  @ViewChild('katexContainer') katexContainer!: ElementRef;

  laplaceForm = new FormGroup({
    formula: new FormControl('exp(-a*t)*sin(w*t)', [
      Validators.required,
      Validators.pattern(/^[a-zA-Z0-9\s\+\-\*\/\(\)\^\.]+$/),
    ]),
  });

  resultados = signal<{
    formulaOriginal: string;
    transformada: string;
    latex: string;
  } | null>(null);
  error = signal<string | null>(null);

  renderKatex(latex: string) {
    if (!this.katexContainer) return;
    
    try {
      katex.render(latex, this.katexContainer.nativeElement, {
        throwOnError: false,
        displayMode: true
      });
    } catch (e) {
      console.error('Error rendering KaTeX:', e);
    }
  }

  enviarDatos() {
    if (this.laplaceForm.invalid) {
      this.error.set('Fórmula inválida. Use solo letras, números y operadores básicos.');
      return;
    }

    const payload = {
      formula: this.laplaceForm.value.formula!,
    };

    this.http.post('http://localhost:3000/procesar-laplace', payload).subscribe({
      next: (response: any) => {
        this.resultados.set(response);
        this.error.set(null);
        if (response.latex) {
          // Usamos setTimeout para asegurar que la vista se haya actualizado
          setTimeout(() => this.renderKatex('F(s) = ' + response.latex), 0);
        }
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(err.error?.error || 'Error al procesar la fórmula');
        this.resultados.set(null);
      }
    });
  }
}
