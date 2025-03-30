import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  inject,
  Input,
  Output,
  ViewChild,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { ModalContentComponent } from './modal-content';
import { ButtonBarComponent } from '../button-bar';
import { FormsModule } from '@angular/forms';
import { Conexion, Nodo } from '@app/models';
import { MatMenu, MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { AdjacencyMatrixComponent } from '../adjacency-matrix';
import { ColorService } from '@app/services/color';
import { ExportImportService } from '@app/services/export-import';
import { UndoRedoService } from '@app/services/undo-redo';

@Component({
  selector: 'app-my-canvas',
  imports: [
    MatButtonModule,
    ButtonBarComponent,
    FormsModule,
    MatMenuModule,
    AdjacencyMatrixComponent,
  ],
  templateUrl: './my-canvas.component.html',
  styleUrl: './my-canvas.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyCanvasComponent {
  private cdr: ChangeDetectorRef = inject(ChangeDetectorRef);
  private colorService: ColorService = inject(ColorService);
  private exportImportService: ExportImportService =
    inject(ExportImportService);
  private undoRedoService: UndoRedoService = inject(UndoRedoService);

  @Input() forceDirected: boolean = false; // Para forzar conexiones dirigidas

  @ViewChild('canvasMenu') canvasMenu!: MatMenu;
  @ViewChild('nodeMenu') nodeMenu!: MatMenu;
  @ViewChild('connectionMenu') connectionMenu!: MatMenu;
  @ViewChild('menuTrigger') menuTrigger!: MatMenuTrigger;
  menuPosition = { x: '0', y: '0' };
  selectedElement: {
    type: 'node' | 'connection' | 'canvas';
    data: any;
  } | null = null;

  @ViewChild('myCanvas', { static: true })
  canvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('fileInput', { static: false })
  fileInput!: ElementRef<HTMLInputElement>;
  readonly dialog = inject(MatDialog);
  modes: { [key: string]: boolean } = {
    move: false,
    delete: false,
    connect: false,
    add: false,
    edit: false,
  };
  modoConexion: boolean = false;
  private contador: number = 0;
  public nodos: Nodo[] = [];
  public conexiones: Conexion[] = [];
  arcoDirigido = false;
  peso = 0;
  private primerNodoSeleccionado: number | null = null;
  private segundoNodoSeleccionado: number | null = null;
  mostrarModal = false;
  colorFondo: string = '#ffffff';
  private radio: number = 30;

  @Output() actualizarMatriz = new EventEmitter<void>();
  @Output() nodosActualizados = new EventEmitter<Nodo[]>();
  @Output() conexionActualizada = new EventEmitter<Conexion[]>();

  // Maneja el cambio de modo de la herramienta seleccionada
  onModeToggled(event: { id: string; active: boolean }) {
    Object.keys(this.modes).forEach((key) => {
      this.modes[key] = false;
    });

    this.modes[event.id] = event.active;
    this.nodos.forEach((c) => (c.selected = false));
    this.primerNodoSeleccionado = null;

    const canvas = document.querySelector('canvas');
    const ctx = canvas?.getContext('2d');
    if (ctx) {
      this.dibujarNodo(ctx);
    }
    this.guardarEstado();
  }

  // Crea un nuevo nodo en la posición donde se realizó doble clic
  dobleClickCanvas(event: MouseEvent): void {
    const canvas = <HTMLCanvasElement>event.target;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      this.contador++;
      this.nodos.push(
        new Nodo(
          x,
          y,
          this.radio,
          this.contador,
          false,
          'Nodo ' + this.contador,
        ),
      );
      this.dibujarNodo(ctx);
      this.guardarEstado();
    }
  }

  // Maneja los eventos de clic en el canvas para diferentes modos (conexión, eliminación)
  clickCanvas(event: MouseEvent): void {
    const canvas = <HTMLCanvasElement>event.target;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      if (this.modes['connect']) {
        this.manejarConexion(x, y, ctx);
      } else if (this.modes['delete']) {
        this.manejarEliminacion(x, y, ctx);
      }
    }
  }

  // Gestiona la selección de nodos para crear conexiones entre ellos
  private manejarConexion(
    x: number,
    y: number,
    ctx: CanvasRenderingContext2D,
  ): void {
    const nodoSeleccionado = this.nodos.find(
      (nodo) =>
        Math.sqrt(Math.pow(x - nodo.x, 2) + Math.pow(y - nodo.y, 2)) <
        nodo.radio,
    );
    if (nodoSeleccionado) {
      if (this.primerNodoSeleccionado === null) {
        this.primerNodoSeleccionado = nodoSeleccionado.contador;
        nodoSeleccionado.selected = true;
      } else {
        // Validamos que no sea el mismo nodo
        if (nodoSeleccionado.contador === this.primerNodoSeleccionado) {
          alert('No se puede conectar un nodo consigo mismo');
          this.limpiarSeleccion();
          return;
        }

        // Validar que no exista ninguna conexión entre estos nodos
        const existeConexion = this.conexiones.some(
          (conn) =>
            (conn.desde === this.primerNodoSeleccionado &&
              conn.hasta === nodoSeleccionado.contador) ||
            (conn.desde === nodoSeleccionado.contador &&
              conn.hasta === this.primerNodoSeleccionado),
        );

        if (existeConexion) {
          alert('Ya existe una conexión entre estos nodos');
          this.limpiarSeleccion();
          return;
        }

        this.segundoNodoSeleccionado = nodoSeleccionado.contador;
        this.showModal();
      }
      this.dibujarNodo(ctx);
      this.actualizarMatriz.emit();
      this.guardarEstado();
    }
  }

  // Elimina nodos y sus conexiones asociadas o elimina conexiones individuales
  private manejarEliminacion(
    x: number,
    y: number,
    ctx: CanvasRenderingContext2D,
  ): void {
    const nodoIndex = this.nodos.findIndex(
      (circulo) =>
        Math.sqrt(Math.pow(x - circulo.x, 2) + Math.pow(y - circulo.y, 2)) <=
        circulo.radio,
    );

    if (nodoIndex !== -1) {
      const nodoEliminado = this.nodos[nodoIndex];

      // Eliminar las conexiones relacionadas con el nodo
      this.conexiones = this.conexiones.filter(
        (conexion) =>
          conexion.desde !== nodoEliminado.contador &&
          conexion.hasta !== nodoEliminado.contador,
      );

      // Eliminar el nodo
      this.nodos.splice(nodoIndex, 1);

      // Reordenar los contadores de los nodos restantes
      this.nodos.forEach((nodo, index) => {
        const nuevoContador = index + 1;

        // Actualizar las conexiones que referencian a este nodo
        this.conexiones.forEach((conexion) => {
          if (conexion.desde > nodoEliminado.contador) {
            conexion.desde--;
          }
          if (conexion.hasta > nodoEliminado.contador) {
            conexion.hasta--;
          }
        });

        nodo.contador = nuevoContador;
        nodo.nombre = `Nodo ${nuevoContador}`;
      });

      // Actualizar el contador general
      this.contador = this.nodos.length;
    } else {
      const conexionIndex = this.conexiones.findIndex((conexion) => {
        const desde = this.nodos.find((c) => c.contador === conexion.desde);
        const hasta = this.nodos.find((c) => c.contador === conexion.hasta);
        if (desde && hasta) {
          return this.estaCercaDeConexion(
            x,
            y,
            desde.x,
            desde.y,
            hasta.x,
            hasta.y,
            conexion,
          );
        }
        return false;
      });

      if (conexionIndex !== -1) {
        this.conexiones.splice(conexionIndex, 1);
      }
    }
    this.dibujarNodo(ctx);
    this.actualizarMatriz.emit();
    this.guardarEstado();
  }

  // Verifica si un punto (x,y) está cerca de una conexión, ya sea recta o curva
  private estaCercaDeConexion(
    x: number,
    y: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    conexion: { desde: number; hasta: number },
  ): boolean {
    // Si es una autoconexión (bucle)
    if (conexion.desde === conexion.hasta) {
      const nodo = this.nodos.find((n) => n.contador === conexion.desde);
      if (nodo) {
        // Verificar si el punto está cerca del peso del bucle
        const pesoX = nodo.x;
        const pesoY = nodo.y - nodo.radio * 2;
        const distanciaPeso = Math.sqrt(
          Math.pow(x - pesoX, 2) + Math.pow(y - pesoY, 2),
        );
        if (distanciaPeso <= 10) {
          // 10 pixels de tolerancia para detectar clic en el peso
          return true;
        }

        // Verificar si el punto está cerca del óvalo del bucle
        const dx = x - nodo.x;
        const dy = (y - (nodo.y - nodo.radio)) * 2;
        return dx * dx + dy * dy <= nodo.radio * nodo.radio + 25;
      }
      return false;
    }

    // Código existente para conexiones normales
    const bidireccional = this.conexiones.some(
      (c) => c.desde === conexion.hasta && c.hasta === conexion.desde,
    );
    if (bidireccional) {
      const controlX = (x1 + x2) / 2 + (y1 - y2) * 0.3;
      const controlY = (y1 + y2) / 2 + (x2 - x1) * 0.3;
      return this.estaCercaDeCurva(x, y, x1, y1, controlX, controlY, x2, y2);
    }
    return this.estaCercaDeLinea(x, y, x1, y1, x2, y2);
  }

  // Calcula la distancia entre un punto y una línea recta
  private estaCercaDeLinea(
    x: number,
    y: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
  ): boolean {
    const distancia =
      Math.abs((y2 - y1) * x - (x2 - x1) * y + x2 * y1 - y2 * x1) /
      Math.sqrt(Math.pow(y2 - y1, 2) + Math.pow(x2 - x1, 2));
    return distancia < 5;
  }

  // Determina si un punto está cerca de una curva cuadrática
  private estaCercaDeCurva(
    x: number,
    y: number,
    x1: number,
    y1: number,
    cx: number,
    cy: number,
    x2: number,
    y2: number,
  ): boolean {
    for (let t = 0; t <= 1; t += 0.05) {
      const px = (1 - t) * (1 - t) * x1 + 2 * (1 - t) * t * cx + t * t * x2;
      const py = (1 - t) * (1 - t) * y1 + 2 * (1 - t) * t * cy + t * t * y2;
      if (Math.sqrt((px - x) ** 2 + (py - y) ** 2) < 5) {
        return true;
      }
    }
    return false;
  }

  // Crea una nueva conexión entre dos nodos seleccionados
  confirmarConexion(datos: { peso: number; dirigido: boolean }) {
    if (
      this.primerNodoSeleccionado !== null &&
      this.segundoNodoSeleccionado !== null
    ) {
      const nuevaConexion = new Conexion(
        this.primerNodoSeleccionado,
        this.segundoNodoSeleccionado,
        datos.peso,
        this.forceDirected ? true : datos.dirigido,
      );
      nuevaConexion.dirigido = this.forceDirected ? true : datos.dirigido;
      this.conexiones.push(nuevaConexion);

      const nodoOrigen = this.nodos.find(
        (n) => n.contador === this.primerNodoSeleccionado,
      );
      if (nodoOrigen) {
        nodoOrigen.esOrigen = true;
      }
    }
    this.limpiarSeleccion();
    this.actualizarMatriz.emit();
  }

  cancelarConexion() {
    this.limpiarSeleccion();
  }

  //Limpia el estado de selección de nodos y actualiza el canvas
  private limpiarSeleccion() {
    this.nodos.forEach((c) => (c.selected = false));
    this.primerNodoSeleccionado = null;
    this.segundoNodoSeleccionado = null;
    this.mostrarModal = false;

    const canvas = document.querySelector('canvas');
    const ctx = canvas?.getContext('2d');
    if (ctx) {
      this.dibujarNodo(ctx);
    }
    this.actualizarMatriz.emit();
    this.guardarEstado();
  }

  //Dibuja todos los nodos y conexiones en el canvas
  dibujarNodo(ctx: CanvasRenderingContext2D): void {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    ctx.fillStyle = this.colorFondo;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // Asegurar que los arrays están sincronizados antes de dibujar
    console.log('Estado antes de dibujar:', {
      nodos: this.nodos.length,
      conexiones: this.conexiones.length,
    });
    this.conexiones.forEach((conexion) => {
      const desde = this.nodos.find((c) => c.contador === conexion.desde);
      const hasta = this.nodos.find((c) => c.contador === conexion.hasta);
      if (desde && hasta) {
        // Caso especial para autoconexiones
        if (conexion.desde === conexion.hasta) {
          this.dibujarBucle(ctx, desde, conexion);
        } else {
          const bidireccional = this.conexiones.some(
            (c) => c.desde === conexion.hasta && c.hasta === conexion.desde,
          );
          ctx.beginPath();
          let dx = hasta.x - desde.x;
          let dy = hasta.y - desde.y;
          let distancia = Math.sqrt(dx * dx + dy * dy);
          let radio = 20; // Ajusta el radio del nodo
          let offsetX = (dx / distancia) * radio;
          let offsetY = (dy / distancia) * radio;
          let startX = desde.x + offsetX;
          let startY = desde.y + offsetY;
          let endX = hasta.x - offsetX * 1.5;
          let endY = hasta.y - offsetY * 1.5;

          let midX, midY, controlX, controlY;
          const peso = conexion.peso ?? 0;
          if (bidireccional) {
            controlX = (startX + endX) / 2 + (startY - endY) * 0.3;
            controlY = (startY + endY) / 2 + (endX - startX) * 0.3;
            ctx.moveTo(startX, startY);
            ctx.quadraticCurveTo(controlX, controlY, endX, endY);
            midX = (startX + 2 * controlX + endX) / 4;
            midY = (startY + 2 * controlY + endY) / 4;
          } else {
            controlX = (startX + endX) / 2;
            controlY = (startY + endY) / 2;
            ctx.moveTo(startX, startY);
            ctx.lineTo(endX, endY);
            midX = controlX;
            midY = controlY;
          }
          if (midX !== undefined && midY !== undefined) {
            ctx.fillStyle = 'white';
            ctx.fillRect(midX - 10, midY - 10, 20, 20);
            ctx.fillStyle = 'black';
            ctx.fillText(peso.toString(), midX, midY);
          }
          ctx.strokeStyle = conexion.color || '#666';
          ctx.lineWidth = 2;
          ctx.stroke(); // Asegura que la arista se dibuje

          // Solo dibujar flecha si la conexión es dirigida
          if (conexion.dirigido) {
            this.dibujarFlecha(ctx, endX, endY, dx, dy);
          }

          // Dibuja la flecha de Andres
          //if (conexion.dirigido) {
          //  this.dibujarFlechaCurva(
          //    ctx,
          //    desde.x,
          //    desde.y,
          //    hasta.x,
          //    hasta.y,
          //    controlX,
          //    controlY,
          //  );
          //}
          // Dibujar el peso
          ctx.fillStyle = this.colorFondo;
          ctx.fillRect(midX - 10, midY - 10, 20, 20);
          ctx.font = '12px Arial';
          ctx.fillStyle = 'black';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(peso.toString(), midX, midY);
        }
      }
    });

    this.nodos.forEach((circulo) => {
      ctx.beginPath();
      ctx.arc(circulo.x, circulo.y, circulo.radio, 0, Math.PI * 2);
      ctx.fillStyle = circulo.selected ? '#ff9800' : circulo.color; // Color de relleno
      ctx.fill();
      ctx.strokeStyle = '#000000'; // Color del borde siempre negro
      ctx.lineWidth = 2; // Grosor del borde
      ctx.stroke();
      ctx.font = '20px Source Sans Pro,Arial,sans-serif';
      ctx.fillStyle = 'black';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        circulo.nombre || circulo.contador.toString(),
        circulo.x,
        circulo.y,
      );
    });

    // Emitir actualizaciones solo si hay cambios
    if (this.nodos && this.nodos.length > 0) {
      console.log('Emitiendo nodos desde canvas:', {
        total: this.nodos.length,
        detalles: this.nodos.map((n) => ({ id: n.contador, nombre: n.nombre })),
      });
      this.nodosActualizados.emit([...this.nodos]);
    }

    if (this.conexiones && this.conexiones.length > 0) {
      console.log('Emitiendo conexiones desde canvas:', {
        total: this.conexiones.length,
        detalles: this.conexiones.map((c) => ({
          desde: c.desde,
          hasta: c.hasta,
          peso: c.peso,
        })),
      });
      this.conexionActualizada.emit([...this.conexiones]);
    }

    this.actualizarMatriz.emit();
  }

  dibujarFlecha(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    dx: number,
    dy: number,
  ): void {
    const angulo = Math.atan2(dy, dx);
    const tamañoFlecha = 8;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(
      x - tamañoFlecha * Math.cos(angulo - Math.PI / 6),
      y - tamañoFlecha * Math.sin(angulo - Math.PI / 6),
    );
    ctx.moveTo(x, y);
    ctx.lineTo(
      x - tamañoFlecha * Math.cos(angulo + Math.PI / 6),
      y - tamañoFlecha * Math.sin(angulo + Math.PI / 6),
    );
    ctx.stroke();
  }

  private dibujarBucle(
    ctx: CanvasRenderingContext2D,
    nodo: Nodo,
    conexion: Conexion,
  ): void {
    const radio = nodo.radio;
    const centerX = nodo.x;
    const centerY = nodo.y;

    // Dibujamos un óvalo por encima del nodo
    ctx.beginPath();
    ctx.save();
    ctx.translate(centerX, centerY - radio);
    ctx.scale(1, 0.5);
    ctx.arc(0, 0, radio, 0, Math.PI * 2);
    ctx.restore();
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Si es dirigido, dibujamos la flecha
    if (conexion.dirigido) {
      // Calculamos el punto donde irá la flecha (en el borde inferior derecho del óvalo)
      const angle = Math.PI / 6; // 30 grados
      const arrowX = centerX + radio * Math.cos(angle);
      const arrowY = centerY - radio - radio * Math.sin(angle) * 0.5; // Multiplicamos por 0.5 debido al scale del óvalo

      // Calculamos el ángulo de la flecha basado en la tangente del óvalo en ese punto
      const tangentAngle = Math.PI / 2 - angle;

      // Dibujamos la punta de la flecha
      const headLen = 10;
      ctx.beginPath();
      ctx.moveTo(arrowX, arrowY);
      ctx.lineTo(
        arrowX - headLen * Math.cos(tangentAngle - Math.PI / 6),
        arrowY + headLen * Math.sin(tangentAngle - Math.PI / 6),
      );
      ctx.moveTo(arrowX, arrowY);
      ctx.lineTo(
        arrowX - headLen * Math.cos(tangentAngle + Math.PI / 6),
        arrowY + headLen * Math.sin(tangentAngle + Math.PI / 6),
      );
      ctx.strokeStyle = '#666';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Dibujamos el peso en el centro superior del bucle
    const peso = conexion.peso ?? 0;
    const pesoX = centerX;
    const pesoY = centerY - radio * 2;

    ctx.fillStyle = this.colorFondo;

    ctx.fillRect(pesoX - 10, pesoY - 10, 20, 20);
    ctx.font = '12px Arial';
    ctx.fillStyle = 'black';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(peso.toString(), pesoX, pesoY);
    this.actualizarMatriz.emit();
  }

  //Dibuja una flecha curva en el extremo de una conexión dirigida
  private dibujarFlechaCurva(
    ctx: CanvasRenderingContext2D,
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    ctrlX: number,
    ctrlY: number,
  ): void {
    const t = 0.9;
    const x = (1 - t) * (1 - t) * fromX + 2 * (1 - t) * t * ctrlX + t * t * toX;
    const y = (1 - t) * (1 - t) * fromY + 2 * (1 - t) * t * ctrlY + t * t * toY;
    const angle = Math.atan2(toY - y, toX - x);
    const headLen = 10;
    ctx.beginPath();
    ctx.moveTo(
      x - headLen * Math.cos(angle - Math.PI / 6),
      y - headLen * Math.sin(angle - Math.PI / 6),
    );
    ctx.lineTo(x, y);
    ctx.lineTo(
      x - headLen * Math.cos(angle + Math.PI / 6),
      y - headLen * Math.sin(angle + Math.PI / 6),
    );
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  // Cambia el color de fondo del canvas
  cambiarColorFondo(): void {
    this.colorService.cambiarColorFondo(
      this.canvas.nativeElement,
      this.colorFondo,
      (color: string) => {
        this.colorFondo = color;
        const ctx = this.canvas.nativeElement.getContext('2d');
        if (ctx) {
          this.dibujarNodo(ctx);
        }

        this.guardarEstado();
      },
    );
  }
  //Cambiar el color de un nodo
  cambiarColorNodo(): void {
    if (this.selectedElement?.type === 'node') {
      this.colorService.cambiarColorNodo(this.selectedElement.data, () => {
        const ctx = this.canvas.nativeElement.getContext('2d');
        if (ctx) {
          this.dibujarNodo(ctx);
        }

        this.guardarEstado();
      });
    }
  }

  // Abre un modal para configurar una nueva conexión
  showModal(): void {
    const dialogRef = this.dialog.open(ModalContentComponent, {
      height: '265px',
      width: '200px',
      data: {
        peso: this.peso,
        dirigido: this.forceDirected ? true : this.arcoDirigido,
        showDirectedOption: !this.forceDirected, // Ocultar opción si está forzado
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.confirmarConexion({
          peso: result.peso,
          dirigido: result.dirigido,
        });
      } else {
        this.cancelarConexion();
      }
    });
  }

  // Exporta el grafo actual a un archivo JSON
  async exportarJSON(): Promise<void> {
    await this.exportImportService.exportToJSON(this.nodos, this.conexiones);
  }

  // Activa el selector de archivos para importar un grafo
  seleccionarArchivo() {
    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    fileInput.click();
  }

  // Procesa el archivo seleccionado y carga el grafo
  async onFileSelected(event: any) {
    Object.keys(this.modes).forEach((key) => {
      this.modes[key] = false;
    });
    this.limpiarCanvas();

    const file = event.target.files[0];
    if (file) {
      try {
        const result = await this.exportImportService.importFromJSON(
          file,
          this.radio,
        );

        this.nodos = result.nodos;
        this.conexiones = result.conexiones.map((c: any) => {
          const conexion = Conexion.fromJSON(c);
          if (this.forceDirected) {
            conexion.dirigido = true;
          }
          return conexion;
        });
        this.contador = this.nodos.length;

        this.actualizarMatriz.emit();
        console.log('nodo', this.nodos);
        setTimeout(() => {
          this.dibujar();
          this.actualizarMatriz.emit();
          this.cdr.detectChanges();
        }, 10);
      } catch (error) {
        console.error('Error al procesar el archivo:', error);
      }
    }
  }

  // Dibuja el grafo completo en el canvas
  dibujar(): void {
    this.actualizarMatriz.emit();
    const ctx = this.canvas.nativeElement.getContext('2d');
    if (!ctx || this.nodos.length === 0) {
      return;
    }
    this.dibujarNodo(ctx);
    this.guardarEstado();
  }

  // Maneja el menú contextual al hacer clic derecho en el canvas
  menuContexto(event: MouseEvent) {
    event.preventDefault();

    const canvas = <HTMLCanvasElement>event.target;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Primero verifica si se hizo clic en un nodo
    const nodo = this.nodos.find(
      (n) => Math.sqrt(Math.pow(x - n.x, 2) + Math.pow(y - n.y, 2)) <= n.radio,
    );

    if (nodo) {
      this.selectedElement = { type: 'node', data: nodo };
    } else {
      // Si no es un nodo, verifica si es una conexión
      const conexion = this.conexiones.find((c) => {
        const desde = this.nodos.find((n) => n.contador === c.desde);
        const hasta = this.nodos.find((n) => n.contador === c.hasta);
        if (desde && hasta) {
          return this.estaCercaDeConexion(
            x,
            y,
            desde.x,
            desde.y,
            hasta.x,
            hasta.y,
            c,
          );
        }
        return false;
      });

      if (conexion) {
        this.selectedElement = { type: 'connection', data: conexion };
      } else {
        this.selectedElement = { type: 'canvas', data: null };
      }
    }

    if (this.menuTrigger) {
      this.menuTrigger.menuData = { selectedElement: this.selectedElement };
      this.menuPosition = {
        x: `${event.clientX}px`,
        y: `${event.clientY}px`,
      };
      this.menuTrigger.openMenu();
    }
  }
  // Permite editar el nombre de un nodo seleccionado
  editarNombre(): void {
    if (this.selectedElement?.type === 'node') {
      const nodo = this.selectedElement.data;
      const nuevoNombre = prompt('Ingrese el nuevo nombre:', nodo.nombre);
      if (nuevoNombre !== null) {
        nodo.nombre = nuevoNombre;
        const ctx = this.canvas.nativeElement.getContext('2d');
        if (ctx) {
          this.dibujarNodo(ctx);
        }
        this.actualizarMatriz.emit();
        this.guardarEstado();
      }
    }
  }

  // Elimina un nodo seleccionado y sus conexiones
  eliminarNodo(): void {
    if (this.selectedElement?.type === 'node') {
      const nodo = this.selectedElement.data;
      this.nodos = this.nodos.filter((n) => n.contador !== nodo.contador);
      this.conexiones = this.conexiones.filter(
        (c) => c.desde !== nodo.contador && c.hasta !== nodo.contador,
      );
      const ctx = this.canvas.nativeElement.getContext('2d');
      if (ctx) {
        this.dibujarNodo(ctx);
      }
      this.actualizarMatriz.emit();
      this.guardarEstado();
    }
  }

  // Edita el peso de una conexión seleccionada
  editarPeso(): void {
    if (this.selectedElement?.type === 'connection') {
      const conexion = this.selectedElement.data;
      const nuevoPeso = prompt(
        'Ingrese el nuevo peso:',
        conexion.peso?.toString(),
      );
      if (nuevoPeso !== null) {
        if (isNaN(Number(nuevoPeso))) {
          alert('Ingrese un numero valido');
          return;
        }
        conexion.peso = Number(nuevoPeso);
        const ctx = this.canvas.nativeElement.getContext('2d');
        if (ctx) {
          this.dibujarNodo(ctx);
        }
      }
      this.actualizarMatriz.emit();
      this.guardarEstado();
    }
  }

  // Cambia la dirección de una conexión seleccionada
  toggleDirigido(): void {
    if (this.selectedElement?.type === 'connection') {
      const conexion = this.selectedElement.data;
      conexion.dirigido = !conexion.dirigido;
      const ctx = this.canvas.nativeElement.getContext('2d');
      if (ctx) {
        this.dibujarNodo(ctx);
      }
      this.actualizarMatriz.emit();
      this.guardarEstado();
    }
  }

  // Elimina una conexión seleccionada
  eliminarConexion(): void {
    if (this.selectedElement?.type === 'connection') {
      const conexion = this.selectedElement.data;
      this.conexiones = this.conexiones.filter(
        (c) => !(c.desde === conexion.desde && c.hasta === conexion.hasta),
      );
      const ctx = this.canvas.nativeElement.getContext('2d');
      if (ctx) {
        this.dibujarNodo(ctx);
      }
      this.guardarEstado();
    }
  }

  // Limpia completamente el canvas y reinicia el estado del grafo
  limpiarCanvas() {
    // Reiniciamos todos los datos
    this.nodos = [];
    this.conexiones = [];
    this.contador = 0;

    const ctx = this.canvas.nativeElement.getContext('2d');
    if (ctx) {
      // Limpiamos el canvas completamente
      ctx.fillStyle = this.colorFondo;
      ctx.fillRect(
        0,
        0,
        this.canvas.nativeElement.width,
        this.canvas.nativeElement.height,
      );
    }

    // Notificamos que los datos han sido limpiados
    this.nodosActualizados.emit([]);
    this.conexionActualizada.emit([]);
    this.actualizarMatriz.emit();
  }

  undo(): void {
    const estadoAnterior = this.undoRedoService.undo();
    if (estadoAnterior) {
      this.nodos = estadoAnterior.nodos;
      this.conexiones = estadoAnterior.conexiones;
      this.contador = estadoAnterior.contador;

      const ctx = this.canvas.nativeElement.getContext('2d');
      if (ctx) {
        this.dibujarNodo(ctx);
      }
      this.actualizarMatriz.emit();
      this.guardarEstado();
    }
  }

  // Método para rehacer la última acción deshecha
  redo(): void {
    const estadoSiguiente = this.undoRedoService.redo();
    if (estadoSiguiente) {
      this.nodos = estadoSiguiente.nodos;
      this.conexiones = estadoSiguiente.conexiones;
      this.contador = estadoSiguiente.contador;

      const ctx = this.canvas.nativeElement.getContext('2d');
      if (ctx) {
        this.dibujarNodo(ctx);
      }
      this.actualizarMatriz.emit();
      this.guardarEstado();
    }
  }

  // Método para guardar el estado actual
  private guardarEstado(): void {
    this.undoRedoService.guardarEstado(
      this.nodos,
      this.conexiones,
      this.contador,
    );
  }
}
