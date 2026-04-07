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
  status: "pending" | "approved" | "rejected";
  rejectionReason: string | null;
  rejectedAt: string | null;
  licenseId: string | null;
  createdAt: string;
}
