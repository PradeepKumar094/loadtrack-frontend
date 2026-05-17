import { Component, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-portal-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './portal-layout.component.html',
  styleUrls: ['./portal-layout.component.css']
})
export class PortalLayoutComponent implements OnInit {
  role = '';
  navLinks: { label: string; path: string; icon: string }[] = [];

  constructor(public authService: AuthService) {}

  ngOnInit() {
    this.role = this.authService.getRole() || '';
    if (this.role === 'DRIVER') {
      this.navLinks = [
        { label: 'Dashboard', path: '/driver/dashboard', icon: 'fas fa-tachometer-alt' },
        { label: 'My Trips',  path: '/driver/trips',     icon: 'fas fa-route' },
        { label: 'My Salary', path: '/driver/salary',    icon: 'fas fa-wallet' },
        { label: 'My Profile',path: '/driver/profile',   icon: 'fas fa-user-circle' }
      ];
    } else if (this.role === 'DEALER') {
      this.navLinks = [
        { label: 'Dashboard',     path: '/dealer/dashboard', icon: 'fas fa-tachometer-alt' },
        { label: 'Sand Requests', path: '/dealer/requests',  icon: 'fas fa-layer-group' },
        { label: 'Payments',      path: '/dealer/payments',  icon: 'fas fa-rupee-sign' },
        { label: 'My Profile',    path: '/dealer/profile',   icon: 'fas fa-user-circle' }
      ];
    }
  }

  logout() {
    this.authService.logout();
  }
}
