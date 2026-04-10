"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useLicense } from "@/hooks/useLicense";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DashboardGreeting from "@/components/dashboard/DashboardGreeting";
import DashboardSkeleton from "@/components/dashboard/DashboardSkeleton";
import { DashboardActions } from "@/components/dashboard/DashboardActions";

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const {
    hasLicense,
    licenseRequest,
    loading: licenseLoading,
    isUnderReview,
    isRejected,
    rejectionReason,
  } = useLicense({
    enabled: isAuthenticated && !authLoading,
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push("/login");
  }, [isAuthenticated, authLoading, router]);

  if (authLoading || !user || licenseLoading) {
    return <DashboardSkeleton />;
  }

  const displayName = user.name;
  const shouldShowDocumentsCard = hasLicense || licenseRequest !== null;

  return (
    <>
      <DashboardHeader title="Menu Principal" />
      <main className="flex flex-col flex-1 pt-24 pb-8 px-6 max-w-lg mx-auto w-full">
        <DashboardGreeting name={displayName} />
        <DashboardActions
          licenseLoading={licenseLoading}
          hasLicense={hasLicense}
          isUnderReview={isUnderReview}
          isRejected={isRejected}
          rejectionReason={rejectionReason}
          shouldShowDocumentsCard={shouldShowDocumentsCard}
        />
      </main>
    </>
  );
}
