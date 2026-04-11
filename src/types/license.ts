export type LicenseStatus = "active" | "inactive" | "expired";

export interface License {
  id: string;
  studentId: string;
  imageLicense: string;
  status: LicenseStatus;
  existing: boolean;
  expirationDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface LicenseRequest {
  _id: string;
  studentId: string;
  type?: "initial" | "update";
  status: "pending" | "approved" | "rejected" | "cancelled" | "waitlisted";
  changedDocuments?: string[];
  rejectionReason: string | null;
  rejectedAt: string | null;
  licenseId: string | null;
  enrollmentPeriodId?: string | null;
  filaPosition?: number | null;
  createdAt: string;
}
