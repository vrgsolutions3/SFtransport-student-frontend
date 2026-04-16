"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useEnrollmentPeriod } from "@/hooks/useEnrollmentPeriod";
import { useLicense } from "@/hooks/useLicense";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DashboardGreeting from "@/components/dashboard/DashboardGreeting";
import DashboardSkeleton from "@/components/dashboard/DashboardSkeleton";
import { DashboardActions } from "@/components/dashboard/DashboardActions";
import { PushNotificationsCard } from "@/components/pwa/PushNotificationsCard";

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const { hasOpenPeriod, loading: periodLoading } = useEnrollmentPeriod({
    enabled: isAuthenticated && !authLoading,
  });
  const {
    hasLicense,
    licenseRequest,
    loading: licenseLoading,
    isUnderReview,
    isRejected,
    isWaitlisted,
    rejectionReason,
  } = useLicense({
    enabled: isAuthenticated && !authLoading,
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push("/login");
  }, [isAuthenticated, authLoading, router]);

  if (authLoading || !user || licenseLoading || periodLoading) {
    return <DashboardSkeleton />;
  }

  const displayName = user.name;
  const shouldShowDocumentsCard = hasLicense || licenseRequest !== null;

  return (
    <>
      <DashboardHeader title="Menu Principal" />
      <main className="flex flex-col flex-1 pt-24 pb-8 px-6 max-w-lg mx-auto w-full">
        <DashboardGreeting name={displayName} />
        <PushNotificationsCard />
        <DashboardActions
          licenseLoading={licenseLoading}
          hasLicense={hasLicense}
          isUnderReview={isUnderReview}
          isRejected={isRejected}
          isWaitlisted={isWaitlisted}
          hasOpenEnrollmentPeriod={hasOpenPeriod}
          rejectionReason={rejectionReason}
          shouldShowDocumentsCard={shouldShowDocumentsCard}
        />
      </main>
    </>
  );
}
