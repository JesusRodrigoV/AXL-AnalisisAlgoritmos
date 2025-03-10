import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Benefits } from '../home.component';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-benefit',
  imports: [CommonModule, MatIconModule],
  templateUrl: './benefit.component.html',
  styleUrl: './benefit.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BenefitComponent {
  @Input() benefit!: Benefits;
}
