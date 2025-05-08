import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-proyecto',
  imports: [],
  templateUrl: './proyecto.component.html',
  styleUrl: './proyecto.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ProyectoComponent {
  titulo: string =
    'Optimización de Rutas de Recolección de Residuos en Ciudades Bolivianas Utilizando Algoritmos de Grafos';

  intro: string =
    'Esta propuesta busca abordar la ineficiencia en la recolección de residuos sólidos en ciudades bolivianas mediante el uso de este proyecto, una herramienta educativa interactiva desarrollada en Angular con TypeScript como lenguaje principal. La solución se basa en el algoritmo de Kruskal, implementado dentro de este proyecto, para optimizar las rutas de recolección de residuos. Estas tecnologías permiten crear una sitio web interactiva con una interfaz moderna. La propuesta pretende integrar estas herramientas para ofrecer una solución práctica y visualmente accesible que mejore la gestión de residuos en entornos urbanos.';

  problema: string =
    'Según el "Informe sobre Gestión de Residuos Sólidos en Bolivia" del Ministerio de Medio Ambiente y Agua (2023), la recolección de residuos en ciudades de Bolivia es ineficiente debido a rutas mal planificadas, lo que genera trayectos largos, alto consumo de combustible y acumulación de basura en las calles. Esto incrementa los costos operativos municipales y afecta la limpieza urbana, comprometiendo la calidad de vida de los ciudadanos.';

  objGeneral: string =
    'Desarrollar una solución basada en el algoritmo de Kruskal para optimizar las rutas de recolección de residuos en ciudades bolivianas, con el propósito de reducir los costos operativos y mejorar la limpieza urbana.';

  objEspecificos: string[] = [
    'Modelar la red de recolección: Representar las calles y puntos de recolección de residuos como un grafo, donde los nodos son puntos de recolección y los bordes son las calles con pesos basados en la distancia o el tiempo de recorrido.',
    'Aplicar el algoritmo de Kruskal: Utilizar este algoritmo, disponible en AXL, para determinar un árbol de expansión mínima que conecte todos los puntos de recolección con la ruta más eficiente.',
    'Incorporar restricciones prácticas: Ajustar el modelo para considerar factores como la capacidad de los camiones recolectores, los horarios de recolección y las zonas de alta densidad de residuos.',
    'Proponer una interfaz visual: Diseñar una herramienta interactiva que permita a los administradores municipales ingresar datos sobre puntos de recolección y obtener rutas optimizadas.',
    'Evaluar el impacto potencial: Analizar mediante simulaciones cómo esta solución puede reducir el tiempo de recolección y los costos asociados al combustible.',
  ];
}
