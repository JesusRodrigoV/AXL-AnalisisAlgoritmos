import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  PLATFORM_ID,
  Inject,
  OnDestroy,
} from '@angular/core';
import { Nodo } from 'src/app/pages/johnson/models/nodo.model.jonson';
import { Conexion } from 'src/app/pages/johnson/models/conexion.model.jonson';
import { CommonModule, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ErrorDialogComponent } from '../error-dialog';

interface Actividad {
  nombre: string;
  secuencia: string;
  peso: number;
}

@Component({
  selector: 'app-johnson-canvas',
  imports: [
    NgIf,
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatTooltipModule,
    MatDialogModule,
  ],
  templateUrl: './johnson-canvas.component.html',
  styleUrls: ['./johnson-canvas.component.scss'],
})
export class JohnsonCanvasComponent implements OnInit, OnDestroy {
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

  @ViewChild('johnsonCanvas', { static: true })
  canvasRef!: ElementRef<HTMLCanvasElement>;
  private ctx!: CanvasRenderingContext2D;

  actividades: Actividad[] = [{ nombre: '', secuencia: '', peso: 0 }];
  nodos: Nodo[] = [];
  conexiones: Conexion[] = [];
  selectedNodo: Nodo | null = null;

  // Referencias a los event handlers para poder removerlos en ngOnDestroy
  private mousedownHandler = (e: MouseEvent) => this.startPan(e);
  private mousemoveHandler = (e: MouseEvent) => this.pan(e);
  private mouseupHandler = () => this.stopPan();
  private mouseleaveHandler = () => this.stopPan();
  private wheelHandler = (e: WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) this.zoomIn();
    else this.zoomOut();
  };

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private dialog: MatDialog,
  ) {}

  ngOnInit(): void {
    if (typeof window !== 'undefined' && this.canvasRef?.nativeElement) {
      setTimeout(() => this.inicializarCanvas(), 0);
    }
  }

  private inicializarCanvas(): void {
    const canvas = this.canvasRef.nativeElement;
    const context = canvas.getContext('2d');
    if (!context) return;
    this.ctx = context;
    canvas.width = this.canvasWidth;
    canvas.height = this.canvasHeight;
    this.ajustarTamanoCanvas();
    this.ctx.scale(this.scale, this.scale);
    if (this.nodos.length > 0) this.dibujarGrafo();

    // Agregar listeners para el mouse (almacenamos los handlers para luego removerlos)
    canvas.addEventListener('mousedown', this.mousedownHandler);
    canvas.addEventListener('mousemove', this.mousemoveHandler);
    canvas.addEventListener('mouseup', this.mouseupHandler);
    canvas.addEventListener('mouseleave', this.mouseleaveHandler);
    canvas.addEventListener('wheel', this.wheelHandler);
  }

  private mostrarError(mensaje: string): void {
    try {
      this.dialog.open(ErrorDialogComponent, {
        data: { mensaje },
        width: '400px',
        autoFocus: true,
        disableClose: false,
      });
    } catch (error) {
      console.error('Error almost real del diálogo:', error);
      alert(mensaje); // fallback
    }
  }

  private existeBidireccionalidad(): boolean {
    const conexionesSet = new Set<string>();
    for (const conexion of this.conexiones) {
      const directa = `${conexion.origen.label}-${conexion.destino.label}`;
      const inversa = `${conexion.destino.label}-${conexion.origen.label}`;
      if (conexionesSet.has(inversa)) {
        return true;
      }
      conexionesSet.add(directa);
    }
    return false;
  }

  private existeCiclo(): boolean {
    const visitados = new Set<string>();
    const enProceso = new Set<string>();
    const buscarCiclo = (nodoLabel: string): boolean => {
      if (enProceso.has(nodoLabel)) return true;
      if (visitados.has(nodoLabel)) return false;
      enProceso.add(nodoLabel);
      const conexionesSalientes = this.conexiones.filter(
        (conexion) => conexion.origen.label === nodoLabel,
      );
      for (const conexion of conexionesSalientes) {
        if (buscarCiclo(conexion.destino.label)) {
          return true;
        }
      }
      enProceso.delete(nodoLabel);
      visitados.add(nodoLabel);
      return false;
    };
    for (const nodo of this.nodos) {
      if (!visitados.has(nodo.label) && buscarCiclo(nodo.label)) {
        return true;
      }
    }
    return false;
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
    const nuevaActividad = { nombre: '', secuencia: '', peso: 0 };
    this.actividades.push(nuevaActividad);
  }

  // Verifica si las actividades son válidas para generar el grafo
  actividadesValidas(): boolean {
    return this.actividades.every(
      (actividad) =>
        actividad.nombre?.trim() &&
        (!actividad.secuencia || actividad.secuencia.trim()) &&
        actividad.peso >= 0 &&
        actividad.nombre !== actividad.secuencia,
    );
  }

  // Verifica si una actividad se autorreferencia
  validarAutoReferencia(actividad: Actividad): boolean {
    return actividad.nombre === actividad.secuencia;
  }

  // Muestra error de autorreferencia
  mostrarErrorAutoReferencia(actividad: Actividad): boolean {
    return (
      this.validarAutoReferencia(actividad) &&
      actividad.nombre !== '' &&
      actividad.secuencia !== ''
    );
  }

  // Elimina una actividad (siempre y cuando quede al menos una)
  eliminarActividad(actividad: Actividad): void {
    const index = this.actividades.indexOf(actividad);
    if (index > -1 && this.actividades.length > 1) {
      this.actividades.splice(index, 1);
    }
  }

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

  // Genera el grafo a partir de la tabla de actividades
  generarGrafo(): void {
    // Limpia estado previo
    this.nodos = [];
    this.conexiones = [];
    this.hayGrafo = false;

    // 1. Validación de auto-referencias
    if (this.actividades.some((a) => this.validarAutoReferencia(a))) {
      this.mostrarError('Existen actividades que se referencian a sí mismas');
      return;
    }

    // 2. Recolectar nombres de nodos (origen y destino)
    const nombresNodos = new Set<string>();
    this.actividades.forEach((actividad) => {
      if (actividad.nombre?.trim()) {
        nombresNodos.add(actividad.nombre.trim());
      }
      if (actividad.secuencia?.trim()) {
        nombresNodos.add(actividad.secuencia.trim());
      }
    });

    // 3. Crear nodos y conexiones
    const nodosUnicos = new Map<string, Nodo>();
    // Crear nodo para actividad (origen)
    this.actividades.forEach((a) => {
      if (!nodosUnicos.has(a.nombre)) {
        nodosUnicos.set(a.nombre, new Nodo(`nodo-${a.nombre}`, 0, 0, a.nombre));
      }
      // Crear nodo para secuencia (destino) si corresponde
      if (
        a.secuencia &&
        a.secuencia.trim() !== '' &&
        !nodosUnicos.has(a.secuencia)
      ) {
        nodosUnicos.set(
          a.secuencia,
          new Nodo(`nodo-${a.secuencia}`, 0, 0, a.secuencia),
        );
      }
    });
    this.nodos = Array.from(nodosUnicos.values());

    this.actividades.forEach((a) => {
      if (a.secuencia && a.secuencia.trim() !== '') {
        const origen = nodosUnicos.get(a.nombre);
        const destino = nodosUnicos.get(a.secuencia);
        if (origen && destino && origen !== destino) {
          this.conexiones.push(new Conexion(origen, destino, a.peso));
        }
      }
    });

    // 4. Detección de ciclos y bidireccionalidad
    if (this.detectarCiclos()) {
      this.mostrarError(
        'El grafo contiene ciclos. No se puede calcular la ruta crítica.',
      );
      return;
    }
    if (this.existeBidireccionalidad()) {
      this.mostrarError(
        'El grafo contiene conexiones bidireccionales. No se permite este tipo de conexiones.',
      );
      return;
    }

    // 5. Cálculo del orden topológico (único para ambos cálculos)
    const ordenTopologico = this.obtenerOrdenTopologico();
    if (!ordenTopologico) {
      this.mostrarError('No se pudo calcular el orden topológico');
      return;
    }

    // 6. Cálculo de tiempos y ruta crítica
    this.calcularRutaCritica(ordenTopologico);
    this.ajustarCoordenadas();
    this.calcularJohnson();
    this.dibujarGrafo();
    this.hayGrafo = true;
  }

  private ajustarCoordenadas(): void {
    const niveles = new Map<number, Nodo[]>();
    // 1. Calcular niveles (de izquierda a derecha)
    this.nodos.forEach((nodo) => {
      const nivel = this.obtenerNivelInverso(nodo);
      niveles.set(nivel, [...(niveles.get(nivel) || []), nodo]);
    });
    // 2. Calcular dimensiones dinámicas
    const MARGEN_X = 50;
    const MARGEN_Y = 50;
    const MAX_NIVELES = Math.max(...Array.from(niveles.keys())) + 1;
    const ESPACIO_X = (this.canvasWidth - 2 * MARGEN_X) / MAX_NIVELES;
    // 3. Distribuir nodos
    niveles.forEach((nodosNivel, nivel) => {
      const ESPACIO_Y =
        (this.canvasHeight - 2 * MARGEN_Y) / Math.max(nodosNivel.length, 1);
      nodosNivel.forEach((nodo, index) => {
        nodo.x = MARGEN_X + nivel * ESPACIO_X;
        nodo.y = MARGEN_Y + index * ESPACIO_Y;
        if (nodosNivel.length < 5) {
          nodo.y +=
            (this.canvasHeight -
              2 * MARGEN_Y -
              (nodosNivel.length - 1) * ESPACIO_Y) /
            2;
        }
      });
    });
  }

  // Función auxiliar para calcular niveles (de izquierda a derecha)
  private obtenerNivelInverso(nodo: Nodo): number {
    const conexionesEntrantes = this.conexiones.filter(
      (c) => c.destino.id === nodo.id,
    );
    if (conexionesEntrantes.length === 0) return 0;
    return Math.max(
      ...conexionesEntrantes.map((c) => this.obtenerNivelInverso(c.origen) + 1),
    );
  }

  // Cálculo de la ruta crítica utilizando el orden topológico
  private calcularRutaCritica(ordenTopologico: Nodo[]): void {
    const tiemposTempranos = new Map<string, number>();
    const tiemposTardios = new Map<string, number>();

    // Inicializar tiempos tempranos
    this.nodos.forEach((nodo) => tiemposTempranos.set(nodo.id, 0));

    // Propagar tiempos tempranos en orden topológico
    ordenTopologico.forEach((nodo) => {
      this.conexiones
        .filter((c) => c.origen.id === nodo.id)
        .forEach((conexion) => {
          const nuevoTiempo = tiemposTempranos.get(nodo.id)! + conexion.peso;
          if (nuevoTiempo > (tiemposTempranos.get(conexion.destino.id) || 0)) {
            tiemposTempranos.set(conexion.destino.id, nuevoTiempo);
          }
        });
    });

    // Calcular tiempos tardíos (desde el final)
    const tiempoMaximo = Math.max(...Array.from(tiemposTempranos.values()));
    this.nodos.forEach((nodo) => tiemposTardios.set(nodo.id, tiempoMaximo));
    ordenTopologico
      .slice()
      .reverse()
      .forEach((nodo) => {
        this.conexiones
          .filter((c) => c.destino.id === nodo.id)
          .forEach((conexion) => {
            const nuevoTiempo = tiemposTardios.get(nodo.id)! - conexion.peso;
            if (
              nuevoTiempo < (tiemposTardios.get(conexion.origen.id) || Infinity)
            ) {
              tiemposTardios.set(conexion.origen.id, nuevoTiempo);
            }
          });
      });

    // Calcular holguras y marcar la ruta crítica
    this.conexiones.forEach((conexion) => {
      const holgura =
        tiemposTardios.get(conexion.destino.id)! -
        (tiemposTempranos.get(conexion.origen.id)! + conexion.peso);
      conexion.holgura = holgura;
      conexion.rutaCritica = holgura === 0;
      this.actualizarEstadoNodos(conexion);
    });

    // Validar que no haya valores nulos o indefinidos
    if (
      this.conexiones.some((c) => c.holgura === null || c.holgura === undefined)
    ) {
      this.mostrarError('Error en el cálculo de holguras');
    }
  }

  private actualizarEstadoNodos(conexion: Conexion): void {
    [conexion.origen, conexion.destino].forEach((nodo) => {
      nodo.esCritico = this.conexiones.some(
        (c) => (c.origen === nodo || c.destino === nodo) && c.rutaCritica,
      );
    });
  }

  // Obtiene el orden topológico utilizando el algoritmo de Kahn
  private obtenerOrdenTopologico(): Nodo[] | null {
    const gradosEntrada = new Map<string, number>();
    const nodosSinEntradas: Nodo[] = [];
    const orden: Nodo[] = [];
    this.nodos.forEach((nodo) => gradosEntrada.set(nodo.id, 0));
    this.conexiones.forEach((conexion) => {
      gradosEntrada.set(
        conexion.destino.id,
        (gradosEntrada.get(conexion.destino.id) || 0) + 1,
      );
    });
    this.nodos.forEach((nodo) => {
      if (gradosEntrada.get(nodo.id) === 0) nodosSinEntradas.push(nodo);
    });
    while (nodosSinEntradas.length > 0) {
      const nodo = nodosSinEntradas.shift()!;
      orden.push(nodo);
      this.conexiones
        .filter((c) => c.origen.id === nodo.id)
        .forEach((c) => {
          const gradoActual = gradosEntrada.get(c.destino.id)! - 1;
          gradosEntrada.set(c.destino.id, gradoActual);
          if (gradoActual === 0) nodosSinEntradas.push(c.destino);
        });
    }
    if (orden.length !== this.nodos.length) return null;
    return orden;
  }

  // Detección de ciclos usando DFS
  private detectarCiclos(): boolean {
    const visitados = new Set<string>();
    const pilaRecursion = new Set<string>();
    const esCiclico = (nodo: Nodo): boolean => {
      if (pilaRecursion.has(nodo.id)) return true;
      if (visitados.has(nodo.id)) return false;
      visitados.add(nodo.id);
      pilaRecursion.add(nodo.id);
      const conexionesSalientes = this.conexiones.filter(
        (c) => c.origen.id === nodo.id,
      );
      const tieneCiclo = conexionesSalientes.some((c) => esCiclico(c.destino));
      pilaRecursion.delete(nodo.id);
      return tieneCiclo;
    };
    return this.nodos.some(
      (nodo) => !visitados.has(nodo.id) && esCiclico(nodo),
    );
  }

  // Dibuja el grafo (nodos y conexiones)
  private requestAnimationId: number | null = null;
  dibujarGrafo(): void {
    if (this.requestAnimationId !== null) {
      cancelAnimationFrame(this.requestAnimationId);
    }
    this.requestAnimationId = requestAnimationFrame(() => {
      this.limpiarCanvas();
      this.ctx.save();
      this.ctx.translate(this.offsetX, this.offsetY);
      this.ctx.scale(this.scale, this.scale);
      this.conexiones.forEach((conexion) => this.dibujarConexion(conexion));
      this.nodos.forEach((nodo) => this.dibujarNodo(nodo));
      this.ctx.restore();
      this.requestAnimationId = null;
    });
  }

  // Métodos de zoom
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

  // Conversión de coordenadas
  private canvasToWorld(x: number, y: number): { x: number; y: number } {
    return {
      x: (x - this.offsetX) / this.scale,
      y: (y - this.offsetY) / this.scale,
    };
  }

  private worldToCanvas(x: number, y: number): { x: number; y: number } {
    return {
      x: x * this.scale + this.offsetX,
      y: y * this.scale + this.offsetY,
    };
  }

  ngOnDestroy(): void {
    const canvas = this.canvasRef.nativeElement;
    // REMOVER los event listeners que se agregaron en inicializarCanvas
    canvas.removeEventListener('mousedown', this.mousedownHandler);
    canvas.removeEventListener('mousemove', this.mousemoveHandler);
    canvas.removeEventListener('mouseup', this.mouseupHandler);
    canvas.removeEventListener('mouseleave', this.mouseleaveHandler);
    canvas.removeEventListener('wheel', this.wheelHandler);

    if (this.requestAnimationId !== null) {
      cancelAnimationFrame(this.requestAnimationId);
    }
  }

  // Dibuja un nodo en el canvas
  dibujarNodo(nodo: Nodo): void {
    const radio = 35;
    this.ctx.shadowColor = 'rgba(0,0,0,0.2)';
    this.ctx.shadowBlur = 8;
    this.ctx.shadowOffsetX = 2;
    this.ctx.shadowOffsetY = 2;
    this.ctx.beginPath();
    this.ctx.arc(nodo.x, nodo.y, radio, 0, Math.PI * 2);
    this.ctx.fillStyle = this.COLORS.NODE.FILL;
    this.ctx.fill();
    this.ctx.shadowColor = 'transparent';
    this.ctx.strokeStyle = this.esNodoCritico(nodo)
      ? this.COLORS.NODE.CRITICAL
      : this.COLORS.NODE.REGULAR;
    this.ctx.lineWidth = 3;
    this.ctx.stroke();
    const gradient = this.ctx.createLinearGradient(
      nodo.x - radio,
      nodo.y,
      nodo.x + radio,
      nodo.y,
    );
    gradient.addColorStop(0, 'rgba(33,150,243,0.2)');
    gradient.addColorStop(1, 'rgba(33,150,243,0.1)');
    this.ctx.fillStyle = this.COLORS.NODE.TEXT;
    this.ctx.font = 'bold 16px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(nodo.label, nodo.x, nodo.y - 10);
    this.ctx.strokeStyle = gradient;
    this.ctx.beginPath();
    this.ctx.moveTo(nodo.x - radio, nodo.y);
    this.ctx.lineTo(nodo.x + radio, nodo.y);
    this.ctx.moveTo(nodo.x, nodo.y);
    this.ctx.lineTo(nodo.x, nodo.y + radio);
    this.ctx.stroke();
    this.ctx.font = '14px Arial';
    const tiempoInicioX = nodo.x - radio / 3;
    const tiempoFinX = nodo.x + radio / 3;
    const tiempoY = nodo.y + radio / 2 + 5;
    this.ctx.fillStyle = 'rgba(255,255,255,0.8)';
    this.ctx.fillRect(tiempoInicioX - 15, tiempoY - 12, 30, 16);
    this.ctx.fillRect(tiempoFinX - 15, tiempoY - 12, 30, 16);
    this.ctx.fillStyle = this.esNodoCritico(nodo)
      ? this.COLORS.NODE.CRITICAL
      : this.COLORS.NODE.REGULAR;
    this.ctx.fillText(`${nodo.tiempoInicio}`, tiempoInicioX, tiempoY);
    this.ctx.fillText(`${nodo.tiempoFin}`, tiempoFinX, tiempoY);
  }

  private esNodoCritico(nodo: Nodo): boolean {
    return nodo.esCritico;
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
    this.ctx.shadowColor = 'rgba(0,0,0,0.2)';
    this.ctx.shadowBlur = 4;
    this.ctx.shadowOffsetX = 1;
    this.ctx.shadowOffsetY = 1;
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
    this.ctx.shadowColor = 'transparent';
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
    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2;
    const offset = conexion.rutaCritica ? 25 : 20;
    this.ctx.fillStyle = 'rgba(255,255,255,0.9)';
    this.ctx.beginPath();
    this.ctx.arc(midX, midY, 15, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.fillStyle = this.COLORS.EDGE.TEXT;
    this.ctx.font = 'bold 14px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(conexion.peso.toString(), midX, midY);
    if (conexion.holgura !== undefined) {
      this.ctx.font = '12px Arial';
      this.ctx.fillStyle = conexion.rutaCritica
        ? this.COLORS.EDGE.CRITICAL
        : this.COLORS.EDGE.REGULAR;
      this.ctx.fillText(`h=${conexion.holgura}`, midX, midY + offset);
    }
  }

  // Métodos de cálculo de tiempos estilo Johnson

  calcularJohnson(): void {
    this.calcularTiemposIda();
    this.calcularTiemposVuelta();
    this.dibujarGrafo();
    this.dibujarHolguras();
  }

  calcularTiemposIda(): void {
    this.nodos.forEach((nodo) => (nodo.tiempoInicio = 0));
    const MAX_ITERACIONES = 1000;
    let iteraciones = 0;
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
    const ultimoNodo = this.nodos[this.nodos.length - 1];
    const tiempoMaximo = ultimoNodo.tiempoInicio;
    this.nodos.forEach((nodo) => (nodo.tiempoFin = tiempoMaximo));
    const MAX_ITERACIONES = 1000;
    let iteraciones = 0;
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
      const holgura =
        conexion.destino.tiempoFin -
        conexion.origen.tiempoInicio -
        conexion.peso;
      const xMedio = (conexion.origen.x + conexion.destino.x) / 2;
      const yMedio = (conexion.origen.y + conexion.destino.y) / 2;
      this.ctx.fillText(`h=${holgura}`, xMedio, yMedio + 20);
    });
  }

  validarPeso(event: Event): void {
    const input = event.target as HTMLInputElement;
    const valor = input.value;
    input.value = valor.replace(/[^0-9.]/g, '');
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
        this.limpiarTodo();
        this.actividades = datos.actividades;
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
        if (!this.ctx) {
          setTimeout(() => {
            this.inicializarCanvas();
            setTimeout(() => this.dibujarGrafo(), 100);
          }, 0);
        } else {
          this.dibujarGrafo();
        }
      } catch (error) {
        console.error('Error al importar el archivo:', error);
        alert(
          'Error al importar el archivo. Asegúrate de que se trate de un archivo JSON válido.',
        );
      } finally {
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
