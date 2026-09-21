import { NgModule } from "@angular/core";
import { MatDialogModule } from "@angular/material/dialog";
import { UserPanelRoutingModule } from "./user-panel-routing.module";
import { UserPanelComponent } from "./user-panel.component";
import { MyVehiclesComponent } from "./my-vehicles/my-vehicles.component";
import { ChallansComponent } from "./challans/challans.component";
import { PendingChallansComponent } from "./challans/pending-challans/pending-challans.component";
import { InProgressChallansComponent } from "./challans/in-progress-challans/in-progress-challans.component";
import { ClosedChallansComponent } from "./challans/closed-challans/closed-challans.component";
import { AddVehicleComponent } from "./add-vehicle/add-vehicle.component";

@NgModule({
  declarations: [
    UserPanelComponent,
    MyVehiclesComponent,
    ChallansComponent,
    PendingChallansComponent,
    InProgressChallansComponent,
    ClosedChallansComponent,
    AddVehicleComponent,
  ],
  imports: [UserPanelRoutingModule, MatDialogModule],
})
export class UserPanelModule {}
