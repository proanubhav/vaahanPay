import { Routes } from "@angular/router";

export const routes: Routes = [
  {
    path: "admin",
    loadChildren: () =>
      import("./features/admin/admin.module").then((m) => m.AdminModule),
  },
  {
    path: "",
    loadComponent: () =>
      import("./features/home/home.component").then((m) => m.HomeComponent),
    title: "VaahanPay – Check & Pay Vehicle Challan Online | E Challan Payment",
  },
  {
    path: "user",
    loadChildren: () =>
      import("./features/user-panel/user-panel.module").then(
        (m) => m.UserPanelModule,
      ),
  },
  { path: "**", redirectTo: "/" },
];
