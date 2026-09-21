import { ChangeDetectionStrategy, Component } from "@angular/core";

@Component({
  selector: "app-pending-challans",
  standalone: false,
  templateUrl: "./pending-challans.component.html",
  styleUrl: "./pending-challans.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PendingChallansComponent {}
