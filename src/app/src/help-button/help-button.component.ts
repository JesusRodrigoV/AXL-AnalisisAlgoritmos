import {
  Component,
  Input,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { HelpContent } from '../../models/Help.model';
import { interval, Subscription } from 'rxjs';
import { HelpDialogComponent } from './help-dialog';
import { MatIconModule } from '@angular/material/icon';
import { NgIf } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-help-button',
  imports: [MatIconModule, NgIf, MatButtonModule],
  templateUrl: './help-button.component.html',
  styleUrl: './help-button.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HelpButtonComponent implements OnInit, OnDestroy {
  @Input() helpContent!: HelpContent;

  showHelpPrompt = false;
  private promptInterval?: Subscription;

  constructor(private dialog: MatDialog) {}

  ngOnInit() {
    // Configura el intervalo para mostrar el prompt cada 5 segundos
    this.promptInterval = interval(5000).subscribe(() => {
      this.showHelpPrompt = true;
      setTimeout(() => {
        this.showHelpPrompt = false;
      }, 2000); // El prompt se oculta después de 2 segundos
    });
  }

  ngOnDestroy() {
    if (this.promptInterval) {
      this.promptInterval.unsubscribe();
    }
  }

  openHelpDialog(): void {
    this.dialog.open(HelpDialogComponent, {
      width: '600px',
      data: this.helpContent,
      panelClass: 'help-dialog-container',
    });
  }
}
