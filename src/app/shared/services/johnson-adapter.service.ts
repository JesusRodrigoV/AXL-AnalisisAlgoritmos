import { Injectable, inject } from '@angular/core';
import { GraphStoreService } from './graph-store.service';
import { Nodo } from '@app/models/Nodo.model';
import { Conexion } from '@app/models/Conexion.model';
import {
  Nodo as JohnsonNodo,
} from '@app/pages/johnson/models/nodo.model.jonson';
import {
  Conexion as JohnsonConexion,
} from '@app/pages/johnson/models/conexion.model.jonson';

@Injectable({ providedIn: 'root' })
export class JohnsonAdapterService {
  private store = inject(GraphStoreService);

  private idToContador = new Map<string, number>();
  private contadorToId = new Map<number, string>();

  pushToStore(
    johnsonNodos: JohnsonNodo[],
    johnsonConexiones: JohnsonConexion[],
  ): void {
    this.idToContador.clear();
    this.contadorToId.clear();

    const unifiedNodos: Nodo[] = johnsonNodos.map((jn, idx) => {
      const contador = idx + 1;
      this.idToContador.set(jn.id, contador);
      this.contadorToId.set(contador, jn.id);

      const nodo = new Nodo(
        jn.x,
        jn.y,
        30,
        contador,
        false,
        jn.label,
        0,
        '#2196F3',
      );
      nodo.tiempoInicio = jn.tiempoInicio;
      nodo.tiempoFin = jn.tiempoFin;
      nodo.esCritico = jn.esCritico;
      return nodo;
    });

    const unifiedConexiones: Conexion[] = johnsonConexiones.map((jc) => {
      const desde = this.idToContador.get(jc.origen.id) ?? 0;
      const hasta = this.idToContador.get(jc.destino.id) ?? 0;
      const conexion = new Conexion(desde, hasta, jc.peso, true);
      conexion.holgura = jc.holgura;
      conexion.rutaCritica = jc.rutaCritica;
      return conexion;
    });

    this.store.nodos.set(unifiedNodos);
    this.store.conexiones.set(unifiedConexiones);
    this.store.contador.set(unifiedNodos.length);
  }

  pullFromStore(): {
    nodos: JohnsonNodo[];
    conexiones: JohnsonConexion[];
  } {
    const unifiedNodos = this.store.nodos();
    const unifiedConexiones = this.store.conexiones();

    const johnsonNodos: JohnsonNodo[] = unifiedNodos.map((un) => {
      const id = this.contadorToId.get(un.contador) ?? `nodo-${un.contador}`;
      const jn = new JohnsonNodo(id, un.x, un.y, un.nombre);
      jn.tiempoInicio = un.tiempoInicio ?? 0;
      jn.tiempoFin = un.tiempoFin ?? 0;
      jn.esCritico = un.esCritico ?? false;
      return jn;
    });

    const nodoById = new Map<string, JohnsonNodo>();
    johnsonNodos.forEach((jn) => nodoById.set(jn.id, jn));

    const johnsonConexiones: JohnsonConexion[] = unifiedConexiones.map(
      (uc) => {
        const origenId = this.contadorToId.get(uc.desde) ?? `nodo-${uc.desde}`;
        const destinoId =
          this.contadorToId.get(uc.hasta) ?? `nodo-${uc.hasta}`;
        const jc = new JohnsonConexion(
          nodoById.get(origenId)!,
          nodoById.get(destinoId)!,
          uc.peso,
        );
        jc.holgura = uc.holgura;
        jc.rutaCritica = uc.rutaCritica;
        return jc;
      },
    );

    return { nodos: johnsonNodos, conexiones: johnsonConexiones };
  }

  saveSnapshot(): void {
    this.store.saveSnapshot();
  }

  clear(): void {
    this.store.clear();
    this.idToContador.clear();
    this.contadorToId.clear();
  }

  undo(): { nodos: JohnsonNodo[]; conexiones: JohnsonConexion[] } | null {
    this.store.undo();
    return this.pullFromStore();
  }

  redo(): { nodos: JohnsonNodo[]; conexiones: JohnsonConexion[] } | null {
    this.store.redo();
    return this.pullFromStore();
  }
}
