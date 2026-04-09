"use client";

import { ThemeToggle } from "@/components/ui/ThemeToggle";

export default function DashboardHeader() {
  return (
    <header
      className="fixed top-0 w-full z-50 bg-surface-container-lowest/80 backdrop-blur-md border-b border-outline-variant/30"
      style={{ height: "60px", display: "flex", alignItems: "center", paddingInline: "16px" }}
    >
      <h1
        className="font-headline font-bold text-on-surface flex-1 text-center tracking-tight"
        style={{ fontSize: "16px" }}
      >
        Transporte São Fidélis
      </h1>

      <div className="flex items-center shrink-0">
        <ThemeToggle className="text-on-surface-variant hover:bg-surface-container-low" />
      </div>
    </header>
  );
}