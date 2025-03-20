import { Component, AfterViewInit, ViewChild, ElementRef, HostListener } from '@angular/core';
import { Nodo } from 'src/app/pages/johnson/models/nodo.model.jonson';
import { Conexion } from 'src/app/pages/johnson/models/conexion.model.jonson';
import { CommonModule } from '@angular/common'; // Importa CommonModule
import { FormsModule } from '@angular/forms'; // Importa FormsModule

interface Actividad {
  nombre: string;
  secuencia: string;
  peso: number;
}

@Component({
  selector: 'app-johnson-canvas',
  standalone: true, // Indica que es un componente independiente
  imports: [CommonModule, FormsModule], // Importa CommonModule y FormsModule
  templateUrl: './johnson-canvas.component.html',
  styleUrls: ['./johnson-canvas.component.scss'],
})
export class JohnsonCanvasComponent implements AfterViewInit {
  @ViewChild('johnsonCanvas', { static: false }) canvas?: ElementRef<HTMLCanvasElement>;
  private ctx!: CanvasRenderingContext2D;
  private scale: number = 1;
  private offsetX: number = 0;
  private offsetY: number = 0;
  private isPanning: boolean = false;
  private startX: number = 0;
  private startY: number = 0;

  actividades: Actividad[] = [{ nombre: '', secuencia: '', peso: 0 }]; // Lista de actividades
  nodos: Nodo[] = []; // Lista de nodos
  conexiones: Conexion[] = []; // Lista de conexiones
  selectedNodo: Nodo | null = null; // Nodo seleccionado para crear conexiones

  ngAfterViewInit(): void {
    if (this.canvas?.nativeElement) {
      this.ctx = this.canvas.nativeElement.getContext('2d')!;
      this.setupCanvas();
    }
  }

  private setupCanvas(): void {
    if (!this.canvas) return;
    const canvasElement = this.canvas.nativeElement;
    canvasElement.width = window.innerWidth;
    canvasElement.height = window.innerHeight;
    this.redraw();
  }

  @HostListener('window:resize')
  onResize(): void {
    this.setupCanvas();
  }

  @HostListener('mousedown', ['$event'])
  onMouseDown(event: MouseEvent): void {
    this.isPanning = true;
    this.startX = event.clientX - this.offsetX;
    this.startY = event.clientY - this.offsetY;
  }

  @HostListener('mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    if (this.isPanning) {
      this.offsetX = event.clientX - this.startX;
      this.offsetY = event.clientY - this.startY;
      this.redraw();
    }
  }

  @HostListener('mouseup')
  onMouseUp(): void {
    this.isPanning = false;
  }

  @HostListener('wheel', ['$event'])
  onWheel(event: WheelEvent): void {
    event.preventDefault();
    const scaleAmount = event.deltaY > 0 ? 0.9 : 1.1;
    this.scale *= scaleAmount;
    this.redraw();
  }

  private redraw(): void {
    if (!this.canvas) return;
    this.ctx.setTransform(this.scale, 0, 0, this.scale, this.offsetX, this.offsetY);
    this.ctx.clearRect(-this.offsetX, -this.offsetY, this.canvas.nativeElement.width, this.canvas.nativeElement.height);
    this.dibujarGrafo(); // Redibujar el grafo después de limpiar el canvas
  }

  // Agrega una nueva actividad a la tabla
  agregarActividad(): void {
    this.actividades.push({ nombre: '', secuencia: '', peso: 0 });
  }

  // Genera el grafo a partir de la tabla
  generarGrafo(): void {
    this.nodos = [];
    this.conexiones = [];
  
    // Crear nodos únicos basados en la columna "Actividad"
    const nodosUnicos: { [key: string]: Nodo } = {};
  
    this.actividades.forEach((actividad) => {
      if (!nodosUnicos[actividad.nombre]) {
        const id = `nodo-${actividad.nombre}`;
        const label = actividad.nombre;
        const nuevoNodo = new Nodo(id, 0, 0, label); // Las coordenadas se ajustarán más tarde
        nodosUnicos[actividad.nombre] = nuevoNodo;
        this.nodos.push(nuevoNodo);
      }
  
      if (actividad.secuencia && !nodosUnicos[actividad.secuencia]) {
        const id = `nodo-${actividad.secuencia}`;
        const label = actividad.secuencia;
        const nuevoNodo = new Nodo(id, 0, 0, label); // Las coordenadas se ajustarán más tarde
        nodosUnicos[actividad.secuencia] = nuevoNodo;
        this.nodos.push(nuevoNodo);
      }
    });
  
    // Crear conexiones basadas en la columna "Secuencia"
    this.actividades.forEach((actividad) => {
      const origen = nodosUnicos[actividad.nombre];
      const destino = nodosUnicos[actividad.secuencia];
  
      if (origen && destino) {
        const nuevaConexion = new Conexion(origen, destino, actividad.peso);
        this.conexiones.push(nuevaConexion);
      }
    });
  
    // Ajustar las coordenadas de los nodos
    this.ajustarCoordenadas();
  
    // Dibujar el grafo
    this.dibujarGrafo();
  
    // Calcular la ruta crítica
    this.calcularRutaCritica();
  }

  // Ajusta las coordenadas de los nodos para que no se superpongan
  ajustarCoordenadas(): void {
    const espacioHorizontal = 200; // Aumentamos el espacio horizontal
    const espacioVertical = 120; // Aumentamos el espacio vertical
    const niveles: { [key: number]: Nodo[] } = {};
  
    // Asignar niveles a los nodos
    this.nodos.forEach((nodo) => {
      const nivel = this.obtenerNivel(nodo);
      if (!niveles[nivel]) {
        niveles[nivel] = [];
      }
      niveles[nivel].push(nodo);
    });
  
    // Ordenar nodos dentro de cada nivel según conexiones
  Object.keys(niveles).forEach((nivelStr) => {
    const nivel = parseInt(nivelStr, 10);
    const nodosEnNivel = niveles[nivel];
    nodosEnNivel.sort((a, b) => a.label.localeCompare(b.label)); // Orden alfabético
  });
  
  // Calcular las coordenadas de los nodos
  Object.keys(niveles).forEach((nivelStr) => {
    const nivel = parseInt(nivelStr, 10);
    const nodosEnNivel = niveles[nivel];
    const startY = (600 - (nodosEnNivel.length - 1) * espacioVertical) / 2; // Centrar verticalmente
    
    nodosEnNivel.forEach((nodo, index) => {
      nodo.x = 150 + nivel * espacioHorizontal; // Mover de izquierda a derecha
      nodo.y = startY + index * espacioVertical;
    });
  });
  }
  
  // Obtener el nivel de un nodo (basado en la distancia desde el inicio)
  obtenerNivel(nodo: Nodo): number {
    let nivel = 0;
    let actual: Nodo | null = nodo;
  
    while (actual) {
      const conexionesEntrantes = this.conexiones.filter((c) => c.destino.id === actual!.id);
      if (conexionesEntrantes.length > 0) {
        actual = conexionesEntrantes[0].origen;
        nivel++;
      } else {
        actual = null;
      }
    }
  
    return nivel;
  }

  // Calcula la ruta crítica
  calcularRutaCritica(): void {
    const tiemposTempranos: { [key: string]: number } = {};
    this.nodos.forEach((nodo) => (tiemposTempranos[nodo.id] = 0));

    this.conexiones.forEach((conexion) => {
      const tiempoLlegada = tiemposTempranos[conexion.origen.id] + conexion.peso;
      if (tiempoLlegada > tiemposTempranos[conexion.destino.id]) {
        tiemposTempranos[conexion.destino.id] = tiempoLlegada;
      }
    });

    const tiemposTardios: { [key: string]: number } = {};
    const ultimoNodo = this.nodos[this.nodos.length - 1];
    tiemposTardios[ultimoNodo.id] = tiemposTempranos[ultimoNodo.id];

    for (let i = this.nodos.length - 2; i >= 0; i--) {
      const nodo = this.nodos[i];
      tiemposTardios[nodo.id] = Infinity;

      this.conexiones.forEach((conexion) => {
        if (conexion.origen.id === nodo.id) {
          const tiempoSalida = tiemposTardios[conexion.destino.id] - conexion.peso;
          if (tiempoSalida < tiemposTardios[nodo.id]) {
            tiemposTardios[nodo.id] = tiempoSalida;
          }
        }
      });
    }

    this.conexiones.forEach((conexion) => {
      const holgura = tiemposTardios[conexion.destino.id] - (tiemposTempranos[conexion.origen.id] + conexion.peso);
      conexion.holgura = holgura;

      if (holgura === 0) {
        conexion.rutaCritica = true; // Marcar como ruta crítica
      }
    });

    this.dibujarGrafo();
  }

  // Dibuja todos los nodos y conexiones
  dibujarGrafo(): void {
    this.limpiarCanvas();

    this.conexiones.forEach((conexion) => {
      this.dibujarConexion(conexion);
    });

    this.nodos.forEach((nodo) => {
      this.dibujarNodo(nodo);
    });
  }

  // Dibuja un nodo en el canvas
  dibujarNodo(nodo: Nodo): void {
    const radio = 30;
    
    // Dibujar el círculo del nodo
    this.ctx.beginPath();
    this.ctx.arc(nodo.x, nodo.y, radio, 0, Math.PI * 2);
    this.ctx.strokeStyle = 'black';
    this.ctx.stroke();
    
    // Dibujar líneas divisorias para dividir en tres secciones
    this.ctx.beginPath();
    this.ctx.moveTo(nodo.x - radio, nodo.y);   // Desde la izquierda del círculo
    this.ctx.lineTo(nodo.x + radio, nodo.y);   // Hasta la derecha del círculo
    this.ctx.moveTo(nodo.x, nodo.y);   // Desde el centro
    this.ctx.lineTo(nodo.x, nodo.y + radio);   // Hasta la parte inferior del círculo
    this.ctx.stroke();

    // Mostrar la etiqueta dentro de la parte superior del nodo
    this.ctx.fillStyle = 'black';
    this.ctx.font = '14px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(nodo.label, nodo.x, nodo.y - radio / 2 + 5);
    
    // Mostrar valores en las dos secciones
    this.ctx.fillStyle = 'blue';
    this.ctx.font = '12px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(` ${nodo.tiempoInicio}`, nodo.x - radio / 3, nodo.y + radio / 2 + 5);
    
    this.ctx.fillStyle = 'red';
    this.ctx.fillText(` ${nodo.tiempoFin}`, nodo.x + radio / 3, nodo.y + radio / 2 + 5);
  }

  // Dibuja una conexión entre dos nodos
  dibujarConexion(conexion: Conexion): void {
    const origen = conexion.origen;
    const destino = conexion.destino;
    const radio = 30;
  
    // Calcular puntos de control para la curva
    const controlX1 = origen.x + (destino.x - origen.x) * 0.5;
    const controlY1 = origen.y;
    const controlX2 = origen.x + (destino.x - origen.x) * 0.5;
    const controlY2 = destino.y;
  
    // Dibujar la curva
    this.ctx.beginPath();
    this.ctx.moveTo(origen.x, origen.y);
    this.ctx.bezierCurveTo(controlX1, controlY1, controlX2, controlY2, destino.x, destino.y);
  
    if (conexion.rutaCritica) {
      this.ctx.strokeStyle = 'blue';
      this.ctx.lineWidth = 3;
    } else {
      this.ctx.strokeStyle = 'red';
      this.ctx.lineWidth = 1;
    }
  
    this.ctx.stroke();
  
    // Dibujar peso de la conexión (más grande)
    const midX = (origen.x + destino.x) / 2;
    const midY = (origen.y + destino.y) / 2;
    this.ctx.fillStyle = 'green';
    this.ctx.font = '16px Arial'; // Tamaño de fuente más grande
    this.ctx.textAlign = 'center';
    this.ctx.fillText(conexion.peso.toString(), midX, midY);

    const midT = 0.85; // Ajuste de la posición de la flecha
    const arrowX = this.bezierPoint(origen.x, controlX1, controlX2, destino.x, midT);
    const arrowY = this.bezierPoint(origen.y, controlY1, controlY2, destino.y, midT);
    const angle = this.bezierAngle(origen.x, controlX1, controlX2, destino.x, 
                                   origen.y, controlY1, controlY2, destino.y, midT);
    this.dibujarFlecha(arrowX, arrowY, angle);
  }

  dibujarFlecha(x: number, y: number, angle: number): void {
    const headLength = 10;

    this.ctx.beginPath();
    this.ctx.moveTo(x, y);
    this.ctx.lineTo(x - headLength * Math.cos(angle - Math.PI / 6), y - headLength * Math.sin(angle - Math.PI / 6));
    this.ctx.lineTo(x - headLength * Math.cos(angle + Math.PI / 6), y - headLength * Math.sin(angle + Math.PI / 6));
    this.ctx.lineTo(x, y);
    this.ctx.fillStyle = 'black';
    this.ctx.fill();
  }

  bezierPoint(p0: number, p1: number, p2: number, p3: number, t: number): number {
    return Math.pow(1 - t, 3) * p0 + 3 * Math.pow(1 - t, 2) * t * p1 + 3 * (1 - t) * Math.pow(t, 2) * p2 + Math.pow(t, 3) * p3;
  }

  bezierAngle(x0: number, x1: number, x2: number, x3: number, y0: number, y1: number, y2: number, y3: number, t: number): number {
    const dx = 3 * Math.pow(1 - t, 2) * (x1 - x0) + 6 * (1 - t) * t * (x2 - x1) + 3 * Math.pow(t, 2) * (x3 - x2);
    const dy = 3 * Math.pow(1 - t, 2) * (y1 - y0) + 6 * (1 - t) * t * (y2 - y1) + 3 * Math.pow(t, 2) * (y3 - y2);
    return Math.atan2(dy, dx);
  }
  calcularJohnson(): void {
    this.calcularTiemposIda();
    this.calcularTiemposVuelta();
    this.dibujarGrafo();
    this.dibujarHolguras();
  }
  
  calcularTiemposIda(): void {
    // Inicializar los tiempos de inicio
    this.nodos.forEach((nodo) => {
      nodo.tiempoInicio = 0;
    });
  
    // Calcular los tiempos de inicio (ida)
    let cambio = true;
  while (cambio) {
    cambio = false;
    this.conexiones.forEach((conexion) => {
      const tiempoLlegada = conexion.origen.tiempoInicio + conexion.peso;
      if (tiempoLlegada > conexion.destino.tiempoInicio) {
        conexion.destino.tiempoInicio = tiempoLlegada;
        cambio = true;
      }
    });
  }
}
  
calcularTiemposVuelta(): void {
  // Obtener el tiempo máximo desde la ida
  const ultimoNodo = this.nodos[this.nodos.length - 1];
  const tiempoMaximo = ultimoNodo.tiempoInicio;

  // Inicializar los tiempos de fin con el último tiempo de ida
  this.nodos.forEach((nodo) => {
    nodo.tiempoFin = tiempoMaximo;
  });

  // Repetir hasta que los valores se estabilicen
  let cambio = true;
  while (cambio) {
    cambio = false;
    this.conexiones.forEach((conexion) => {
      const tiempoSalida = conexion.destino.tiempoFin - conexion.peso;
      if (tiempoSalida < conexion.origen.tiempoFin) {
        conexion.origen.tiempoFin = tiempoSalida;
        cambio = true;
      }
    });
  }
}
  

  // Limpia el canvas
limpiarCanvas(): void {
  if (!this.canvas) return; // Verificar que el canvas está disponible
  this.ctx.clearRect(0, 0, this.canvas.nativeElement.width, this.canvas.nativeElement.height);
}



  dibujarHolguras(): void {
    this.ctx.fillStyle = 'black';
    this.ctx.font = '12px Arial';
    this.ctx.textAlign = 'center';
  
    this.conexiones.forEach((conexion) => {
      // Calcular la holgura
      const holgura = conexion.destino.tiempoFin - conexion.origen.tiempoInicio - conexion.peso;
  
      // Calcular la posición para mostrar la holgura (en el centro de la arista)
      const xMedio = (conexion.origen.x + conexion.destino.x) / 2;
      const yMedio = (conexion.origen.y + conexion.destino.y) / 2;
  
      // Dibujar el texto de la holgura en el canvas
      this.ctx.fillText(`h=${holgura}`, xMedio, yMedio + 20);
    });
  }
  
}