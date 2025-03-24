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

  @ViewChild('johnsonCanvas', { static: true })
  canvasRef!: ElementRef<HTMLCanvasElement>;
  private ctx!: CanvasRenderingContext2D;

  actividades: Actividad[] = [{ nombre: '', secuencia: '', peso: 0 }]; // Lista de actividades
  nodos: Nodo[] = []; // Lista de nodos
  conexiones: Conexion[] = []; // Lista de conexiones
  selectedNodo: Nodo | null = null; // Nodo seleccionado para crear conexiones

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
  // Métodos auxiliares
  private mostrarError(mensaje: string): void {
    this.dialog.open(ErrorDialogComponent, {
      data: { mensaje },
      width: '400px',
      position: { top: '100px' },
    });
  }

  private existeBidireccionalidad(): boolean {
    const conexiones = new Set<string>();

    for (const conexion of this.conexiones) {
      const directa = `${conexion.origen.label}-${conexion.destino.label}`;
      const inversa = `${conexion.destino.label}-${conexion.origen.label}`;

      if (conexiones.has(inversa)) {
        return true;
      }
      conexiones.add(directa);
    }

    return false;
  }

  private existeCiclo(): boolean {
    const visitados = new Set<string>();
    const enProceso = new Set<string>();

    const buscarCiclo = (nodoLabel: string): boolean => {
      if (enProceso.has(nodoLabel)) {
        return true; // Se encontró un ciclo
      }

      if (visitados.has(nodoLabel)) {
        return false;
      }

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

    // Buscar ciclos desde cada nodo no visitado
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

  // Genera el grafo a partir de la tabla
  generarGrafo(): void {
    // Limpiar estado previo
    this.nodos = [];
    this.conexiones = [];
    this.hayGrafo = false;

    // 1. Validación de auto-referencias
    const hayAutoReferencias = this.actividades.some((a) =>
      this.validarAutoReferencia(a),
    );
    if (hayAutoReferencias) {
      this.mostrarError('Existen actividades que se referencian a sí mismas');
      return;
    }

    // 2. Recolectar todos los nombres de nodos (tanto origen como destino)
    const nombresNodos = new Set<string>();
    this.actividades.forEach((actividad) => {
      if (actividad.nombre?.trim()) {
        nombresNodos.add(actividad.nombre.trim());
      }
      if (actividad.secuencia?.trim()) {
        nombresNodos.add(actividad.secuencia.trim());
      }
    });
    // 3. Creación de nodos y conexiones
    const nodosUnicos = new Map<string, Nodo>();

    // Crear nodos para actividades y sus secuencias
    this.actividades.forEach((a) => {
      // Crear nodo origen si no existe
      if (!nodosUnicos.has(a.nombre)) {
        nodosUnicos.set(a.nombre, new Nodo(`nodo-${a.nombre}`, 0, 0, a.nombre));
      }

      // Crear nodo destino si existe secuencia y no existe el nodo
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

    // Crear conexiones válidas
    this.actividades.forEach((a) => {
      if (a.secuencia && a.secuencia.trim() !== '') {
        const origen = nodosUnicos.get(a.nombre);
        const destino = nodosUnicos.get(a.secuencia);
        if (origen && destino && origen !== destino) {
          this.conexiones.push(new Conexion(origen, destino, a.peso));
        }
      }
    });

    // Crear conexiones válidas
    this.actividades.forEach((a) => {
      const origen = nodosUnicos.get(a.nombre);
      const destino = nodosUnicos.get(a.secuencia);
      if (origen && destino && origen !== destino) {
        this.conexiones.push(new Conexion(origen, destino, a.peso));
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

    // 5. Cálculo de la ruta crítica
    const ordenTopologico = this.obtenerOrdenTopologico();
    if (!ordenTopologico) {
      this.mostrarError('No se puede calcular el orden topológico');
      return;
    }

    // 6. Cálculo de tiempos y ruta crítica
    this.calcularRutaCritica();

    // 7. Ajuste de coordenadas y visualización
    this.ajustarCoordenadas();
    this.calcularJohnson(); // Este método ahora actualiza los tiempos y holguras
    this.dibujarGrafo();
    this.hayGrafo = true;
  }

  // Ajusta las coordenadas de los nodos para que no se superpongan
  private ajustarCoordenadas(): void {
    const niveles = new Map<number, Nodo[]>();

    this.nodos.forEach((nodo) => {
      const nivel = this.calcularNivel(nodo);
      niveles.set(nivel, [...(niveles.get(nivel) || []), nodo]);
    });

    niveles.forEach((nodosNivel, nivel) => {
      const espacioVertical = 120;
      const startY = (600 - (nodosNivel.length - 1) * espacioVertical) / 2;

      nodosNivel.forEach((nodo, index) => {
        nodo.x = 150 + nivel * 200;
        nodo.y = startY + index * espacioVertical;
      });
    });
  }
  private calcularNivel(nodo: Nodo): number {
    return this.conexiones
      .filter((c) => c.destino.id === nodo.id)
      .reduce((max, c) => Math.max(max, this.calcularNivel(c.origen) + 1), 0);
  }

  // Método ajustado para cálculo de niveles sin ciclos
  private obtenerNivel(nodo: Nodo): number {
    const niveles = new Map<string, number>();
    const cola: [Nodo, number][] = [[nodo, 0]];

    while (cola.length > 0) {
      const [actual, nivel] = cola.shift()!;

      if (niveles.has(actual.id)) {
        if (nivel > niveles.get(actual.id)!) {
          niveles.set(actual.id, nivel);
        }
      } else {
        niveles.set(actual.id, nivel);
      }

      this.conexiones
        .filter((c) => c.destino.id === actual.id)
        .forEach((c) => {
          cola.push([c.origen, nivel + 1]);
        });
    }

    return Math.max(...Array.from(niveles.values()));
  }

  private calcularRutaCritica(): void {
    // 1. Obtener orden topológico validado
    const ordenTopologico = this.obtenerOrdenTopologico();

    if (!ordenTopologico) {
      this.mostrarError('No se puede calcular ruta crítica en grafos cíclicos');
      return;
    }

    // 2. Calcular tiempos con el nuevo enfoque
    const tiemposTempranos = new Map<string, number>();
    const tiemposTardios = new Map<string, number>();

    // Inicializar tiempos tempranos
    this.nodos.forEach((nodo) => tiemposTempranos.set(nodo.id, 0));

    // Calcular tiempos tempranos en orden topológico
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

    // Calcular tiempos tardíos en orden inverso
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

    // 3. Calcular holguras y rutas críticas
    this.conexiones.forEach((conexion) => {
      const holgura =
        tiemposTardios.get(conexion.destino.id)! -
        (tiemposTempranos.get(conexion.origen.id)! + conexion.peso);

      conexion.holgura = holgura;
      conexion.rutaCritica = holgura === 0;

      // Actualizar colores de nodos relacionados
      this.actualizarEstadoNodos(conexion);
    });

    // 4. Validar consistencia final
    if (
      this.conexiones.some((c) => c.holgura === null || c.holgura === undefined)
    ) {
      this.mostrarError('Error en cálculo de holguras');
    }
  }

  private actualizarEstadoNodos(conexion: Conexion): void {
    [conexion.origen, conexion.destino].forEach((nodo) => {
      nodo.esCritico = this.conexiones.some(
        (c) => (c.origen === nodo || c.destino === nodo) && c.rutaCritica,
      );
    });
  }

  // Método para obtener orden topológico (Kahn's algorithm)
  private obtenerOrdenTopologico(): Nodo[] | null {
    const gradosEntrada: Map<string, number> = new Map();
    const nodosSinEntradas: Nodo[] = [];
    const orden: Nodo[] = [];

    // Inicializar grados de entrada
    this.nodos.forEach((nodo) => gradosEntrada.set(nodo.id, 0));
    this.conexiones.forEach((conexion) => {
      gradosEntrada.set(
        conexion.destino.id,
        (gradosEntrada.get(conexion.destino.id) || 0) + 1,
      );
    });

    // Encontrar nodos iniciales
    this.nodos.forEach((nodo) => {
      if (gradosEntrada.get(nodo.id) === 0) {
        nodosSinEntradas.push(nodo);
      }
    });

    // Procesar nodos
    while (nodosSinEntradas.length > 0) {
      const nodo = nodosSinEntradas.shift()!;
      orden.push(nodo);

      this.conexiones
        .filter((c) => c.origen.id === nodo.id)
        .forEach((c) => {
          const gradoActual = gradosEntrada.get(c.destino.id)! - 1;
          gradosEntrada.set(c.destino.id, gradoActual);

          if (gradoActual === 0) {
            nodosSinEntradas.push(c.destino);
          }
        });
    }

    // Verificar si hay ciclo
    if (orden.length !== this.nodos.length) {
      return null;
    }

    return orden;
  }

  // Cálculo de tiempos usando orden topológico
  private calcularTiempos(ordenTopologico: Nodo[]): void {
    const tiemposTempranos = new Map<string, number>();
    const tiemposTardios = new Map<string, number>();

    // Inicializar tiempos
    this.nodos.forEach((nodo) => {
      tiemposTempranos.set(nodo.id, 0);
      tiemposTardios.set(nodo.id, 0);
    });

    // Cálculo de tiempos tempranos
    ordenTopologico.forEach((nodo) => {
      this.conexiones
        .filter((c) => c.origen.id === nodo.id)
        .forEach((c) => {
          const nuevoTiempo = tiemposTempranos.get(nodo.id)! + c.peso;
          if (nuevoTiempo > tiemposTempranos.get(c.destino.id)!) {
            tiemposTempranos.set(c.destino.id, nuevoTiempo);
          }
        });
    });

    // Cálculo de tiempos tardíos (en orden inverso)
    const tiempoMaximo = Math.max(...Array.from(tiemposTempranos.values()));
    const ordenInverso = [...ordenTopologico].reverse();

    ordenInverso.forEach((nodo) => {
      tiemposTardios.set(nodo.id, tiempoMaximo);

      this.conexiones
        .filter((c) => c.destino.id === nodo.id)
        .forEach((c) => {
          const nuevoTiempo = tiemposTardios.get(nodo.id)! - c.peso;
          if (nuevoTiempo < tiemposTardios.get(c.origen.id)!) {
            tiemposTardios.set(c.origen.id, nuevoTiempo);
          }
        });
    });

    // Calcular holguras
    this.conexiones.forEach((c) => {
      const holgura =
        tiemposTardios.get(c.destino.id)! -
        (tiemposTempranos.get(c.origen.id)! + c.peso);
      c.holgura = holgura;
      c.rutaCritica = holgura === 0;
    });
  }

  // Método mejorado para detección de ciclos (DFS)
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
