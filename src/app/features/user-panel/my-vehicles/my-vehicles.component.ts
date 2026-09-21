import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { AddVehicleComponent } from "../add-vehicle/add-vehicle.component";

@Component({
  selector: "app-my-vehicles",
  standalone: false,
  templateUrl: "./my-vehicles.component.html",
  styleUrl: "./my-vehicles.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyVehiclesComponent {
  private readonly dialog = inject(MatDialog);

  protected openAddVehicle(): void {
    if (this.dialog.getDialogById("add-vehicle")) return;
    this.dialog.open(AddVehicleComponent, {
      id: "add-vehicle",
      width: "480px",
      maxWidth: "calc(100vw - 32px)",
      maxHeight: "calc(100dvh - 32px)",
      ariaLabelledBy: "add-vehicle-title",
      ariaDescribedBy: "add-vehicle-description",
      autoFocus: "#vehicle-registration",
      restoreFocus: true,
    });
  }
}
