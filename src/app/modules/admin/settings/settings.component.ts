import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/models/auth.model';

interface Settings {
  id?: number;
  interestRatePercent: number;
  allowedDays: number;
  baseDistanceKm: number;
  extraChargePerKm: number;
  driverExtraSharePct: number;
}

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements OnInit {
  settings: Settings = { interestRatePercent: 2, allowedDays: 30, baseDistanceKm: 12, extraChargePerKm: 30, driverExtraSharePct: 50 };
  loading = true;
  successMsg = '';
  errorMsg = '';
  private url = `${environment.apiUrl}/settings`;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.http.get<ApiResponse<Settings>>(this.url).subscribe({
      next: (res) => { this.settings = res.data; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  save() {
    this.http.put<ApiResponse<Settings>>(this.url, this.settings).subscribe({
      next: () => { this.successMsg = 'Settings saved successfully'; setTimeout(() => this.successMsg = '', 3000); },
      error: (err) => { this.errorMsg = err.error?.message || 'Save failed'; setTimeout(() => this.errorMsg = '', 3000); }
    });
  }
}
