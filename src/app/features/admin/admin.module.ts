import { AdminDashboardComponent } from "./admin-dashboard/admin-dashboard.component";
import { AdminChartComponent } from "./admin-dashboard/admin-chart.component";
import { AdminRequestsComponent } from "./admin-requests/admin-requests.component";
import localeEnIn from "@angular/common/locales/en-IN";
import { AdminProfileChallansComponent } from "./admin-profile-challans/admin-profile-challans.component";
import { NgModule } from "@angular/core";
import { CommonModule, registerLocaleData } from "@angular/common";
import { ReactiveFormsModule } from "@angular/forms";
import { AdminRoutingModule } from "./admin-routing.module";
import { AdminLoginComponent } from "./admin-login/admin-login.component";
import { AdminShellComponent } from "./admin-shell/admin-shell.component";
import { AdminUsersComponent } from "./admin-users/admin-users.component";
import { AdminProfileComponent } from "./admin-profile/admin-profile.component";

registerLocaleData(localeEnIn);

@NgModule({
  declarations: [
    AdminDashboardComponent,
    AdminChartComponent,
    AdminRequestsComponent,
    AdminLoginComponent,
    AdminShellComponent,
    AdminUsersComponent,
    AdminProfileComponent,
    AdminProfileChallansComponent,
  ],
  imports: [CommonModule, ReactiveFormsModule, AdminRoutingModule],
})
export class AdminModule {}
