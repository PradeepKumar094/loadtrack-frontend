import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Truck, TruckRequest } from '../models/truck.model';
import { ApiResponse } from '../models/auth.model';

@Injectable({ providedIn: 'root' })
export class TruckService {
  private url = `${environment.apiUrl}/trucks`;
  constructor(private http: HttpClient) {}

  getAll(): Observable<ApiResponse<Truck[]>> {
    return this.http.get<ApiResponse<Truck[]>>(this.url);
  }
  getById(id: number): Observable<ApiResponse<Truck>> {
    return this.http.get<ApiResponse<Truck>>(`${this.url}/${id}`);
  }
  create(data: TruckRequest): Observable<ApiResponse<Truck>> {
    return this.http.post<ApiResponse<Truck>>(this.url, data);
  }
  update(id: number, data: TruckRequest): Observable<ApiResponse<Truck>> {
    return this.http.put<ApiResponse<Truck>>(`${this.url}/${id}`, data);
  }
  delete(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.url}/${id}`);
  }
}
