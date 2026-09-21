import { ChangeDetectionStrategy, Component } from "@angular/core";

@Component({
  selector: "app-challans",
  standalone: false,
  templateUrl: "./challans.component.html",
  styleUrl: "./challans.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChallansComponent {}
