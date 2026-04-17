"use client";
import { createContext, useContext } from "react";
import { useLicense } from "@/hooks/useLicense";
import type { UseLicenseResult } from "@/hooks/useLicense";

const LicenseContext = createContext<UseLicenseResult | null>(null);

export function LicenseProvider({ children, enabled }: { children: React.ReactNode; enabled: boolean }) {
  const license = useLicense({ enabled });
  return (
    <LicenseContext.Provider value={license}>
      {children}
    </LicenseContext.Provider>
  );
}

export function useLicenseContext(): UseLicenseResult {
  const ctx = useContext(LicenseContext);
  if (!ctx) throw new Error("useLicenseContext fora de LicenseProvider");
  return ctx;
}
