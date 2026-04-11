import { type DocumentConfig } from "@/constants/license-documents";
import { LICENSE_DOCUMENTS } from "@/constants/license-documents";

export type FlowStep = 1 | 2 | 3;
export type PhotoType = "ProfilePhoto" | "EnrollmentProof" | "CourseSchedule";
export type StudentImageListItem = { _id: string };

export const STEP_LABELS_TWO = ["Seleção", "Documentos"];
export const STEP_LABELS_THREE = ["Seleção", "Documentos", "Grade"];

export function isPhotoType(value: string): value is PhotoType {
  return (
    value === "ProfilePhoto" ||
    value === "EnrollmentProof" ||
    value === "CourseSchedule"
  );
}

export function buildInitialSelections(): Record<PhotoType, boolean> {
  return { ProfilePhoto: false, EnrollmentProof: false, CourseSchedule: false };
}

export function selectedConfigs(selectedTypes: PhotoType[]): DocumentConfig[] {
  const selectedSet = new Set(selectedTypes);
  return LICENSE_DOCUMENTS.filter((doc) =>
    selectedSet.has(doc.photoType as PhotoType),
  );
}
