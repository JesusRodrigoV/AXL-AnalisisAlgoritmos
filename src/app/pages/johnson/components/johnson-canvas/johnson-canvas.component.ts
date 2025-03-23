import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  PLATFORM_ID,
  Inject,
} from '@angular/core';
import { Nodo } from 'src/app/pages/johnson/models/nodo.model.jonson';
import { Conexion } from 'src/app/pages/johnson/models/conexion.model.jonson';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';

interface Actividad {
  nombre: string;
  secuencia: string;
  peso: number;
}

@Component({
  selector: 'app-johnson-canvas',
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatTooltipModule,
  ],
  templateUrl: './johnson-canvas.component.html',
  styleUrls: ['./johnson-canvas.component.scss'],
})
export class JohnsonCanvasComponent implements OnInit {
  hayGrafo = false;
  private scale = 1;
  private offsetX = 0;
  private offsetY = 0;
  private isPanning = false;
  private lastX = 0;
  private lastY = 0;
  private readonly MIN_SCALE = 0.5;
  private readonly MAX_SCALE = 2;
  private readonly ZOOM_FACTOR = 0.1;
  canvasWidth = 2000;
  canvasHeight = 1500;
  


  // Colores para la ruta crítica y nodos
  private readonly COLORS = {
    NODE: {
      FILL: '#ffffff',
      STROKE: '#2196F3',
      TEXT: '#000000',
      CRITICAL: '#ff4081',
      REGULAR: '#2196F3',
    },
    EDGE: {
      CRITICAL: '#ff4081',
      REGULAR: '#2196F3',
      TEXT: '#4CAF50',
      HOVER: '#FF9800',
    },
  };
  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  @ViewChild('johnsonCanvas', { static: true })
  canvasRef!: ElementRef<HTMLCanvasElement>;
  private ctx!: CanvasRenderingContext2D;

  actividades: Actividad[] = [{ nombre: '', secuencia: '', peso: 0 }]; // Lista de actividades
  nodos: Nodo[] = []; // Lista de nodos
  conexiones: Conexion[] = []; // Lista de conexiones
  selectedNodo: Nodo | null = null; // Nodo seleccionado para crear conexiones

  ngOnInit(): void {
    // Verificar si estamos en el navegador y si el canvas existe
    if (typeof window !== 'undefined' && this.canvasRef?.nativeElement) {
      setTimeout(() => {
        this.inicializarCanvas();
      }, 0);
    }
  }

  private inicializarCanvas(): void {
    if (!this.canvasRef) {
      console.error('Canvas reference not found');
      return;
    }

    const canvas = this.canvasRef.nativeElement;
    if (!canvas) {
      console.error('Canvas element not found');
      return;
    }

    const context = canvas.getContext('2d');
    if (!context) {
      console.error('Could not get 2D context');
      return;
    }

    this.ctx = context;

    // Configurar el canvas
    canvas.width = this.canvasWidth;
    canvas.height = this.canvasHeight;

    // Ajustar el tamaño del canvas al contenedor
    this.ajustarTamanoCanvas();

    // Aplicar escala inicial
    this.ctx.scale(this.scale, this.scale);

    // Dibujar el grafo inicial si hay datos
    if (this.nodos.length > 0) {
      this.dibujarGrafo();
    }

    // Agregar listeners para el mouse
    canvas.addEventListener('mousedown', (e) => this.startPan(e));
    canvas.addEventListener('mousemove', (e) => this.pan(e));
    canvas.addEventListener('mouseup', () => this.stopPan());
    canvas.addEventListener('mouseleave', () => this.stopPan());
    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      if (e.deltaY < 0) this.zoomIn();
      else this.zoomOut();
    });
  }

  private ajustarTamanoCanvas(): void {
    const container = this.canvasRef.nativeElement.parentElement;
    if (container) {
      this.canvasWidth = container.clientWidth;
      this.canvasHeight = container.clientHeight;
      this.canvasRef.nativeElement.width = this.canvasWidth;
      this.canvasRef.nativeElement.height = this.canvasHeight;
    }
  }

  // Agrega una nueva actividad a la tabla
  agregarActividad(): void {
    const nuevaActividad = {
      nombre: ``,
      secuencia: '',
      peso: 0,
    };
    this.actividades.push(nuevaActividad);
  }

  // Verifica si las actividades son válidas para generar el grafo
  actividadesValidas(): boolean {
    return this.actividades.every(
      (actividad) =>
        actividad.nombre?.trim() &&
        (!actividad.secuencia || actividad.secuencia.trim()) &&
        actividad.peso >= 0 &&
        actividad.nombre !== actividad.secuencia, // Validar que no sea el mismo nodo
    );
  }

  // Método para validar si una actividad tiene ciclo en sí misma
  validarAutoReferencia(actividad: Actividad): boolean {
    return actividad.nombre === actividad.secuencia;
  }

  // Método para mostrar error de auto-referencia
  mostrarErrorAutoReferencia(actividad: Actividad): boolean {
    return (
      this.validarAutoReferencia(actividad) &&
      actividad.nombre !== '' &&
      actividad.secuencia !== ''
    );
  }

  // Limpia todo y reinicia el componente
  limpiarTodo(): void {
    this.actividades = [{ nombre: '', secuencia: '', peso: 0 }];
    this.nodos = [];
    this.conexiones = [];
    this.hayGrafo = false;
    this.scale = 1;
    this.offsetX = 0;
    this.offsetY = 0;
    this.limpiarCanvas();
  }

  // Genera el grafo a partir de la tabla
  generarGrafo(): void {
    // Limpiar estado previo
    this.nodos = [];
    this.conexiones = [];
    this.hayGrafo = false;

    // Validar que no haya auto-referencias
    const hayAutoReferencias = this.actividades.some((actividad) =>
      this.validarAutoReferencia(actividad),
    );

    if (hayAutoReferencias) {
      console.warn('Hay actividades que se referencian a sí mismas');
      return;
    }

    // Validar actividades
    if (!this.actividadesValidas()) {
      console.warn('Las actividades no son válidas');
      return;
    }
    if (this.actividades.some((a) => a.nombre || a.secuencia || a.peso !== 0)) {
      if (!this.actividadesValidas()) {
        return;
      }
    }

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
    this.hayGrafo = true;

    // Calcular la ruta crítica
    this.calcularRutaCritica();
    this.calcularJohnson();
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
    if (this.requestAnimationId !== null) {
      cancelAnimationFrame(this.requestAnimationId);
    }

    this.requestAnimationId = requestAnimationFrame(() => {
      this.limpiarCanvas();

      // Aplicar transformaciones
      this.ctx.save();
      this.ctx.translate(this.offsetX, this.offsetY);
      this.ctx.scale(this.scale, this.scale);

      // Dibujar conexiones
      this.conexiones.forEach((conexion) => {
        this.dibujarConexion(conexion);
      });

      // Dibujar nodos
      this.nodos.forEach((nodo) => {
        this.dibujarNodo(nodo);
      });

      this.ctx.restore();
      this.requestAnimationId = null;
    });
  }

  // Métodos para zoom
  zoomIn(): void {
    if (this.scale < this.MAX_SCALE) {
      this.scale += this.ZOOM_FACTOR;
      this.dibujarGrafo();
    }
  }

  zoomOut(): void {
    if (this.scale > this.MIN_SCALE) {
      this.scale -= this.ZOOM_FACTOR;
      this.dibujarGrafo();
    }
  }

  resetZoom(): void {
    this.scale = 1;
    this.offsetX = 0;
    this.offsetY = 0;
    this.dibujarGrafo();
  }

  // Métodos para pan
  startPan(event: MouseEvent): void {
    this.isPanning = true;
    this.lastX = event.clientX;
    this.lastY = event.clientY;
  }

  pan(event: MouseEvent): void {
    if (!this.isPanning) return;

    const deltaX = event.clientX - this.lastX;
    const deltaY = event.clientY - this.lastY;

    this.offsetX += deltaX;
    this.offsetY += deltaY;

    this.lastX = event.clientX;
    this.lastY = event.clientY;

    this.dibujarGrafo();
  }

  stopPan(): void {
    this.isPanning = false;
  }

  // Conversión de coordenadas del canvas a coordenadas del mundo
  private canvasToWorld(x: number, y: number): { x: number; y: number } {
    return {
      x: (x - this.offsetX) / this.scale,
      y: (y - this.offsetY) / this.scale,
    };
  }

  // Conversión de coordenadas del mundo a coordenadas del canvas
  private worldToCanvas(x: number, y: number): { x: number; y: number } {
    return {
      x: x * this.scale + this.offsetX,
      y: y * this.scale + this.offsetY,
    };
  }

  // Limpiar recursos cuando el componente se destruye
  ngOnDestroy(): void {
    if (this.requestAnimationId !== null) {
      cancelAnimationFrame(this.requestAnimationId);
    }
  }

  // Dibuja un nodo en el canvas
  dibujarNodo(nodo: Nodo): void {
    const radio = 35; // Radio aumentado para mejor visualización

    // Efecto de sombra
    this.ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
    this.ctx.shadowBlur = 8;
    this.ctx.shadowOffsetX = 2;
    this.ctx.shadowOffsetY = 2;

    // Dibujar el círculo del nodo
    this.ctx.beginPath();
    this.ctx.arc(nodo.x, nodo.y, radio, 0, Math.PI * 2);
    this.ctx.fillStyle = this.COLORS.NODE.FILL;
    this.ctx.fill();

    // Resetear sombra para el borde
    this.ctx.shadowColor = 'transparent';

    // Borde del nodo
    this.ctx.strokeStyle = this.esNodoCritico(nodo)
      ? this.COLORS.NODE.CRITICAL
      : this.COLORS.NODE.REGULAR;
    this.ctx.lineWidth = 3;
    this.ctx.stroke();

    // Dibujar líneas divisorias con efecto gradiente
    const gradient = this.ctx.createLinearGradient(
      nodo.x - radio,
      nodo.y,
      nodo.x + radio,
      nodo.y,
    );
    gradient.addColorStop(0, 'rgba(33, 150, 243, 0.2)');
    gradient.addColorStop(1, 'rgba(33, 150, 243, 0.1)');

    // Texto del nodo con mejor estilo (ahora dentro del círculo)
    this.ctx.fillStyle = this.COLORS.NODE.TEXT;
    this.ctx.font = 'bold 16px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(nodo.label, nodo.x, nodo.y - 10); // Posicionado arriba de la línea divisoria

    // Dibujar líneas divisorias
    this.ctx.strokeStyle = gradient;
    this.ctx.beginPath();
    this.ctx.moveTo(nodo.x - radio, nodo.y);
    this.ctx.lineTo(nodo.x + radio, nodo.y);
    this.ctx.moveTo(nodo.x, nodo.y);
    this.ctx.lineTo(nodo.x, nodo.y + radio);
    this.ctx.stroke();

    // Valores con mejor contraste
    this.ctx.font = '14px Arial';
    const tiempoInicioX = nodo.x - radio / 3;
    const tiempoFinX = nodo.x + radio / 3;
    const tiempoY = nodo.y + radio / 2 + 5;

    // Fondo para los valores
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    this.ctx.fillRect(tiempoInicioX - 15, tiempoY - 12, 30, 16);
    this.ctx.fillRect(tiempoFinX - 15, tiempoY - 12, 30, 16);

    // Valores
    this.ctx.fillStyle = this.esNodoCritico(nodo)
      ? this.COLORS.NODE.CRITICAL
      : this.COLORS.NODE.REGULAR;
    this.ctx.fillText(`${nodo.tiempoInicio}`, tiempoInicioX, tiempoY);
    this.ctx.fillText(`${nodo.tiempoFin}`, tiempoFinX, tiempoY);
  }

  private esNodoCritico(nodo: Nodo): boolean {
    return this.conexiones.some(
      (conexion) =>
        (conexion.origen.id === nodo.id || conexion.destino.id === nodo.id) &&
        conexion.rutaCritica,
    );
  }

  // Dibuja una conexión entre dos nodos
  dibujarConexion(conexion: Conexion): void {
    const origen = conexion.origen;
    const destino = conexion.destino;
    const radio = 35;

    const dx = destino.x - origen.x;
    const dy = destino.y - origen.y;
    const angle = Math.atan2(dy, dx);

    const startX = origen.x + radio * Math.cos(angle);
    const startY = origen.y + radio * Math.sin(angle);
    const endX = destino.x - radio * Math.cos(angle);
    const endY = destino.y - radio * Math.sin(angle);

    // Efecto de sombra para la línea
    this.ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
    this.ctx.shadowBlur = 4;
    this.ctx.shadowOffsetX = 1;
    this.ctx.shadowOffsetY = 1;

    // Dibujar la línea principal con gradiente
    const gradient = this.ctx.createLinearGradient(startX, startY, endX, endY);
    if (conexion.rutaCritica) {
      gradient.addColorStop(0, this.COLORS.EDGE.CRITICAL);
      gradient.addColorStop(1, this.COLORS.EDGE.CRITICAL);
      this.ctx.lineWidth = 4;
    } else {
      gradient.addColorStop(0, this.COLORS.EDGE.REGULAR);
      gradient.addColorStop(1, this.COLORS.EDGE.REGULAR);
      this.ctx.lineWidth = 2;
    }

    this.ctx.beginPath();
    this.ctx.moveTo(startX, startY);
    this.ctx.lineTo(endX, endY);
    this.ctx.strokeStyle = gradient;
    this.ctx.stroke();

    // Resetear sombra para el resto de elementos
    this.ctx.shadowColor = 'transparent';

    // Dibujar la punta de la flecha con mejor estilo
    const headlen = 18;
    const angle1 = angle - Math.PI / 7;
    const angle2 = angle + Math.PI / 7;

    this.ctx.beginPath();
    this.ctx.moveTo(endX, endY);
    this.ctx.lineTo(
      endX - headlen * Math.cos(angle1),
      endY - headlen * Math.sin(angle1),
    );
    this.ctx.lineTo(
      endX - headlen * 0.5 * Math.cos(angle),
      endY - headlen * 0.5 * Math.sin(angle),
    );
    this.ctx.lineTo(
      endX - headlen * Math.cos(angle2),
      endY - headlen * Math.sin(angle2),
    );
    this.ctx.closePath();
    this.ctx.fillStyle = conexion.rutaCritica
      ? this.COLORS.EDGE.CRITICAL
      : this.COLORS.EDGE.REGULAR;
    this.ctx.fill();

    // Información de peso y holgura
    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2;
    const offset = conexion.rutaCritica ? 25 : 20;

    // Fondo para el peso
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    this.ctx.beginPath();
    this.ctx.arc(midX, midY, 15, 0, Math.PI * 2);
    this.ctx.fill();

    // Peso
    this.ctx.fillStyle = this.COLORS.EDGE.TEXT;
    this.ctx.font = 'bold 14px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(conexion.peso.toString(), midX, midY);

    // Holgura
    if (conexion.holgura !== undefined) {
      this.ctx.font = '12px Arial';
      this.ctx.fillStyle = conexion.rutaCritica
        ? this.COLORS.EDGE.CRITICAL
        : this.COLORS.EDGE.REGULAR;
      this.ctx.fillText(`h=${conexion.holgura}`, midX, midY + offset);
    }
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
  validarPeso(event: Event): void {
    const input = event.target as HTMLInputElement;
    const valor = input.value;

    // Eliminar caracteres no numéricos
    input.value = valor.replace(/[^0-9]/g, '');

    // Convertir a número y validar
    const numeroValor = Number(input.value);
    if (numeroValor < 0) {
      input.value = '0';
    }
  }

  esNumeroValido(valor: any): boolean {
    return !isNaN(valor) && valor >= 0;
  }

  exportarGrafo(): void {
    const datos = {
      actividades: this.actividades,
      nodos: this.nodos.map((nodo) => ({
        id: nodo.id,
        x: nodo.x,
        y: nodo.y,
        label: nodo.label,
        tiempoInicio: nodo.tiempoInicio,
        tiempoFin: nodo.tiempoFin,
      })),
      conexiones: this.conexiones.map((conexion) => ({
        origen: conexion.origen.id,
        destino: conexion.destino.id,
        peso: conexion.peso,
        holgura: conexion.holgura,
        rutaCritica: conexion.rutaCritica,
      })),
    };

    const jsonString = JSON.stringify(datos, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'grafo-johnson.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  importarGrafo(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      try {
        const datos = JSON.parse(e.target?.result as string);

        // Limpiar el estado actual
        this.limpiarTodo();

        // Importar actividades
        this.actividades = datos.actividades;

        // Importar nodos
        this.nodos = datos.nodos.map((nodoData: any) => {
          const nodo = new Nodo(
            nodoData.id,
            nodoData.x,
            nodoData.y,
            nodoData.label,
          );
          nodo.tiempoInicio = nodoData.tiempoInicio;
          nodo.tiempoFin = nodoData.tiempoFin;
          return nodo;
        });

        // Importar conexiones
        this.conexiones = datos.conexiones.map((conexionData: any) => {
          const origen = this.nodos.find((n) => n.id === conexionData.origen)!;
          const destino = this.nodos.find(
            (n) => n.id === conexionData.destino,
          )!;
          const conexion = new Conexion(origen, destino, conexionData.peso);
          conexion.holgura = conexionData.holgura;
          conexion.rutaCritica = conexionData.rutaCritica;
          return conexion;
        });

        this.hayGrafo = true;

        // Asegurarse de que el canvas esté inicializado
        if (!this.ctx) {
          setTimeout(() => {
            this.inicializarCanvas();
            setTimeout(() => {
              this.dibujarGrafo();
            }, 100);
          }, 0);
        } else {
          this.dibujarGrafo();
        }
      } catch (error) {
        console.error('Error al importar el archivo:', error);
        alert(
          'Error al importar el archivo. Asegúrate de que sea un archivo JSON válido.',
        );
      } finally {
        // Limpiar el input file
        input.value = '';
      }
    };
    reader.readAsText(file);
  }

  triggerFileInput(): void {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';
    fileInput.onchange = (e) => this.importarGrafo(e);
    fileInput.click();
  }
}
