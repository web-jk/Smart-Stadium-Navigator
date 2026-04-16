import { Routes } from '@angular/router';
import { adminGuard } from './guards/admin.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'explore',
    loadComponent: () =>
      import('./features/explorer/explorer.component').then(m => m.ExplorerComponent)
  },
  {
    path: 'admin/login',
    loadComponent: () =>
      import('./features/admin/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./features/admin/admin.component').then(m => m.AdminComponent)
  }
];
