export type PhotoType =
  | "ProfilePhoto"
  | "EnrollmentProof"
  | "CourseSchedule"
  | "LicenseImage"
  | "GovernmentId"
  | "ProofOfResidence";

export type StudentImage = {
  _id: string;
  studentId: string;
  photoType: PhotoType;
  active: boolean;
  hasFile: boolean;
  photo3x4: string | null;
  documentImage: string | null;
};

export type StudentImageListItem = {
  _id: string;
  studentId: string;
  photoType: PhotoType;
  active: boolean;
  hasFile: boolean;
};

export type StudentImageFileResponse = {
  _id: string;
  studentId: string;
  photoType: PhotoType;
  active: boolean;
  photo3x4: string | null;
  documentImage: string | null;
};

export const PHOTO_LABELS: Record<PhotoType, string> = {
  ProfilePhoto: "Foto 3x4",
  EnrollmentProof: "Comprovante de Matrícula",
  CourseSchedule: "Grade Horária",
  LicenseImage: "Carteirinha",
  GovernmentId: "Documento de Identidade",
  ProofOfResidence: "Comprovante de Residência",
};

export const DISPLAY_ORDER: PhotoType[] = [
  "ProfilePhoto",
  "EnrollmentProof",
  "CourseSchedule",
];

export const PERSONAL_DISPLAY_ORDER: PhotoType[] = [
  "GovernmentId",
  "ProofOfResidence",
];

export function resolveDocumentData(image: StudentImage): {
  src: string | null;
  isPdf: boolean;
} {
  const src =
    image.photoType === "ProfilePhoto" ? image.photo3x4 : image.documentImage;
  if (!src) return { src: null, isPdf: false };
  return { src, isPdf: src.startsWith("data:application/pdf;base64,") };
}

export function downloadDataUrl(dataUrl: string, fileName: string): void {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = fileName;
  link.click();
}

export function fileNameForType(photoType: PhotoType, isPdf: boolean): string {
  const base: Record<PhotoType, string> = {
    ProfilePhoto: "foto-3x4",
    EnrollmentProof: "comprovante-matricula",
    CourseSchedule: "grade-horaria",
    LicenseImage: "carteirinha",
    GovernmentId: "documento-identidade",
    ProofOfResidence: "comprovante-residencia",
  };
  return `${base[photoType]}.${isPdf ? "pdf" : "jpg"}`;
}
