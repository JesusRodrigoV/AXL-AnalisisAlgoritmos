# Graph Report - AXL-AnalisisAlgoritmos  (2026-08-26)

## Corpus Check
- 186 files · ~181,372 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 850 nodes · 1400 edges · 59 communities (46 shown, 13 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 54 edges (avg confidence: 0.79)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Johnson Error Dialog
- Angular Core Libraries
- Dev Tooling & Testing
- Binary Trees Algorithm
- Adjacency Matrix Canvas
- Graph Canvas Editor
- Dijkstra Shortest Path
- Northwest Transportation
- Help Models & Routing
- Graph Data Models
- App Bootstrap & Theme
- Sorting Algorithms
- Home Page Components
- HTML Templates Mix
- Assignment Problem Solver
- Connection Model
- Graph Store Service
- Kruskal MST Algorithm
- Help Dialog System
- Sort Config Models
- Algorithm Page Templates
- Sort Config UI
- Graph Node Model
- Help & Editor Services
- Angular Project Config
- Graph Renderer Engine
- Laplace Transform
- Sort Chart Service
- Graph Editor Assets
- File I/O Service
- Sort Algorithm Service
- Angular Schematics
- Angular Build Config
- Fuzzy Logic System
- Undo/Redo Service
- Modal Content Component
- Build Budget Config
- Assignment Matrix UI
- Sort Controls UI
- Hungarian Algorithm
- Shared Component Templates
- Angular CLI Config
- Angular Test Config
- Graph Help Screenshots
- Export Modal
- Help Modal
- Navbar & Navigation
- Global Styles & Themes
- Tree Help Screenshots
- Northwest Help Screenshots
- Sort Help Screenshots
- Johnson Navbar
- Proyecto Page
- Assignment Help Screenshots
- Tree Traversal Help
- Proyecto Content
- Johnson Navbar Template
- Footer Template
- Help Template

## God Nodes (most connected - your core abstractions)
1. `JohnsonCanvasComponent` - 53 edges
2. `Nodo` - 42 edges
3. `ArbolesComponent` - 40 edges
4. `MyCanvasComponent` - 40 edges
5. `DijkstraComponent` - 35 edges
6. `Conexion` - 32 edges
7. `SortsComponent` - 31 edges
8. `NorthwestComponent` - 30 edges
9. `HelpContent` - 24 edges
10. `AsignacionComponent` - 24 edges

## Surprising Connections (you probably didn't know these)
- `Skill Registry` --conceptually_related_to--> `Root App Component Template`  [INFERRED]
  .atl/skill-registry.md → src/app/app.component.html
- `Project README — Algoritmos Proyecto de Analisis` --references--> `Root App Component Template`  [INFERRED]
  README.md → src/app/app.component.html
- `Binary Trees Page Template` --conceptually_related_to--> `Home Page Template`  [INFERRED]
  src/app/pages/arboles/arboles.component.html → src/app/pages/home/home.component.html
- `Assignment Problem Page Template` --conceptually_related_to--> `Home Page Template`  [INFERRED]
  src/app/pages/asignacion/asignacion.component.html → src/app/pages/home/home.component.html
- `Dijkstra Algorithm Page Template` --conceptually_related_to--> `Home Page Template`  [INFERRED]
  src/app/pages/dijkstra/dijkstra.component.html → src/app/pages/home/home.component.html

## Import Cycles
- 3-file cycle: `src/app/pages/home/benefit/benefit.component.ts -> src/app/pages/home/home.component.ts -> src/app/pages/home/benefit/index.ts -> src/app/pages/home/benefit/benefit.component.ts`
- 3-file cycle: `src/app/pages/home/feature/feature.component.ts -> src/app/pages/home/home.component.ts -> src/app/pages/home/feature/index.ts -> src/app/pages/home/feature/feature.component.ts`

## Communities (59 total, 13 thin omitted)

### Community 0 - "Johnson Error Dialog"
Cohesion: 0.05
Nodes (12): ErrorDialogComponent, Component, Inject, Actividad, JohnsonCanvasComponent, Component, Inject, ViewChild (+4 more)

### Community 1 - "Angular Core Libraries"
Cohesion: 0.05
Nodes (41): @angular/animations, @angular/cdk, @angular/common, @angular/compiler, @angular/core, @angular/forms, @angular/material, @angular/platform-browser (+33 more)

### Community 2 - "Dev Tooling & Testing"
Cohesion: 0.05
Nodes (39): @angular/compiler-cli, @angular-devkit/build-angular, jasmine-core, karma, karma-chrome-launcher, karma-coverage, karma-jasmine, karma-jasmine-html-reporter (+31 more)

### Community 3 - "Binary Trees Algorithm"
Cohesion: 0.15
Nodes (3): ArbolesComponent, Component, ViewChild

### Community 4 - "Adjacency Matrix Canvas"
Cohesion: 0.08
Nodes (14): AdjacencyMatrixComponent, Component, Input, ViewChild, Button, ButtonBarComponent, Component, Output (+6 more)

### Community 5 - "Graph Canvas Editor"
Cohesion: 0.11
Nodes (6): HostListener, MyCanvasComponent, Component, Input, Output, ViewChild

### Community 6 - "Dijkstra Shortest Path"
Cohesion: 0.11
Nodes (5): DijkstraComponent, Component, ViewChild, puntoEnNodo(), puntoEnNodoOMenos()

### Community 7 - "Northwest Transportation"
Cohesion: 0.13
Nodes (3): NorthwestComponent, Component, ViewChild

### Community 8 - "Help Models & Routing"
Cohesion: 0.13
Nodes (8): HelpImage, HelpStep, HelpVideo, Nodo, Edge, HelpButtonComponent, Component, Input

### Community 9 - "Graph Data Models"
Cohesion: 0.15
Nodes (8): ColorService, Injectable, clearCanvas(), distanciaPuntoALinea(), puntoCercaDeBucle(), puntoCercaDeCurva(), puntoCercaDeLinea(), NodeColorResolver

### Community 10 - "App Bootstrap & Theme"
Cohesion: 0.12
Nodes (10): AppComponent, Component, appConfig, routes, Theme, ThemeService, Injectable, NavbarComponent (+2 more)

### Community 11 - "Sorting Algorithms"
Cohesion: 0.12
Nodes (3): SortsComponent, Component, ViewChild

### Community 12 - "Home Page Components"
Cohesion: 0.15
Nodes (12): BenefitComponent, Component, Input, FeatureComponent, Component, Input, Benefits, HomeComponent (+4 more)

### Community 13 - "HTML Templates Mix"
Cohesion: 0.11
Nodes (19): Skill Registry, Project README — Algoritmos Proyecto de Analisis, Root App Component Template, Binary Trees Page Template, Assignment Problem Page Template, Assignment Matrix Component Template, Dijkstra Algorithm Page Template, Graph Editor Page Template (+11 more)

### Community 14 - "Assignment Problem Solver"
Cohesion: 0.17
Nodes (3): AsignacionComponent, Component, ViewChild

### Community 15 - "Connection Model"
Cohesion: 0.12
Nodes (4): Conexion, ExportImportService, Injectable, Estado

### Community 17 - "Kruskal MST Algorithm"
Cohesion: 0.21
Nodes (3): KruskalComponent, Component, ViewChild

### Community 18 - "Help Dialog System"
Cohesion: 0.16
Nodes (5): Pipe, HelpDialogComponent, Component, Inject, SafeUrlPipe

### Community 19 - "Sort Config Models"
Cohesion: 0.21
Nodes (5): InputMode, SortAlgorithm, SortOrder, SORTS_HELP_CONTENT, SortContext

### Community 20 - "Algorithm Page Templates"
Cohesion: 0.14
Nodes (14): Laplace Transform Calculator Template, Northwest Cost Matrix Table, Northwest File Import/Export, Northwest Component Template, Northwest Results Section, Northwest Transportation Solver (minimize costs, maximize gains), Sorting Algorithm Selector (selection, insertion, shell, merge), Array Configuration (auto/manual, size, min/max values) (+6 more)

### Community 21 - "Sort Config UI"
Cohesion: 0.14
Nodes (4): SortConfigComponent, Component, Input, Output

### Community 23 - "Help & Editor Services"
Cohesion: 0.21
Nodes (7): HelpContent, EditorComponent, Component, JohnsonComponent, Component, HelpService, Injectable

### Community 24 - "Angular Project Config"
Cohesion: 0.18
Nodes (11): options, assets, browser, index, inlineStyleLanguage, outputPath, polyfills, scripts (+3 more)

### Community 25 - "Graph Renderer Engine"
Cohesion: 0.31
Nodes (3): drawArrowhead(), GraphRenderer, Injectable

### Community 26 - "Laplace Transform"
Cohesion: 0.22
Nodes (5): LaplaceComponent, Component, ProcesarLaplaceComponent, Component, ViewChild

### Community 28 - "Graph Editor Assets"
Cohesion: 0.29
Nodes (10): Clean Canvas Icon, Create Connection Edge Icon, Create Node Button Icon, Delete Element Icon, Graph Editor Example Screenshot, Export Icon, Help - Add Activity Screenshot, Help - View Controls Screenshot (+2 more)

### Community 29 - "File I/O Service"
Cohesion: 0.22
Nodes (3): Inject, ArrayFileService, Injectable

### Community 31 - "Angular Schematics"
Cohesion: 0.22
Nodes (9): prefix, projectType, root, schematics, sourceRoot, Analisis-Algoritmos, changeDetection, style (+1 more)

### Community 32 - "Angular Build Config"
Cohesion: 0.22
Nodes (9): serve, development, buildTarget, extractLicenses, optimization, sourceMap, builder, configurations (+1 more)

### Community 33 - "Fuzzy Logic System"
Cohesion: 0.25
Nodes (4): FuzzyComponent, Component, ProcesarDatosComponent, Component

### Community 35 - "Modal Content Component"
Cohesion: 0.22
Nodes (3): ModalContentComponent, Component, Inject

### Community 36 - "Build Budget Config"
Cohesion: 0.25
Nodes (8): build, builder, configurations, defaultConfiguration, production, budgets, buildTarget, outputHashing

### Community 37 - "Assignment Matrix UI"
Cohesion: 0.32
Nodes (3): AsignacionMatrixComponent, Component, Input

### Community 38 - "Sort Controls UI"
Cohesion: 0.29
Nodes (4): SortControlsComponent, Component, Input, Output

### Community 40 - "Shared Component Templates"
Cohesion: 0.29
Nodes (8): Adjacency Matrix Template, Button Bar Template, Button Component Template, Export Modal Template, Connection Config Modal Template, Matrix Modal Template, Canvas Context Menu (nodes, connections, canvas), My Canvas Template

### Community 41 - "Angular CLI Config"
Cohesion: 0.29
Nodes (6): analytics, cli, newProjectRoot, projects, $schema, version

### Community 42 - "Angular Test Config"
Cohesion: 0.29
Nodes (7): architect, extract-i18n, test, builder, main, builder, options

### Community 43 - "Graph Help Screenshots"
Cohesion: 0.33
Nodes (7): Establecer Pesos (Set Weights) - UI Screenshot, Generar Grafo (Generate Graph) - UI Screenshot, Holguras Explicacion (Slack Explanation) - Diagram, Relaciones entre Nodos (Node Relationships) - Diagram, Video Tutorial Thumbnail, Import Icon/Functionality, Move Icon/Functionality

### Community 44 - "Export Modal"
Cohesion: 0.29
Nodes (3): ExportModalComponent, ExportType, Component

### Community 46 - "Navbar & Navigation"
Cohesion: 0.33
Nodes (6): Navbar Mobile Menu, Navbar Template, Navbar Theme Toggle (dark/light mode), App Root Component, Dark Mode FOUC Prevention Script, Root HTML (index.html)

### Community 47 - "Global Styles & Themes"
Cohesion: 0.50
Nodes (4): styles, @angular/material/prebuilt-themes/azure-blue.css, node_modules/boxicons/css/boxicons.min.css, src/styles.scss

### Community 48 - "Tree Help Screenshots"
Cohesion: 0.67
Nodes (4): Help - Ordered Tree Screenshot, Help - Tree Example Screenshot, Help - Save Load Tree Screenshot, Help - Tree Visualization Screenshot

### Community 49 - "Northwest Help Screenshots"
Cohesion: 0.67
Nodes (4): Northwest Corner Method - Initial Matrix, Northwest Corner Method - Final Solution, Northwest Corner Method - Step 1, Northwest Corner Method - Step 2

### Community 50 - "Sort Help Screenshots"
Cohesion: 0.67
Nodes (4): Sort Algorithms - Overview/Comparison Screenshot, Sort Configuration - UI Screenshot, Sort Controls - UI Screenshot, Sort Visualization - UI Screenshot

### Community 53 - "Assignment Help Screenshots"
Cohesion: 1.00
Nodes (3): Assignment Problem Example Screenshot, Assignment Optimization Toggle Screenshot, Assignment Solve Button Screenshot

### Community 54 - "Tree Traversal Help"
Cohesion: 1.00
Nodes (3): Help - Tree Traversal Example Screenshot, Help - Tree Traversals Overview Screenshot, Help - Tree Traversal Types Screenshot

## Ambiguous Edges - Review These
- `Help Button Template` → `Laplace Transform Calculator Template`  [AMBIGUOUS]
  src/app/pages/laplace/procesar-laplace/procesar-laplace.component.html · relation: conceptually_related_to

## Knowledge Gaps
- **130 isolated node(s):** `$schema`, `version`, `newProjectRoot`, `projectType`, `style` (+125 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **13 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Help Button Template` and `Laplace Transform Calculator Template`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `HelpContent` connect `Help & Editor Services` to `Binary Trees Algorithm`, `Dijkstra Shortest Path`, `Northwest Transportation`, `Help Models & Routing`, `Graph Data Models`, `Assignment Problem Solver`, `Kruskal MST Algorithm`, `Help Dialog System`, `Sort Config Models`?**
  _High betweenness centrality (0.146) - this node is a cross-community bridge._
- **Why does `JohnsonCanvasComponent` connect `Johnson Error Dialog` to `Help Models & Routing`?**
  _High betweenness centrality (0.086) - this node is a cross-community bridge._
- **Why does `ArbolesComponent` connect `Binary Trees Algorithm` to `Help Models & Routing`, `Help & Editor Services`?**
  _High betweenness centrality (0.062) - this node is a cross-community bridge._
- **What connects `$schema`, `version`, `newProjectRoot` to the rest of the system?**
  _130 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Johnson Error Dialog` be split into smaller, more focused modules?**
  _Cohesion score 0.052982456140350874 - nodes in this community are weakly interconnected._
- **Should `Angular Core Libraries` be split into smaller, more focused modules?**
  _Cohesion score 0.04878048780487805 - nodes in this community are weakly interconnected._