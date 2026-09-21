import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/home/home.component').then((m) => m.HomeComponent),
    title: 'VaahanPay – Check & Pay Vehicle Challan Online | E Challan Payment',
  },
  { path: '**', redirectTo: '/' },
];
