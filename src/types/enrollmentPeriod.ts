export interface EnrollmentPeriod {
  _id: string;
  startDate: string;
  endDate: string;
  totalSlots: number;
  filledSlots: number;
  waitlistSequence: number;
  closedWaitlistCount: number;
  waitlistClosedAt: string | null;
  licenseValidityMonths: number;
  active: boolean;
  createdByAdminId: string;
  closedByAdminId: string | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
