import { Component, OnInit, ViewChild, ElementRef, HostListener } from '@angular/core';
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
export class JohnsonCanvasComponent implements OnInit {
  @ViewChild('johnsonCanvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;
  private ctx!: CanvasRenderingContext2D;

  actividades: Actividad[] = [{ nombre: '', secuencia: '', peso: 0 }]; // Lista de actividades
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
    const espacioHorizontal = 150; // Espacio horizontal entre nodos
    const espacioVertical = 100; // Espacio vertical entre niveles
    const niveles: { [key: number]: Nodo[] } = {};
  
    // Asignar niveles a los nodos
    this.nodos.forEach((nodo) => {
      const nivel = this.obtenerNivel(nodo);
      if (!niveles[nivel]) {
        niveles[nivel] = [];
      }
      niveles[nivel].push(nodo);
    });
  
    // Calcular las coordenadas de los nodos
    Object.keys(niveles).forEach((nivelStr) => {
      const nivel = parseInt(nivelStr, 10);
      const nodosEnNivel = niveles[nivel];
      const startY = (600 - (nodosEnNivel.length - 1) * espacioVertical) / 2; // Centrar verticalmente
  
      nodosEnNivel.forEach((nodo, index) => {
        nodo.x = 100 + nivel * espacioHorizontal; // Mover de izquierda a derecha
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
    const radio = 20;
    const mitadX = nodo.x;
    const mitadY = nodo.y;
  
    // Dibujar el círculo del nodo
    this.ctx.beginPath();
    this.ctx.arc(nodo.x, nodo.y, radio, 0, Math.PI * 2);
    this.ctx.strokeStyle = 'black';
    this.ctx.stroke();
  
    // Dibujar una línea vertical para dividir el nodo en dos partes
    this.ctx.beginPath();
    this.ctx.moveTo(nodo.x, nodo.y - radio);
    this.ctx.lineTo(nodo.x, nodo.y + radio);
    this.ctx.stroke();
  
    // Mostrar la etiqueta del nodo en la parte superior
    this.ctx.fillStyle = 'black';
    this.ctx.font = '12px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(nodo.label, nodo.x, nodo.y - radio - 5);
  
    // Mostrar el valor de ida (inicio) en la mitad izquierda del nodo
    this.ctx.fillStyle = 'blue';
    this.ctx.font = '10px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(`I: ${nodo.tiempoInicio}`, nodo.x - radio / 2, nodo.y + 5);
  
    // Mostrar el valor de vuelta (fin) en la mitad derecha del nodo
    this.ctx.fillStyle = 'red';
    this.ctx.font = '10px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(`V: ${nodo.tiempoFin}`, nodo.x + radio / 2, nodo.y + 5);
  }

  // Dibuja una conexión entre dos nodos
  dibujarConexion(conexion: Conexion): void {
    const origen = conexion.origen;
    const destino = conexion.destino;
  
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
  }
  calcularJohnson(): void {
    this.calcularTiemposIda();
    this.calcularTiemposVuelta();
    this.dibujarGrafo();
  }
  
  calcularTiemposIda(): void {
    // Inicializar los tiempos de inicio
    this.nodos.forEach((nodo) => {
      nodo.tiempoInicio = 0;
    });
  
    // Calcular los tiempos de inicio (ida)
    this.conexiones.forEach((conexion) => {
      const tiempoLlegada = conexion.origen.tiempoInicio + conexion.peso;
      if (tiempoLlegada > conexion.destino.tiempoInicio) {
        conexion.destino.tiempoInicio = tiempoLlegada;
      }
    });
  }
  
  calcularTiemposVuelta(): void {
    // Inicializar los tiempos de fin con el último valor de ida
    const ultimoNodo = this.nodos[this.nodos.length - 1];
    this.nodos.forEach((nodo) => {
      nodo.tiempoFin = ultimoNodo.tiempoInicio;
    });
  
    // Calcular los tiempos de fin (vuelta)
    for (let i = this.nodos.length - 1; i >= 0; i--) {
      const nodo = this.nodos[i];
      this.conexiones.forEach((conexion) => {
        if (conexion.destino.id === nodo.id) {
          const tiempoSalida = conexion.origen.tiempoFin - conexion.peso;
          if (tiempoSalida < nodo.tiempoFin) {
            nodo.tiempoFin = tiempoSalida;
          }
        }
      });
    }
  }
  

  // Limpia el canvas
  limpiarCanvas(): void {
    this.ctx.clearRect(0, 0, this.canvasRef.nativeElement.width, this.canvasRef.nativeElement.height);
  }
}