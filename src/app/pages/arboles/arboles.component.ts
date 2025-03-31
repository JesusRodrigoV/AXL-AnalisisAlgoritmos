import { Component, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { FormsModule } from '@angular/forms';


@Component({
  selector: 'app-arboles',
  templateUrl: './arboles.component.html',
  standalone: true, // importante
  imports: [FormsModule], // aquí importamos FormsModulegit
  styleUrls: ['./arboles.component.scss']
})
export default class ArbolesComponent implements AfterViewInit {
  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  preOrderInput = '';
  inOrderInput = '';
  postOrderInput = '';

  ngAfterViewInit() {
    this.drawInitialCanvas();
  }

  drawInitialCanvas() {
    const ctx = this.canvasRef.nativeElement.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, this.canvasRef.nativeElement.width, this.canvasRef.nativeElement.height);
      ctx.font = '20px Arial';
      ctx.fillStyle = 'black';
      ctx.fillText('Aquí se dibujará el árbol...', 250, 300);
    }
  }

  agregarNumero() {
    console.log('Agregar número');
    // aquí va tu lógica
  }

  generarRandom() {
    console.log('Generar random');
    // aquí va tu lógica
  }

  guardarPreOrder() {
    console.log('Preorden:', this.preOrderInput);
    // lógica para construir árbol desde preorden
  }

  guardarInOrder() {
    console.log('Inorden:', this.inOrderInput);
    // lógica para construir árbol desde inorden
  }

  guardarPostOrder() {
    console.log('Postorden:', this.postOrderInput);
    // lógica para construir árbol desde postorden
  }
}
