export type CreditStatus = "good" | "excellent" | "fair" | "poor";

export interface Lead {
  id?: string;
  lead_id?: string;

  name: string;
  phone: string;
  email: string;

  budget: number;
  preferredVehicle: string;

  stage: string;
  statuses: string[];

  assignedRep: string | null;

  lastActivity: string;

  downPayment: number;
  location: string;

  creditStatus: CreditStatus;

  timeline: string;

  createdAt: string;
}