import { ChangeDetectionStrategy, Component } from "@angular/core";

@Component({
  selector: "app-add-vehicle",
  standalone: false,
  templateUrl: "./add-vehicle.component.html",
  styleUrl: "./add-vehicle.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddVehicleComponent {}
