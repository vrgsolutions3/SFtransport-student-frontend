"use client";


import { BottomNav } from "@/components/dashboard/BottomNav";
import { SwipeNavigator } from "@/components/dashboard/SwipeNavigator";
import { LicenseProvider } from "@/contexts/LicenseContext";
import { EnrollmentPeriodProvider } from "@/contexts/EnrollmentPeriodContext";

import { useAuth } from "@/hooks/useAuth";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading } = useAuth();
  const enabled = isAuthenticated && !isLoading;
  return (
    <EnrollmentPeriodProvider enabled={enabled}>
      <LicenseProvider enabled={enabled}>
        <div className="min-h-screen flex flex-col bg-surface pb-24 overflow-x-hidden">
          <SwipeNavigator>{children}</SwipeNavigator>
          <BottomNav />
        </div>
      </LicenseProvider>
    </EnrollmentPeriodProvider>
  );
}
