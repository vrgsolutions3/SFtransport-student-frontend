"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "@/providers/ThemeProvider";
import { Sun, Moon } from "lucide-react";
interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className = "" }: ThemeToggleProps) {
  const { theme, toggle } = useTheme();
  const isClient = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const isDark = isClient && theme === "dark";
  const title = isDark ? "Modo claro" : "Modo escuro";
  const ariaLabel = isDark ? "Ativar modo claro" : "Ativar modo escuro";

  return (
    <button
      onClick={toggle}
      className={`cursor-pointer p-2 rounded-full transition-colors active:scale-95 ${className}`}
      title={title}
      aria-label={ariaLabel}
    >
      {isDark ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );
}
