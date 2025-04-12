import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Benefits } from '../home.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-benefit',
  imports: [CommonModule],
  templateUrl: './benefit.component.html',
  styleUrl: './benefit.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BenefitComponent {
  @Input() benefit!: Benefits;
}
