import { ChangeDetectionStrategy, Component } from "@angular/core";

@Component({
  selector: "app-in-progress-challans",
  standalone: false,
  templateUrl: "./in-progress-challans.component.html",
  styleUrl: "./in-progress-challans.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InProgressChallansComponent {}
