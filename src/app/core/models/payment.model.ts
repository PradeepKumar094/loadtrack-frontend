export interface Payment {
  id: number;
  trip: {
    id: number;
    dealer: { id: number; name: string };
    truck: { id: number; truckNumber: string };
    tripDate: string;
    totalAmount: number;
  };
  originalAmount: number;
  interestAmount: number;
  finalAmount: number;
  paidAmount: number;
  paymentStatus: 'UNPAID' | 'PARTIAL' | 'PAID';
  paymentDate?: string;
  dueDate?: string;
  dealerPaidPending?: boolean;
  adminVerified?: boolean;
  pendingVerificationAmount?: number;
}

export interface PaymentRequest {
  paidAmount: number;
  paymentDate?: string;
  remarks?: string;
}

export interface Receipt {
  id: number;
  payment: Payment;
  receiptNumber: string;
  generatedAt: string;
  pdfPath?: string;
}

export interface DashboardData {
  totalTrucks?: number;
  totalDrivers?: number;
  totalDealers?: number;
  totalTrips?: number;
  pendingPayments?: number;
  pendingVerifications?: number;
  pendingSandRequests?: number;
  monthlyEarnings?: number;
  assignedTrips?: number;
  completedTrips?: number;
  pendingTrips?: number;
  cancelledTrips?: number;
  totalSalaryEarned?: number;
  totalAmount?: number;
  paidAmount?: number;
  pendingAmount?: number;
}
