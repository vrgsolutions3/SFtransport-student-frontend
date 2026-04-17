"use client";
import { createContext, useContext } from "react";
import { useEnrollmentPeriod } from "@/hooks/useEnrollmentPeriod";
import type { UseEnrollmentPeriodResult } from "@/hooks/useEnrollmentPeriod";

const EnrollmentPeriodContext = createContext<UseEnrollmentPeriodResult | null>(null);

export function EnrollmentPeriodProvider({ children, enabled }: { children: React.ReactNode; enabled: boolean }) {
  const enrollmentPeriod = useEnrollmentPeriod({ enabled });
  return (
    <EnrollmentPeriodContext.Provider value={enrollmentPeriod}>
      {children}
    </EnrollmentPeriodContext.Provider>
  );
}

export function useEnrollmentPeriodContext(): UseEnrollmentPeriodResult {
  const ctx = useContext(EnrollmentPeriodContext);
  if (!ctx) throw new Error("useEnrollmentPeriodContext fora de EnrollmentPeriodProvider");
  return ctx;
}
