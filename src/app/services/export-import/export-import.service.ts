import { Injectable } from '@angular/core';
import { Nodo, Conexion } from '@app/models';

@Injectable({
  providedIn: 'root',
})
export class ExportImportService {
  exportToPNG(
    canvas: HTMLCanvasElement,
    defaultFileName: string = 'grafo',
  ): Promise<boolean> {
    return new Promise((resolve) => {
      const fileName = prompt(
        'Ingrese el nombre del archivo (sin extensión):',
        defaultFileName,
      );
      if (!fileName) {
        resolve(false);
        return;
      }

      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `${fileName}.png`;
      a.click();
      URL.revokeObjectURL(url);
      resolve(true);
    });
  }

  exportToJSON(
    nodos: Nodo[],
    conexiones: Conexion[],
    defaultFileName: string = 'grafo',
  ): Promise<boolean> {
    return new Promise((resolve) => {
      const data = {
        nodos: nodos,
        conexiones: conexiones,
      };

      const jsonData = JSON.stringify(data, null, 2);

      const fileName = prompt(
        'Ingrese el nombre del archivo (sin extensión):',
        defaultFileName,
      );
      if (!fileName) {
        resolve(false);
        return;
      }

      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${fileName}.json`;
      a.click();
      URL.revokeObjectURL(url);
      resolve(true);
    });
  }

  importFromJSON(
    file: File,
    radio: number,
  ): Promise<{ nodos: Nodo[]; conexiones: Conexion[] }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e: any) => {
        try {
          const json = JSON.parse(e.target.result);
          let loadedNodos: Nodo[] = [];
          let loadedConexiones: Conexion[] = [];

          if (Array.isArray(json.nodos)) {
            json.nodos.forEach((nodo: any) => {
              loadedNodos.push(
                new Nodo(
                  nodo._x,
                  nodo._y,
                  radio,
                  nodo.contador || loadedNodos.length + 1,
                  false,
                  nodo._nombre,
                  nodo._color,
                ),
              );
            });
          }

          if (Array.isArray(json.conexiones)) {
            json.conexiones.forEach((conexion: any) => {
              const desde = conexion._desde || conexion.desde;
              const hasta = conexion._hasta || conexion.hasta;
              const peso = conexion._peso ?? conexion.peso ?? 0;
              const dirigido = conexion._dirigido ?? conexion.dirigido ?? false;

              if (desde !== undefined && hasta !== undefined) {
                loadedConexiones.push(
                  new Conexion(desde, hasta, peso, dirigido),
                );
              }
            });
          }

          resolve({
            nodos: loadedNodos,
            conexiones: loadedConexiones,
          });
        } catch (error) {
          reject(new Error('Error al procesar el archivo JSON'));
        }
      };

      reader.onerror = () => {
        reject(new Error('Error al leer el archivo'));
      };

      reader.readAsText(file);
    });
  }
}
