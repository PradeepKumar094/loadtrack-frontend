export interface Truck {
  id: number;
  truckNumber: string;
  model: string;
  capacityTons: number;
  insuranceNumber: string;
  rcNumber: string;
  status: 'AVAILABLE' | 'ON_TRIP' | 'MAINTENANCE';
  createdAt?: string;
  updatedAt?: string;
}

export interface TruckRequest {
  truckNumber: string;
  model: string;
  capacityTons: number;
  insuranceNumber: string;
  rcNumber: string;
  status?: string;
}
