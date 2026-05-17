import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  // Auth
  {
    path: 'login',
    loadComponent: () => import('./modules/auth/login/login.component').then(m => m.LoginComponent)
  },

  // Admin Layout
  {
    path: 'admin',
    loadComponent: () => import('./layouts/admin-layout/admin-layout.component').then(m => m.AdminLayoutComponent),
    canActivate: [AuthGuard],
    data: { roles: ['ADMIN'] },
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./modules/admin/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'trucks',
        loadComponent: () => import('./modules/admin/trucks/trucks.component').then(m => m.TrucksComponent)
      },
      {
        path: 'drivers',
        loadComponent: () => import('./modules/admin/drivers/drivers.component').then(m => m.DriversComponent)
      },
      {
        path: 'dealers',
        loadComponent: () => import('./modules/admin/dealers/dealers.component').then(m => m.DealersComponent)
      },
      {
        path: 'sand-types',
        loadComponent: () => import('./modules/admin/sand-types/sand-types.component').then(m => m.SandTypesComponent)
      },
      {
        path: 'trips',
        loadComponent: () => import('./modules/admin/trips/trips.component').then(m => m.TripsComponent)
      },
      {
        path: 'payments',
        loadComponent: () => import('./modules/admin/payments/payments.component').then(m => m.PaymentsComponent)
      },
      {
        path: 'reports',
        loadComponent: () => import('./modules/admin/reports/reports.component').then(m => m.ReportsComponent)
      },
      {
        path: 'settings',
        loadComponent: () => import('./modules/admin/settings/settings.component').then(m => m.SettingsComponent)
      },
      {
        path: 'users',
        loadComponent: () => import('./modules/admin/users/users.component').then(m => m.UsersComponent)
      },
      {
        path: 'driver-salary',
        loadComponent: () => import('./modules/admin/driver-salary/driver-salary.component').then(m => m.DriverSalaryComponent)
      },
      {
        path: 'sand-requests',
        loadComponent: () => import('./modules/admin/sand-requests/sand-requests.component').then(m => m.SandRequestsComponent)
      },
      {
        path: 'payment-risk',
        loadComponent: () => import('./modules/admin/payment-risk/payment-risk.component').then(m => m.PaymentRiskComponent)
      },
      {
        path: 'profile',
        loadComponent: () => import('./modules/admin/profile/profile.component').then(m => m.ProfileComponent)
      }
    ]
  },

  // Driver Portal
  {
    path: 'driver',
    loadComponent: () => import('./layouts/portal-layout/portal-layout.component').then(m => m.PortalLayoutComponent),
    canActivate: [AuthGuard],
    data: { roles: ['DRIVER'] },
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./modules/driver/driver-dashboard/driver-dashboard.component').then(m => m.DriverDashboardComponent) },
      { path: 'trips',     loadComponent: () => import('./modules/driver/driver-trips/driver-trips.component').then(m => m.DriverTripsComponent) },
      { path: 'salary',    loadComponent: () => import('./modules/driver/driver-salary/driver-salary.component').then(m => m.DriverSalaryComponent) },
      { path: 'profile',   loadComponent: () => import('./modules/driver/driver-profile/driver-profile.component').then(m => m.DriverProfileComponent) }
    ]
  },

  // Dealer Portal
  {
    path: 'dealer',
    loadComponent: () => import('./layouts/portal-layout/portal-layout.component').then(m => m.PortalLayoutComponent),
    canActivate: [AuthGuard],
    data: { roles: ['DEALER'] },
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./modules/dealer/dealer-dashboard/dealer-dashboard.component').then(m => m.DealerDashboardComponent) },
      { path: 'payments',  loadComponent: () => import('./modules/dealer/dealer-payments/dealer-payments.component').then(m => m.DealerPaymentsComponent) },
      { path: 'requests',  loadComponent: () => import('./modules/dealer/dealer-requests/dealer-requests.component').then(m => m.DealerRequestsComponent) },
      { path: 'profile',   loadComponent: () => import('./modules/dealer/dealer-profile/dealer-profile.component').then(m => m.DealerProfileComponent) }
    ]
  },

  { path: 'unauthorized', loadComponent: () => import('./modules/auth/unauthorized/unauthorized.component').then(m => m.UnauthorizedComponent) },
  { path: '**', redirectTo: 'login' }
];
