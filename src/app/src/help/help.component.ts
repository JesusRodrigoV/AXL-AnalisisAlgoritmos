import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-help',
  imports: [CommonModule],
  templateUrl: './help.component.html',
  styleUrls: ['./help.component.scss'],
})
export class HelpComponent {
  menuVisible = false;
  modalVisible = false;
  isModalOpen = false;
  selectedImage = '';

  private readonly ASSETS_PATH = 'assets/';

  menuOptions = [
    { label: 'Modo Conexión', image: this.ASSETS_PATH + 'conexion.png' },
    { label: 'Eliminar', image: this.ASSETS_PATH + 'delete.png' },
    { label: 'Exportar', image: this.ASSETS_PATH + 'export.png' },
    { label: 'Importar', image: this.ASSETS_PATH + 'import.png' },
    { label: 'Limpiar', image: this.ASSETS_PATH + 'clean.png' },
  ];

  toggleMenu() {
    this.menuVisible = !this.menuVisible;
  }

  openModal(option: any) {
    this.selectedImage = option.image;
    this.modalVisible = true;
  }

  closeModal() {
    this.modalVisible = false;
  }
}
