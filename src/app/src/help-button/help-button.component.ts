import {
  Component,
  Input,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  inject,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { HelpContent } from '../../models/Help.model';
import { interval, Subscription } from 'rxjs';
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
export class HelpButtonComponent implements OnInit, OnDestroy {
  @Input() helpContent!: HelpContent;
  readonly dialog = inject(MatDialog);
  showHelpPrompt = false;
  private promptInterval?: Subscription;

  ngOnInit() {
    this.promptInterval = interval(500000).subscribe(() => {
      this.showHelpPrompt = true;
      setTimeout(() => {
        this.showHelpPrompt = false;
      }, 2000);
    });
  }

  ngOnDestroy() {
    if (this.promptInterval) {
      this.promptInterval.unsubscribe();
    }
  }

  openHelpDialog(): void {
    this.dialog.open(HelpDialogComponent, {
      width: '800px',
      data: this.helpContent,
      panelClass: 'help-dialog-container',
    });
  }
}
