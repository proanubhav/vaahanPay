import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { UserPanelComponent } from "./user-panel.component";
import { MyVehiclesComponent } from "./my-vehicles/my-vehicles.component";
import { ChallansComponent } from "./challans/challans.component";
import { PendingChallansComponent } from "./challans/pending-challans/pending-challans.component";
import { InProgressChallansComponent } from "./challans/in-progress-challans/in-progress-challans.component";
import { ClosedChallansComponent } from "./challans/closed-challans/closed-challans.component";

const routes: Routes = [
  {
    path: "",
    component: UserPanelComponent,
    children: [
      { path: "", pathMatch: "full", redirectTo: "my-vehicles" },
      {
        path: "my-vehicles",
        component: MyVehiclesComponent,
        title: "My vehicles | VaahanPay",
      },
      {
        path: "challans",
        component: ChallansComponent,
        children: [
          { path: "", pathMatch: "full", redirectTo: "pending" },
          {
            path: "pending",
            component: PendingChallansComponent,
            title: "Pending challans | VaahanPay",
          },
          {
            path: "in-progress",
            component: InProgressChallansComponent,
            title: "In-progress challans | VaahanPay",
          },
          {
            path: "closed",
            component: ClosedChallansComponent,
            title: "Closed challans | VaahanPay",
          },
        ],
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class UserPanelRoutingModule {}
