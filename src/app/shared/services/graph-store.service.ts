import { Injectable, signal, computed, inject } from '@angular/core';
import { Nodo } from '@app/models/Nodo.model';
import { Conexion } from '@app/models/Conexion.model';
import { UndoRedoService } from '@app/services/undo-redo/undo-redo.service';
import { puntoEnNodo } from './graph-geometry';

@Injectable({ providedIn: 'root' })
export class GraphStoreService {
  private undoRedoService = inject(UndoRedoService);

  readonly nodos = signal<Nodo[]>([]);
  readonly conexiones = signal<Conexion[]>([]);
  readonly contador = signal(0);

  readonly primerNodoSeleccionado = signal<number | null>(null);
  readonly segundoNodoSeleccionado = signal<number | null>(null);

  readonly puedeUndo = computed(() => this.undoRedoService.puedeUndo());
  readonly puedeRedo = computed(() => this.undoRedoService.puedeRedo());

  addNodo(nodo: Nodo): void {
    this.nodos.update(n => [...n, nodo]);
    this.contador.update(c => c + 1);
    this.saveSnapshot();
  }

  addNodoAt(x: number, y: number, radio: number, color: string = '#2196f3', nombre?: string): Nodo {
    const contador = this.contador() + 1;
    const nodo = new Nodo(x, y, radio, contador, false, nombre ?? `Nodo ${contador}`, 0, color);
    this.addNodo(nodo);
    return nodo;
  }

  removeNodo(contador: number): void {
    this.nodos.update(nodos => nodos.filter(n => n.contador !== contador));
    this.conexiones.update(conexiones =>
      conexiones.filter(c => c.desde !== contador && c.hasta !== contador)
    );
    this.reindexar();
    this.saveSnapshot();
  }

  addConexion(conexion: Conexion): void {
    this.conexiones.update(c => [...c, conexion]);
    this.saveSnapshot();
  }

  removeConexion(desde: number, hasta: number): void {
    this.conexiones.update(conexiones =>
      conexiones.filter(c => !(c.desde === desde && c.hasta === hasta))
    );
    this.saveSnapshot();
  }

  removeAllForNode(contador: number): void {
    this.conexiones.update(conexiones =>
      conexiones.filter(c => c.desde !== contador && c.hasta !== contador)
    );
    this.saveSnapshot();
  }

  clear(): void {
    this.nodos.set([]);
    this.conexiones.set([]);
    this.contador.set(0);
    this.limpiarSeleccion();
    this.undoRedoService.limpiarHistorial();
  }

  limpiarSeleccion(): void {
    this.nodos.update(nodos => {
      nodos.forEach(n => (n.selected = false));
      return [...nodos];
    });
    this.primerNodoSeleccionado.set(null);
    this.segundoNodoSeleccionado.set(null);
  }

  undo(): void {
    const estado = this.undoRedoService.undo();
    if (estado) {
      this.nodos.set(estado.nodos);
      this.conexiones.set(estado.conexiones);
      this.contador.set(estado.contador);
      this.limpiarSeleccion();
    }
  }

  redo(): void {
    const estado = this.undoRedoService.redo();
    if (estado) {
      this.nodos.set(estado.nodos);
      this.conexiones.set(estado.conexiones);
      this.contador.set(estado.contador);
      this.limpiarSeleccion();
    }
  }

  private reindexar(): void {
    const nodosActuales = this.nodos();

    // Build old→new counter mapping BEFORE mutating nodes
    const counterMap = new Map<number, number>();
    nodosActuales.forEach((nodo, index) => {
      counterMap.set(nodo.contador, index + 1);
    });

    // Reindex nodes
    nodosActuales.forEach((nodo, index) => {
      const nuevoContador = index + 1;
      nodo.contador = nuevoContador;
      nodo.nombre = `Nodo ${nuevoContador}`;
    });
    this.nodos.set([...nodosActuales]);

    // Reindex connections using the mapping
    this.conexiones.update(conexiones =>
      conexiones.map(c => {
        const newDesde = counterMap.get(c.desde) ?? c.desde;
        const newHasta = counterMap.get(c.hasta) ?? c.hasta;
        return Conexion.fromJSON({ ...c.toJSON(), desde: newDesde, hasta: newHasta });
      })
    );
  }

  saveSnapshot(): void {
    this.undoRedoService.guardarEstado(
      this.nodos(),
      this.conexiones(),
      this.contador()
    );
  }

  findNodeAt(x: number, y: number): Nodo | undefined {
    return this.nodos().find(n => puntoEnNodo(x, y, n.x, n.y, n.radio));
  }

  trySelectForConnection(
    x: number,
    y: number,
    bidirectional: boolean = true,
  ): { found: boolean; ready: boolean; desde: number; hasta: number } | null {
    const nodoSeleccionado = this.findNodeAt(x, y);
    if (!nodoSeleccionado) return null;

    if (this.primerNodoSeleccionado() === null) {
      this.primerNodoSeleccionado.set(nodoSeleccionado.contador);
      nodoSeleccionado.selected = true;
      return { found: true, ready: false, desde: 0, hasta: 0 };
    }

    const desde = this.primerNodoSeleccionado()!;
    const hasta = nodoSeleccionado.contador;

    if (desde === hasta) {
      return { found: true, ready: false, desde, hasta };
    }

    const existeConexion = bidirectional
      ? this.conexiones().some(c =>
          (c.desde === desde && c.hasta === hasta) ||
          (c.desde === hasta && c.hasta === desde))
      : this.conexiones().some(c => c.desde === desde && c.hasta === hasta);

    if (existeConexion) {
      return { found: true, ready: false, desde, hasta };
    }

    this.segundoNodoSeleccionado.set(hasta);
    return { found: true, ready: true, desde, hasta };
  }

  importFromJSON(json: any, defaultRadio: number = 30): void {
    const loadedNodos: Nodo[] = [];
    if (Array.isArray(json.nodos)) {
      json.nodos.forEach((n: any, idx: number) => {
        loadedNodos.push(new Nodo(
          n.x ?? n._x,
          n.y ?? n._y,
          n.radio ?? defaultRadio,
          n.contador ?? n._contador ?? idx + 1,
          n.selected ?? n._selected ?? false,
          n.nombre ?? n._nombre ?? String.fromCharCode(65 + idx),
          n.valor ?? n.peso ?? n._valor ?? n._peso ?? 0,
          n.color ?? n._color ?? '#2196f3',
        ));
      });
    }

    const loadedConexiones: Conexion[] = [];
    if (Array.isArray(json.conexiones)) {
      json.conexiones.forEach((c: any) => {
        const desde = c.desde ?? c._desde;
        const hasta = c.hasta ?? c._hasta;
        if (desde !== undefined && hasta !== undefined) {
          const conn = new Conexion(
            desde, hasta,
            c.peso ?? c._peso ?? 0,
            c.dirigido ?? c._dirigido ?? false,
          );
          conn.color = c.color ?? c._color ?? '#666';
          loadedConexiones.push(conn);
        }
      });
    }

    this.nodos.set(loadedNodos);
    this.conexiones.set(loadedConexiones);
    this.contador.set(
      loadedNodos.length > 0
        ? Math.max(...loadedNodos.map(n => n.contador))
        : 0
    );
    this.limpiarSeleccion();
    this.saveSnapshot();
  }
}
