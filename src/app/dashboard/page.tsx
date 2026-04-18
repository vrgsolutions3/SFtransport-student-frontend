"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useEnrollmentPeriodContext } from "@/contexts/EnrollmentPeriodContext";
import { useLicenseContext } from "@/contexts/LicenseContext";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DashboardGreeting from "@/components/dashboard/DashboardGreeting";
import DashboardSkeleton from "@/components/dashboard/DashboardSkeleton";
import { DashboardActions } from "@/components/dashboard/DashboardActions";
import { PushNotificationsCard } from "@/components/pwa/PushNotificationsCard";

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const justRequested = searchParams.get("requested") === "true";
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const { hasOpenPeriod, loading: periodLoading } = useEnrollmentPeriodContext();
  const {
    hasLicense,
    licenseRequest,
    loading: licenseLoading,
    isUnderReview,
    isRejected,
    isWaitlisted,
    rejectionReason,
  } = useLicenseContext();

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
        {isWaitlisted && (
          <section
            className="mb-4 rounded-2xl border border-tertiary/20 bg-tertiary-container p-4"
            style={{ boxShadow: "0 4px 16px var(--shadow-tertiary)" }}
          >
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-tertiary/15 p-2 shrink-0">
                <svg className="text-on-tertiary w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h2 className="font-headline font-bold text-on-tertiary text-sm">
                  Sua solicitação está na fila de espera
                </h2>
                <p className="text-on-tertiary text-sm/relaxed">
                  Sua solicitação está na fila de espera. Você será notificado quando uma vaga for liberada.
                </p>
              </div>
            </div>
          </section>
        )}
        {!hasLicense && <PushNotificationsCard />}
        <DashboardActions
          licenseLoading={licenseLoading}
          hasLicense={hasLicense}
          isUnderReview={isUnderReview || justRequested}
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
