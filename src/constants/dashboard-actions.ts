import { FolderOpen, Map, type LucideIcon } from "lucide-react";

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
    href: "/bus",
    title: "Ver Rotas Ativas",
    description: "Consulte as rotas e horários disponíveis",
    icon: Map,
    variant: "primary",
    requiresLicense: false,
  },
];