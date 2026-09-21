import { ChangeDetectionStrategy, Component } from "@angular/core";

@Component({
  selector: "app-closed-challans",
  standalone: false,
  templateUrl: "./closed-challans.component.html",
  styleUrl: "./closed-challans.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClosedChallansComponent {}
