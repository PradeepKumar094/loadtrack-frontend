import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Trip, TripRequest } from '../models/trip.model';
import { ApiResponse } from '../models/auth.model';

@Injectable({ providedIn: 'root' })
export class TripService {
  private url = `${environment.apiUrl}/trips`;
  constructor(private http: HttpClient) {}

  getAll(): Observable<ApiResponse<Trip[]>> {
    return this.http.get<ApiResponse<Trip[]>>(this.url);
  }
  getById(id: number): Observable<ApiResponse<Trip>> {
    return this.http.get<ApiResponse<Trip>>(`${this.url}/${id}`);
  }
  getByDriver(driverId: number): Observable<ApiResponse<Trip[]>> {
    return this.http.get<ApiResponse<Trip[]>>(`${this.url}/driver/${driverId}`);
  }
  getByDealer(dealerId: number): Observable<ApiResponse<Trip[]>> {
    return this.http.get<ApiResponse<Trip[]>>(`${this.url}/dealer/${dealerId}`);
  }
  create(data: TripRequest): Observable<ApiResponse<Trip>> {
    return this.http.post<ApiResponse<Trip>>(this.url, data);
  }
  update(id: number, data: TripRequest): Observable<ApiResponse<Trip>> {
    return this.http.put<ApiResponse<Trip>>(`${this.url}/${id}`, data);
  }
  delete(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.url}/${id}`);
  }
  acknowledge(tripId: number, driverId: number): Observable<ApiResponse<Trip>> {
    return this.http.put<ApiResponse<Trip>>(`${this.url}/${tripId}/acknowledge?driverId=${driverId}`, {});
  }
  driverComplete(tripId: number, driverId: number): Observable<ApiResponse<Trip>> {
    return this.http.put<ApiResponse<Trip>>(`${this.url}/${tripId}/complete?driverId=${driverId}`, {});
  }
}
