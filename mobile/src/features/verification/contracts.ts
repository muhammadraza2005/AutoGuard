// Presentation contracts. Align real endpoints/payloads with backend.md before integration.
export type VehicleSaleStatus = 'NOT_FOR_SALE' | 'FOR_SALE' | 'SALE_BY_AUTHORIZED_AGENT' | 'REPORTED_MISSING';
export type TransactionOutcome = 'WAITING' | 'CONFIRMED' | 'DENIED' | 'NO_RESPONSE' | 'EXPIRED';
export type PaymentState = 'NOT_REQUIRED' | 'PENDING' | 'CONFIRMED' | 'FAILED' | 'REFUNDED';

// This is intentionally a public projection with no owner identity or seal positions.
export type PublicVehicleSummary = {
  vehicleReference: string;
  plate: string;
  make: string;
  model: string;
  year: number;
  saleStatus: VehicleSaleStatus;
};

export type VerificationView = {
  requestReference: string;
  payment: PaymentState;
  outcome: TransactionOutcome;
  vehicle?: PublicVehicleSummary;
  responseDeadline?: string; // ISO server timestamp
  confirmationExpiresAt?: string; // Only this buyer/vehicle/transaction
};
// Never render vehicle results for a paid check until the server confirms payment.
// Listing status, sale authorization, and clearance are separate facts.

