"use client";
 
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { DashboardAction } from "@/constants/dashboard-actions";
 
interface ActionCardProps {
  action: DashboardAction;
  disabled?: boolean;
}

const variants = {
  primary: {
    card: "bg-tertiary",
    iconWrap: "bg-white/10",
    title: "text-white font-bold",
    desc: "text-white/80",
    icon: "text-white",
    shadow: "0 4px 20px var(--shadow-tertiary)",
  },
  surface: {
    card: "bg-surface-container-low border border-outline-variant/30",
    iconWrap: "bg-surface-container-high",
    title: "text-on-surface font-bold",
    desc: "text-on-surface-variant",
    icon: "text-primary",
    shadow: "var(--shadow-card)",
  },
};

export default function ActionCard({ action, disabled = false }: ActionCardProps) {
  const { href, title, description, disabledDescription, icon: Icon, variant } = action;
  const v = variants[variant];
  const shownDescription = disabled && disabledDescription ? disabledDescription : description;

  if (disabled) {
    return (
      <div
        className={cn(
          "flex items-center justify-between p-6 rounded-xl opacity-50 cursor-not-allowed select-none",
          v.card
        )}
        style={{ boxShadow: v.shadow }}
      >
        <div>
          <h3 className={cn("font-headline text-lg mb-1", v.title)}>
            {title}
          </h3>
          <p className={cn("text-sm", v.desc)}>
            {shownDescription}
          </p>
        </div>
        <div className={cn("rounded-full p-3 shrink-0 ml-4", v.iconWrap)}>
          <Icon className={cn("w-7 h-7", v.icon)} />
        </div>
      </div>
    );
  }

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center justify-between p-6 rounded-xl",
        "active:scale-95 transition-all duration-200",
        v.card
      )}
      style={{ boxShadow: v.shadow }}
    >
      <div>
        <h3 className={cn("font-headline text-lg mb-1", v.title)}>
          {title}
        </h3>
        <p className={cn("text-sm", v.desc)}>
          {shownDescription}
        </p>
      </div>

      <div className={cn("rounded-full p-3 shrink-0 ml-4", v.iconWrap)}>
        <Icon className={cn("w-7 h-7", v.icon)} />
      </div>
    </Link>
  );
}