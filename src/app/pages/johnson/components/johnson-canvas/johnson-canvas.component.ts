import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  HostListener,
  PLATFORM_ID,
  Inject,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
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
  imports: [CommonModule, FormsModule], // Importa CommonModule y FormsModule
  templateUrl: './johnson-canvas.component.html',
  styleUrls: ['./johnson-canvas.component.scss'],
})
export class JohnsonCanvasComponent implements OnInit {
  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  @ViewChild('johnsonCanvas', { static: true })
  canvasRef!: ElementRef<HTMLCanvasElement>;
  private ctx!: CanvasRenderingContext2D;

  actividades: Actividad[] = [{ nombre: '', secuencia: '', peso: 0 }]; // Lista de actividades
  nodos: Nodo[] = []; // Lista de nodos
  conexiones: Conexion[] = []; // Lista de conexiones
  selectedNodo: Nodo | null = null; // Nodo seleccionado para crear conexiones

  ngOnInit(): void {
    // Verificar si estamos en el navegador
    if (typeof window !== 'undefined') {
      const context = this.canvasRef.nativeElement.getContext('2d');
      if (context) {
        this.ctx = context; // Asignamos el contexto solo si no es null
        this.dibujarGrafo();
      } else {
        console.warn('No se pudo obtener el contexto 2D del canvas.');
      }
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
      const conexionesEntrantes = this.conexiones.filter(
        (c) => c.destino.id === actual!.id,
      );
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
      const tiempoLlegada =
        tiemposTempranos[conexion.origen.id] + conexion.peso;
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
          const tiempoSalida =
            tiemposTardios[conexion.destino.id] - conexion.peso;
          if (tiempoSalida < tiemposTardios[nodo.id]) {
            tiemposTardios[nodo.id] = tiempoSalida;
          }
        }
      });
    }

    this.conexiones.forEach((conexion) => {
      const holgura =
        tiemposTardios[conexion.destino.id] -
        (tiemposTempranos[conexion.origen.id] + conexion.peso);
      conexion.holgura = holgura;

      if (holgura === 0) {
        conexion.rutaCritica = true; // Marcar como ruta crítica
      }
    });

    this.dibujarGrafo();
  }

  // Dibuja todos los nodos y conexiones
  private requestAnimationId: number | null = null;

  dibujarGrafo(): void {
    // Cancelar cualquier frame de animación pendiente
    if (this.requestAnimationId !== null) {
      cancelAnimationFrame(this.requestAnimationId);
    }

    // Programar el próximo frame de dibujado
    this.requestAnimationId = requestAnimationFrame(() => {
      this.limpiarCanvas();

      // Dibujar conexiones
      this.conexiones.forEach((conexion) => {
        this.dibujarConexion(conexion);
      });

      // Dibujar nodos
      this.nodos.forEach((nodo) => {
        this.dibujarNodo(nodo);
      });

      this.requestAnimationId = null;
    });
  }

  // Limpiar recursos cuando el componente se destruye
  ngOnDestroy(): void {
    if (this.requestAnimationId !== null) {
      cancelAnimationFrame(this.requestAnimationId);
    }
  }

  // Dibuja un nodo en el canvas
  dibujarNodo(nodo: Nodo): void {
    const radio = 30;

    // Dibujar el círculo del nodo
    this.ctx.beginPath();
    this.ctx.arc(nodo.x, nodo.y, radio, 0, Math.PI * 2);
    this.ctx.fillStyle = '#ffffff'; // Fondo blanco
    this.ctx.fill();
    this.ctx.strokeStyle = '#2196F3'; // Borde azul
    this.ctx.lineWidth = 2;
    this.ctx.stroke();

    // Dibujar líneas divisorias para dividir en tres secciones
    this.ctx.beginPath();
    this.ctx.moveTo(nodo.x - radio, nodo.y);
    this.ctx.lineTo(nodo.x + radio, nodo.y);
    this.ctx.moveTo(nodo.x, nodo.y);
    this.ctx.lineTo(nodo.x, nodo.y + radio);
    this.ctx.stroke();

    // Mostrar el nombre del nodo en la parte superior
    this.ctx.fillStyle = '#000000';
    this.ctx.font = 'bold 14px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(nodo.label, nodo.x, nodo.y - radio - 5);

    // Mostrar valores en las secciones
    this.ctx.font = '12px Arial';
    this.ctx.fillStyle = '#1976D2'; // Azul más oscuro
    this.ctx.fillText(
      `${nodo.tiempoInicio}`,
      nodo.x - radio / 3,
      nodo.y + radio / 2 + 5,
    );

    this.ctx.fillStyle = '#D32F2F'; // Rojo más oscuro
    this.ctx.fillText(
      `${nodo.tiempoFin}`,
      nodo.x + radio / 3,
      nodo.y + radio / 2 + 5,
    );
  }

  // Dibuja una conexión entre dos nodos
  dibujarConexion(conexion: Conexion): void {
    const origen = conexion.origen;
    const destino = conexion.destino;
    const radio = 30; // Mismo radio que los nodos

    // Calcular puntos de inicio y fin ajustados para que la flecha no toque los nodos
    const dx = destino.x - origen.x;
    const dy = destino.y - origen.y;
    const angle = Math.atan2(dy, dx);

    const startX = origen.x + radio * Math.cos(angle);
    const startY = origen.y + radio * Math.sin(angle);
    const endX = destino.x - radio * Math.cos(angle);
    const endY = destino.y - radio * Math.sin(angle);

    // Dibujar la línea principal
    this.ctx.beginPath();
    this.ctx.moveTo(startX, startY);
    this.ctx.lineTo(endX, endY);

    // Establecer el estilo según si es ruta crítica o no
    if (conexion.rutaCritica) {
      this.ctx.strokeStyle = '#1976D2'; // Azul más oscuro
      this.ctx.lineWidth = 3;
    } else {
      this.ctx.strokeStyle = '#D32F2F'; // Rojo más oscuro
      this.ctx.lineWidth = 2;
    }
    this.ctx.stroke();

    // Dibujar la punta de la flecha
    const headlen = 15; // Longitud de la punta de la flecha
    const angle1 = angle - Math.PI / 6;
    const angle2 = angle + Math.PI / 6;

    this.ctx.beginPath();
    this.ctx.moveTo(endX, endY);
    this.ctx.lineTo(
      endX - headlen * Math.cos(angle1),
      endY - headlen * Math.sin(angle1),
    );
    this.ctx.moveTo(endX, endY);
    this.ctx.lineTo(
      endX - headlen * Math.cos(angle2),
      endY - headlen * Math.sin(angle2),
    );
    this.ctx.stroke();

    // Dibujar peso de la conexión con fondo
    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2;

    // Fondo blanco para el peso
    this.ctx.fillStyle = '#ffffff';
    this.ctx.beginPath();
    this.ctx.arc(midX, midY, 12, 0, Math.PI * 2);
    this.ctx.fill();

    // Texto del peso
    this.ctx.fillStyle = '#4CAF50'; // Verde
    this.ctx.font = 'bold 16px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(conexion.peso.toString(), midX, midY);
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

    // Límite máximo de iteraciones para prevenir bucles infinitos
    const MAX_ITERACIONES = 1000;
    let iteraciones = 0;

    // Calcular los tiempos de inicio (ida)
    let cambio = true;
    while (cambio && iteraciones < MAX_ITERACIONES) {
      cambio = false;
      this.conexiones.forEach((conexion) => {
        const tiempoLlegada = conexion.origen.tiempoInicio + conexion.peso;
        if (tiempoLlegada > conexion.destino.tiempoInicio) {
          conexion.destino.tiempoInicio = tiempoLlegada;
          cambio = true;
        }
      });
      iteraciones++;
    }

    if (iteraciones >= MAX_ITERACIONES) {
      console.warn(
        'Se alcanzó el límite máximo de iteraciones en calcularTiemposIda',
      );
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

    // Límite máximo de iteraciones para prevenir bucles infinitos
    const MAX_ITERACIONES = 1000;
    let iteraciones = 0;

    // Repetir hasta que los valores se estabilicen
    let cambio = true;
    while (cambio && iteraciones < MAX_ITERACIONES) {
      cambio = false;
      this.conexiones.forEach((conexion) => {
        const tiempoSalida = conexion.destino.tiempoFin - conexion.peso;
        if (tiempoSalida < conexion.origen.tiempoFin) {
          conexion.origen.tiempoFin = tiempoSalida;
          cambio = true;
        }
      });
      iteraciones++;
    }

    if (iteraciones >= MAX_ITERACIONES) {
      console.warn(
        'Se alcanzó el límite máximo de iteraciones en calcularTiemposVuelta',
      );
    }
  }

  // Limpia el canvas
  limpiarCanvas(): void {
    this.ctx.clearRect(
      0,
      0,
      this.canvasRef.nativeElement.width,
      this.canvasRef.nativeElement.height,
    );
  }

  dibujarHolguras(): void {
    this.ctx.fillStyle = 'black';
    this.ctx.font = '12px Arial';
    this.ctx.textAlign = 'center';

    this.conexiones.forEach((conexion) => {
      // Calcular la holgura
      const holgura =
        conexion.destino.tiempoFin -
        conexion.origen.tiempoInicio -
        conexion.peso;

      // Calcular la posición para mostrar la holgura (en el centro de la arista)
      const xMedio = (conexion.origen.x + conexion.destino.x) / 2;
      const yMedio = (conexion.origen.y + conexion.destino.y) / 2;

      // Dibujar el texto de la holgura en el canvas
      this.ctx.fillText(`h=${holgura}`, xMedio, yMedio + 20);
    });
  }
}
