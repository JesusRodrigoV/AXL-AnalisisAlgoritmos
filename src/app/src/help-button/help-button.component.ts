import {
  Component,
  Input,
  ChangeDetectionStrategy,
  inject,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { HelpContent } from '../../models/Help.model';
import { HelpDialogComponent } from './help-dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-help-button',
  imports: [MatIconModule, MatButtonModule],
  templateUrl: './help-button.component.html',
  styleUrl: './help-button.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HelpButtonComponent{
  @Input() helpContent!: HelpContent;
  readonly dialog = inject(MatDialog);

  openHelpDialog(): void {
    this.dialog.open(HelpDialogComponent, {
      width: '600px',
      data: this.helpContent,
      panelClass: 'help-dialog-container',
    });
  }
}
