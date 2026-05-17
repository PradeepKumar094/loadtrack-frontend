export interface Driver {
  id: number;
  name: string;
  phone: string;
  licenseNumber: string;
  address: string;
  salaryPerTrip: number;
  assignedTruck?: { id: number; truckNumber: string };
  createdAt?: string;
}

export interface DriverRequest {
  name: string;
  phone: string;
  licenseNumber: string;
  address: string;
  salaryPerTrip: number;
  assignedTruckId?: number | null;
  username: string;
  password: string;
}
