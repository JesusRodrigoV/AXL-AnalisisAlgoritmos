import { Component, OnInit, ViewChild, ElementRef, HostListener } from '@angular/core';
import { Nodo } from 'src/app/pages/johnson/models/nodo.model.jonson';
import { Conexion } from 'src/app/pages/johnson/models/conexion.model.jonson'; // Ruta correcta al modelo Conexion
import { ChangeDetectionStrategy } from '@angular/core';
@Component({
  selector: 'app-johnson-canvas',
  templateUrl: './johnson-canvas.component.html',
  styleUrls: ['./johnson-canvas.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JohnsonCanvasComponent implements OnInit {
  @ViewChild('johnsonCanvas', { static: true }) canvasRef: ElementRef<HTMLCanvasElement>;
  private ctx: CanvasRenderingContext2D;

  nodos: Nodo[] = []; // Lista de nodos
  conexiones: Conexion[] = []; // Lista de conexiones
  selectedNodo: Nodo | null = null; // Nodo seleccionado para crear conexiones

  ngOnInit(): void {
    const context = this.canvasRef.nativeElement.getContext('2d');
    if (context) {
      this.ctx = context; // Asignamos el contexto solo si no es null
      this.dibujarGrafo();
    } else {
      throw new Error('No se pudo obtener el contexto 2D del canvas.');
    }
  }


  // Dibuja todos los nodos y conexiones
  dibujarGrafo(): void {
    this.limpiarCanvas();

    // Dibujar conexiones
    this.conexiones.forEach((conexion) => {
      this.dibujarConexion(conexion);
    });

    // Dibujar nodos
    this.nodos.forEach((nodo) => {
      this.dibujarNodo(nodo);
    });
  }

  // Dibuja un nodo en el canvas
  dibujarNodo(nodo: Nodo): void {
    const radio = 20; // Radio del nodo
    const mitadY = nodo.y + radio / 2; // Línea divisoria en la mitad inferior

    // Dibujar el círculo completo
    this.ctx.beginPath();
    this.ctx.arc(nodo.x, nodo.y, radio, 0, Math.PI * 2);
    this.ctx.strokeStyle = 'black';
    this.ctx.stroke();

    // Dibujar la línea horizontal que divide el círculo en dos mitades
    this.ctx.beginPath();
    this.ctx.moveTo(nodo.x - radio, nodo.y);
    this.ctx.lineTo(nodo.x + radio, nodo.y);
    this.ctx.stroke();

    // Dibujar la línea vertical que divide la mitad inferior en dos partes
    this.ctx.beginPath();
    this.ctx.moveTo(nodo.x, nodo.y);
    this.ctx.lineTo(nodo.x, nodo.y + radio);
    this.ctx.stroke();

    // Dibujar la etiqueta del nodo
    this.ctx.fillStyle = 'black';
    this.ctx.font = '12px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(nodo.label, nodo.x, nodo.y - radio - 5);

    // Dibujar los tiempos de inicio y fin en las divisiones inferiores
    this.ctx.fillStyle = 'blue';
    this.ctx.font = '10px Arial';
    this.ctx.fillText(`Inicio: ${nodo.tiempoInicio}`, nodo.x - radio / 2, nodo.y + radio / 2 + 10);
    this.ctx.fillText(`Fin: ${nodo.tiempoFin}`, nodo.x + radio / 2, nodo.y + radio / 2 + 10);
  }

  // Dibuja una conexión entre dos nodos
  dibujarConexion(conexion: Conexion): void {
    this.ctx.beginPath();
    this.ctx.moveTo(conexion.origen.x, conexion.origen.y);
    this.ctx.lineTo(conexion.destino.x, conexion.destino.y);
    this.ctx.strokeStyle = 'red';
    this.ctx.stroke();

    // Dibujar peso de la conexión
    const midX = (conexion.origen.x + conexion.destino.x) / 2;
    const midY = (conexion.origen.y + conexion.destino.y) / 2;
    this.ctx.fillStyle = 'green';
    this.ctx.fillText(conexion.peso.toString(), midX, midY);
  }

  // Limpia el canvas
  limpiarCanvas(): void {
    this.ctx.clearRect(0, 0, this.canvasRef.nativeElement.width, this.canvasRef.nativeElement.height);
  }

  // Agrega un nodo en la posición (x, y)
  agregarNodo(x: number, y: number): void {
    const id = `nodo-${this.nodos.length + 1}`;
    const label = `Nodo ${this.nodos.length + 1}`;
    const nuevoNodo = new Nodo(id, x, y, label);
    this.nodos.push(nuevoNodo);
    this.dibujarGrafo();
  }

  // Agrega una conexión entre dos nodos
  agregarConexion(origen: Nodo, destino: Nodo, peso: number): void {
    const nuevaConexion = new Conexion(origen, destino, peso);
    this.conexiones.push(nuevaConexion);
    this.dibujarGrafo();
  }

  // Maneja el clic en el canvas
  @HostListener('click', ['$event'])
  onCanvasClick(event: MouseEvent): void {
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Verificar si se hizo clic en un nodo existente
    const nodoClicado = this.nodos.find((nodo) => {
      const distancia = Math.sqrt((nodo.x - x) ** 2 + (nodo.y - y) ** 2);
      return distancia <= 20; // Radio del nodo
    });

    if (nodoClicado) {
      if (this.selectedNodo) {
        // Si ya hay un nodo seleccionado, crear una conexión
        this.agregarConexion(this.selectedNodo, nodoClicado, 1); // Peso por defecto: 1
        this.selectedNodo = null;
      } else {
        // Seleccionar el nodo para crear una conexión
        this.selectedNodo = nodoClicado;
      }
    } else {
      // Si no se hizo clic en un nodo, agregar un nuevo nodo
      this.agregarNodo(x, y);
    }
  }
}