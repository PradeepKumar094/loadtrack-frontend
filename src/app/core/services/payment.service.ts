import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Payment, PaymentRequest, Receipt, DashboardData } from '../models/payment.model';
import { ApiResponse } from '../models/auth.model';

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private url = `${environment.apiUrl}/payments`;
  constructor(private http: HttpClient) {}

  getAll(): Observable<ApiResponse<Payment[]>> {
    return this.http.get<ApiResponse<Payment[]>>(this.url);
  }
  getById(id: number): Observable<ApiResponse<Payment>> {
    return this.http.get<ApiResponse<Payment>>(`${this.url}/${id}`);
  }
  getByDealer(dealerId: number): Observable<ApiResponse<Payment[]>> {
    return this.http.get<ApiResponse<Payment[]>>(`${this.url}/dealer/${dealerId}`);
  }
  getByTrip(tripId: number): Observable<ApiResponse<Payment>> {
    return this.http.get<ApiResponse<Payment>>(`${this.url}/trip/${tripId}`);
  }
  makePayment(id: number, data: PaymentRequest): Observable<ApiResponse<Payment>> {
    return this.http.put<ApiResponse<Payment>>(`${this.url}/${id}/pay`, data);
  }
}

@Injectable({ providedIn: 'root' })
export class ReceiptService {
  private url = `${environment.apiUrl}/receipts`;
  constructor(private http: HttpClient) {}

  getByPayment(paymentId: number): Observable<ApiResponse<Receipt[]>> {
    return this.http.get<ApiResponse<Receipt[]>>(`${this.url}/payment/${paymentId}`);
  }
  getById(id: number): Observable<ApiResponse<Receipt>> {
    return this.http.get<ApiResponse<Receipt>>(`${this.url}/${id}`);
  }
  downloadPdf(id: number): Observable<Blob> {
    return this.http.get(`${this.url}/${id}/pdf`, { responseType: 'blob' });
  }
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private url = `${environment.apiUrl}/dashboard`;
  constructor(private http: HttpClient) {}

  getAdminDashboard(): Observable<ApiResponse<DashboardData>> {
    return this.http.get<ApiResponse<DashboardData>>(`${this.url}/admin`);
  }
  getDriverDashboard(driverId: number): Observable<ApiResponse<DashboardData>> {
    return this.http.get<ApiResponse<DashboardData>>(`${this.url}/driver/${driverId}`);
  }
  getDealerDashboard(dealerId: number): Observable<ApiResponse<DashboardData>> {
    return this.http.get<ApiResponse<DashboardData>>(`${this.url}/dealer/${dealerId}`);
  }
}

@Injectable({ providedIn: 'root' })
export class ReportService {
  private url = `${environment.apiUrl}/reports`;
  constructor(private http: HttpClient) {}

  exportTripsExcel(from?: string, to?: string): Observable<Blob> {
    let params = '';
    if (from && to) params = `?from=${from}&to=${to}`;
    return this.http.get(`${this.url}/trips/excel${params}`, { responseType: 'blob' });
  }
  exportPendingPaymentsExcel(): Observable<Blob> {
    return this.http.get(`${this.url}/payments/pending/excel`, { responseType: 'blob' });
  }
}
