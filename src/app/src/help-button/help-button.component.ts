import {
  Component,
  Input,
  ChangeDetectionStrategy,
  inject,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { HelpContent } from '../../models/Help.model';
import { HelpDialogComponent } from './help-dialog';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-help-button',
  imports: [MatButtonModule],
  templateUrl: './help-button.component.html',
  styleUrl: './help-button.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HelpButtonComponent {
  @Input() helpContent!: HelpContent;
  readonly dialog = inject(MatDialog);

  openHelpDialog(): void {
    this.dialog.open(HelpDialogComponent, {
      width: '700px',
      data: this.helpContent,
      panelClass: 'help-dialog-container',
    });
  }
}
