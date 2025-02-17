import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-ayuda',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ayuda.component.html',
  styleUrls: ['./ayuda.component.scss']
})
export class AyudaComponent {
  mostrarVentana: boolean = false;

  mostrarAyuda() {
    this.mostrarVentana = true;
  }

  cerrarVentana() {
    this.mostrarVentana = false;
  }
}