import { type LucideIcon, ScanFace, FileText, CalendarRange } from "lucide-react";
 
export interface DocumentConfig {
  photoType: string;
  label: string;
  description: string;
  icon: LucideIcon;
  required: boolean;
  /** Se true, valida proporção 3x4 e heurística de rosto */
  validateRatio: boolean;
  /** Se true, aceita PDF além de imagens */
  acceptPdf: boolean;
}
 
export const LICENSE_DOCUMENTS: DocumentConfig[] = [
  {
    photoType: "ProfilePhoto",
    label: "Foto 3x4",
    description: "Foto recente no formato 3x4 (JPEG ou PNG)",
    icon: ScanFace,
    required: true,
    validateRatio: true,
    acceptPdf: false,
  },
  {
    photoType: "EnrollmentProof",
    label: "Comprovante de Matrícula",
    description: "Documento emitido pela instituição de ensino",
    icon: FileText,
    required: true,
    validateRatio: false,
    acceptPdf: true,
  },
  {
    photoType: "CourseSchedule",
    label: "Grade Horária",
    description: "Comprovante de horário das aulas",
    icon: CalendarRange,
    required: true,
    validateRatio: false,
    acceptPdf: true,
  },
  {
    photoType: "GovernmentId",
    label: "Documento de Identidade",
    description: "RG, CNH ou documento oficial (JPEG/PNG/PDF)",
    icon: FileText,
    required: false,
    validateRatio: false,
    acceptPdf: true,
  },
  {
    photoType: "ProofOfResidence",
    label: "Comprovante de Residência",
    description: "Conta/declaração de residência (JPEG/PNG/PDF)",
    icon: FileText,
    required: false,
    validateRatio: false,
    acceptPdf: true,
  },
];