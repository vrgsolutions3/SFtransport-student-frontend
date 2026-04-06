import { QrCode, UserCog, type LucideIcon } from "lucide-react";

export interface DashboardAction {
  href: string;
  title: string;
  description: string;
  disabledDescription?: string;
  icon: LucideIcon;
  variant: "primary" | "surface";
  requiresLicense?: boolean;
}

export const DASHBOARD_ACTIONS: DashboardAction[] = [
  {
    href: "/dashboard/card",
    title: "Visualização da carteirinha",
    description: "Sua carteira digital QR Code",
    disabledDescription: "Crie sua carteirinha para visualizá-la aqui",
    icon: QrCode,
    variant: "primary",
    requiresLicense: true,
  },
  {
    href: "/dashboard/profile",
    title: "Alteração de informações",
    description: "Editar perfil e preferências",
    icon: UserCog,
    variant: "surface",
  },
];