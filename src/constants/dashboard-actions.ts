import { FolderOpen, QrCode, UserCog, type LucideIcon } from "lucide-react";

export interface DashboardAction {
  href: string;
  title: string;
  description: string;
  disabledDescription?: string;
  icon: LucideIcon;
  variant: "primary" | "surface";
  requiresLicense?: boolean;
}

export const DOCUMENTS_ACTION: DashboardAction = {
  href: "/dashboard/documents",
  title: "Meus Documentos",
  description: "Ver e atualizar documentos enviados",
  icon: FolderOpen,
  variant: "surface",
  requiresLicense: false,
};

export const DASHBOARD_ACTIONS: DashboardAction[] = [
  DOCUMENTS_ACTION,
  {
    href: "/dashboard/card",
    title: "Visualização da carteirinha",
    description: "Sua carteira digital QR Code",
    disabledDescription: "Crie sua carteirinha para visualizá-la aqui",
    icon: QrCode,
    variant: "primary",
    requiresLicense: true,
  },
];