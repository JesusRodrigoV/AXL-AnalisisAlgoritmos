import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  ViewChild,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { ModalContentComponent } from './modal-content';
import { ButtonBarComponent } from '../button-bar';
import { FormsModule } from '@angular/forms';
import { Conexion, Nodo } from '@app/models';
import { MatMenu, MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-my-canvas',
  imports: [
    MatButtonModule,
    ModalContentComponent,
    ButtonBarComponent,
    FormsModule,
    MatMenuModule,
    MatIconModule,
    NgIf,
  ],
  templateUrl: './my-canvas.component.html',
  styleUrl: './my-canvas.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyCanvasComponent {
  @ViewChild('canvasMenu') canvasMenu!: MatMenu;
  @ViewChild('nodeMenu') nodeMenu!: MatMenu;
  @ViewChild('connectionMenu') connectionMenu!: MatMenu;
  @ViewChild('menuTrigger', { static: true }) menuTrigger: any;
  @ViewChild(MatMenu) menu!: MatMenu;
  menuPosition = { x: '0px', y: '0px' };
  selectedElement: { type: 'node' | 'connection'; data: any } | null = null;

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
  private nodos: Nodo[] = [];
  private conexiones: Conexion[] = [];
  arcoDirigido = false;
  peso = 0;
  private primerNodoSeleccionado: number | null = null;
  private segundoNodoSeleccionado: number | null = null;
  mostrarModal = false;
  colorFondo: string = '#ffffff';
  private radio: number = 30;

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
      } else if (this.primerNodoSeleccionado !== nodoSeleccionado.contador) {
        this.segundoNodoSeleccionado = nodoSeleccionado.contador;
        this.showModal();
      }
      this.dibujarNodo(ctx);
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

      this.conexiones = this.conexiones.filter(
        (conexion) =>
          conexion.desde !== nodoEliminado.contador &&
          conexion.hasta !== nodoEliminado.contador,
      );

      this.nodos.splice(nodoIndex, 1);
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
      this.conexiones.push(
        new Conexion(
          this.primerNodoSeleccionado,
          this.segundoNodoSeleccionado,
          datos.peso,
          datos.dirigido,
        ),
      );
    }
    this.limpiarSeleccion();
  }

  //Cancela la conexión en proceso y limpia la selección
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
  }

  //Dibuja todos los nodos y conexiones en el canvas
  dibujarNodo(ctx: CanvasRenderingContext2D): void {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    this.conexiones.forEach((conexion) => {
      const desde = this.nodos.find((c) => c.contador === conexion.desde);
      const hasta = this.nodos.find((c) => c.contador === conexion.hasta);
      if (desde && hasta) {
        const bidireccional = this.conexiones.some(
          (c) => c.desde === conexion.hasta && c.hasta === conexion.desde,
        );
        ctx.beginPath();
        let midX, midY, controlX, controlY;
        if (bidireccional) {
          controlX = (desde.x + hasta.x) / 2 + (desde.y - hasta.y) * 0.3;
          controlY = (desde.y + hasta.y) / 2 + (hasta.x - desde.x) * 0.3;
          ctx.moveTo(desde.x, desde.y);
          ctx.quadraticCurveTo(controlX, controlY, hasta.x, hasta.y);
          midX = (desde.x + 2 * controlX + hasta.x) / 4;
          midY = (desde.y + 2 * controlY + hasta.y) / 4;
        } else {
          controlX = (desde.x + hasta.x) / 2;
          controlY = (desde.y + hasta.y) / 2;
          ctx.moveTo(desde.x, desde.y);
          ctx.lineTo(hasta.x, hasta.y);
          midX = controlX;
          midY = controlY;
        }
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 2;
        ctx.stroke();

        if (conexion.dirigido) {
          this.dibujarFlechaCurva(
            ctx,
            desde.x,
            desde.y,
            hasta.x,
            hasta.y,
            controlX,
            controlY,
          );
        }
        const peso = conexion.peso ?? 0;
        ctx.fillStyle = 'white';
        ctx.fillRect(midX - 10, midY - 10, 20, 20);
        ctx.font = '12px Arial';
        ctx.fillStyle = 'black';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(peso.toString(), midX, midY);
      }
    });

    this.nodos.forEach((circulo) => {
      ctx.beginPath();
      ctx.arc(circulo.x, circulo.y, circulo.radio, 0, Math.PI * 2);
      ctx.fillStyle = circulo.selected ? '#ff9800' : 'yellow';
      ctx.fill();
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
  cambiarColorFondo() {
    const contexto = this.canvas.nativeElement.getContext('2d');
    if (contexto) {
      contexto.fillStyle = this.colorFondo;
      contexto.fillRect(
        0,
        0,
        this.canvas.nativeElement.width,
        this.canvas.nativeElement.height,
      );
    }
  }

  // Abre un modal para configurar una nueva conexión
  showModal(): void {
    const dialogRef = this.dialog.open(ModalContentComponent, {
      height: '265px',
      width: '200px',
      data: { peso: this.peso, dirigido: this.arcoDirigido },
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
  exportarJSON(): void {
    const data = {
      nodos: this.nodos,
      conexiones: this.conexiones,
    };
    const jsonData = JSON.stringify(data, null, 2);

    const fileName = prompt(
      'Ingrese el nombre del archivo (sin extensión):',
      'grafo',
    );
    if (!fileName) {
      return;
    }

    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Activa el selector de archivos para importar un grafo
  seleccionarArchivo() {
    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    fileInput.click();
  }

  // Procesa el archivo seleccionado y carga el grafo
  onFileSelected(event: any) {
    Object.keys(this.modes).forEach((key) => {
      this.modes[key] = false;
    });
    this.limpiarCanvas();
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        try {
          const json = JSON.parse(e.target.result);

          this.nodos = [];
          this.conexiones = [];

          if (Array.isArray(json.nodos)) {
            json.nodos.forEach((nodo: any) => {
              this.nodos.push(
                new Nodo(
                  nodo._x,
                  nodo._y,
                  this.radio,
                  nodo.contador || this.nodos.length + 1,
                  false,
                  nodo._nombre,
                ),
              );
            });
          }

          this.contador = this.nodos.length;

          if (Array.isArray(json.conexiones)) {
            json.conexiones.forEach((conexion: any) => {
              const desde = conexion._desde || conexion.desde;
              const hasta = conexion._hasta || conexion.hasta;
              const peso = conexion._peso ?? conexion.peso ?? 0;
              const dirigido = conexion._dirigido ?? conexion.dirigido ?? false;

              if (desde !== undefined && hasta !== undefined) {
                this.conexiones.push(
                  new Conexion(desde, hasta, peso, dirigido),
                );
              }
            });
          }

          setTimeout(() => {
            this.dibujar();
          }, 100);
        } catch (error) {
          console.error('Error al procesar el archivo:', error);
        }
      };
      reader.readAsText(file);
    }
  }

  // Dibuja el grafo completo en el canvas
  dibujar() {
    const canvas = this.canvas.nativeElement;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (this.nodos.length === 0) {
      return;
    }

    this.dibujarNodo(ctx);
  }

  // Maneja el menú contextual al hacer clic derecho en el canvas
  menuContexto(event: MouseEvent) {
    event.preventDefault();

    const canvas = <HTMLCanvasElement>event.target;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    this.menuPosition = {
      x: `${event.clientX + window.scrollX}px`,
      y: `${event.clientY + window.scrollY}px`,
    };

    const nodo = this.nodos.find(
      (n) => Math.sqrt(Math.pow(x - n.x, 2) + Math.pow(y - n.y, 2)) <= n.radio,
    );

    if (nodo) {
      this.selectedElement = { type: 'node', data: nodo };
      if (this.menuTrigger) {
        this.menuTrigger.openMenu();
      }
      return;
    }

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
      if (this.menuTrigger) {
        this.menuTrigger.openMenu();
      }
      return;
    }

    this.selectedElement = null;
    if (this.menuTrigger) {
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
        conexion.peso = Number(nuevoPeso);
        const ctx = this.canvas.nativeElement.getContext('2d');
        if (ctx) {
          this.dibujarNodo(ctx);
        }
      }
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
    }
  }

  // Limpia completamente el canvas y reinicia el estado del grafo
  limpiarCanvas() {
    const canvas = document.getElementById('myCanvas') as HTMLCanvasElement;
    const context = canvas.getContext('2d');
    if (context) {
      context.clearRect(0, 0, canvas.width, canvas.height);
    }
    this.nodos = [];
    this.conexiones = [];
    this.contador = 0;
  }
}
