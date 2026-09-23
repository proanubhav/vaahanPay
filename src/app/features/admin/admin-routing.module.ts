import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { AdminLoginComponent } from "./admin-login/admin-login.component";
import { AdminShellComponent } from "./admin-shell/admin-shell.component";
import { AdminUsersComponent } from "./admin-users/admin-users.component";
import { AdminProfileComponent } from "./admin-profile/admin-profile.component";
import { adminGuard } from "./admin.guard";

const routes: Routes = [
  {
    path: "login",
    component: AdminLoginComponent,
    title: "Admin login | VaahanPay",
  },
  {
    path: "",
    component: AdminShellComponent,
    // canActivate: [adminGuard],
    // canActivateChild: [adminGuard],
    children: [
      { path: "", pathMatch: "full", redirectTo: "users" },
      {
        path: "users",
        component: AdminUsersComponent,
        title: "Registered users | VaahanPay Admin",
      },
      {
        path: "users/:id",
        component: AdminProfileComponent,
        title: "User profile | VaahanPay Admin",
      },
    ],
  },
  { path: "**", redirectTo: "users" },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdminRoutingModule {}
