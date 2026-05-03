"use client";

// Forçar rendering dinâmico para evitar erro de prerender com hooks de navegação
export const dynamic = 'force-dynamic';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
  const [justRequested, setJustRequested] = useState(false);
  const [justWaitlisted, setJustWaitlisted] = useState(false);
  const [justWaitlistedPosition, setJustWaitlistedPosition] = useState<number | null>(null);

  useEffect(() => {
    // leitura de query params no cliente para evitar hooks de navegação em SSR
    const params = new URLSearchParams(window.location.search);
    setJustRequested(params.get("requested") === "true");
    if (params.get("waitlisted") === "true") {
      setJustWaitlisted(true);
      const pos = Number(params.get("position"));
      setJustWaitlistedPosition(pos > 0 ? pos : null);
    }
  }, []);
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
    filaPosition,
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
        {(isWaitlisted || justWaitlisted) && (
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
                {(() => {
                  const pos = filaPosition ?? justWaitlistedPosition;
                  return pos != null ? (
                    <p className="text-on-tertiary text-sm/relaxed">Posição atual: {pos}</p>
                  ) : (
                    <p className="text-on-tertiary text-sm/relaxed">Sua solicitação está na fila de espera. Você será notificado quando uma vaga for liberada.</p>
                  );
                })()}
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
          isWaitlisted={isWaitlisted || justWaitlisted}
          hasOpenEnrollmentPeriod={hasOpenPeriod}
          rejectionReason={rejectionReason}
          filaPosition={filaPosition ?? justWaitlistedPosition ?? undefined}
          shouldShowDocumentsCard={shouldShowDocumentsCard}
        />
      </main>
    </>
  );
}
