import { ChangeDetectionStrategy, Component } from "@angular/core";

@Component({
  selector: "app-user-panel",
  standalone: false,
  templateUrl: "./user-panel.component.html",
  styleUrl: "./user-panel.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserPanelComponent {}
