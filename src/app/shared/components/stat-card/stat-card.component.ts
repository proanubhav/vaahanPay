import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import type { Stat } from '../../../core/models/stat.model';

@Component({
  selector: 'app-stat-card',
  imports: [MatCardModule, MatIconModule],
  templateUrl: './stat-card.component.html',
  styleUrl: './stat-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatCardComponent {
  readonly stat = input.required<Stat>();
}
