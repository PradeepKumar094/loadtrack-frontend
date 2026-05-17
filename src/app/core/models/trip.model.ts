export interface Trip {
  id: number;
  truck: { id: number; truckNumber: string };
  driver: { id: number; name: string };
  dealer: { id: number; name: string };
  sandType: { id: number; name: string; pricePerTon: number };
  tons: number;
  sourceLocation: string;
  destinationLocation: string;
  distanceKm: number;
  tripDate: string;
  ratePerTon: number;
  totalAmount: number;
  extraDistanceCharge: number;
  driverExtraAmount: number;
  driverSalary: number;
  status: 'PENDING' | 'ACKNOWLEDGED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  driverAcknowledged: boolean;
  driverCompleted: boolean;
  acknowledgedAt?: string;
  completedAt?: string;
  createdAt?: string;
}

export interface TripRequest {
  truckId: number;
  driverId: number;
  dealerId: number;
  sandTypeId: number;
  tons: number;
  sourceLocation: string;
  destinationLocation: string;
  distanceKm: number;
  tripDate: string;
  status?: string;
  initialPayment?: number;
  paymentRemarks?: string;
}
