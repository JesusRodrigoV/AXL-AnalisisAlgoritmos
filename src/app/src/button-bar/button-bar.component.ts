import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  inject,
  Output,
} from '@angular/core';
import { ButtonComponent } from './button';
import { MatDialog } from '@angular/material/dialog';
import { ModalMatrixComponent } from '../my-canvas/modal-matrix';

interface Button {
  id: string;
  label: string;
  iconClass: string;
  text: string;
  active: boolean;
  toggeable: boolean;
}

@Component({
  selector: 'app-button-bar',
  standalone: true,
  imports: [ButtonComponent],
  templateUrl: './button-bar.component.html',
  styleUrl: './button-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonBarComponent {
  @Output() modeToggled = new EventEmitter<{ id: string; active: boolean }>();
  @Output() exportar = new EventEmitter<void>();
  @Output() importar = new EventEmitter<void>();
  @Output() limpiar = new EventEmitter<void>();
  readonly dialog = inject(MatDialog);
  protected buttons: Button[] = [
    /*{
			id: "move",
			label: "Move",
			iconClass: "bx-move",
			text: "Mover vertice",
			active: false,
			toggeable: true,
		},*/
    {
      id: 'connect',
      label: 'Modo Conexión',
      iconClass: 'bx-link',
      text: 'Activar/Desactivar Modo Conexión',
      active: false,
      toggeable: true,
    },
    {
      id: 'delete',
      label: 'Eliminar',
      iconClass: 'bxs-eraser',
      text: 'Borrar vertices',
      active: false,
      toggeable: true,
    },
    {
      id: 'export',
      label: 'Exportar',
      iconClass: 'bx-export',
      text: 'Exportar JSON',
      active: false,
      toggeable: false,
    },
    {
      id: 'import',
      label: 'Importar',
      iconClass: 'bx-import',
      text: 'Importar JSON',
      active: false,
      toggeable: false,
    },
    {
      id: 'clear',
      label: 'Limpiar',
      iconClass: 'bx-trash',
      text: 'Limpiar Canvas',
      active: false,
      toggeable: false,
    },
  ];

  openDialog(): void {
    this.dialog.open(ModalMatrixComponent, {
      maxHeight: '90vh',
      width: 'auto',
      autoFocus: false,
      maxWidth: '90vw',
      height: 'auto',
    });
  }
  toggleMode(button: Button) {
    if (button.toggeable) {
      button.active = !button.active;
      if (button.active) {
        this.buttons.forEach((b) => {
          if (b.id !== button.id) {
            b.active = false;
          }
        });
      }
    }
    this.modeToggled.emit({ id: button.id, active: button.active });
    if (button.id === 'export') {
      this.exportar.emit();
    } else if (button.id === 'import') {
      this.importar.emit();
    } else if (button.id === 'clear') {
      this.limpiar.emit();
    } else if (button.id === 'matrizAdyacencia') {
      this.openDialog();
    }
  }
}
