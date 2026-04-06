"use client";

import { Suspense } from "react";
import Link from "next/link";
import { CreditCard, BadgeCheck, Clock3 } from "lucide-react";
import { useLicense } from "@/hooks/useLicense";

function Skeleton() {
  return (
    <div className="rounded-xl bg-surface-container-low animate-pulse h-22 border border-outline-variant/30" />
  );
}

function LicenseActionCardInner() {
  const { loading, hasLicense, isUnderReview } = useLicense();

  if (loading) return <Skeleton />;

  if (isUnderReview) {
    return (
      <div
        className="flex cursor-not-allowed items-center justify-between rounded-xl bg-warning p-6 opacity-90"
        style={{ boxShadow: "0 4px 20px var(--shadow-warning)" }}
        aria-disabled="true"
      >
        <div>
          <h3 className="font-headline text-lg font-bold text-white mb-1">
            Carteirinha em análise
          </h3>
          <p className="text-sm text-white/90">
            Estamos validando seus documentos. Aguarde aprovação.
          </p>
        </div>
        <div className="bg-black/10 rounded-full p-3 shrink-0 ml-4">
          <Clock3 className="text-white w-7 h-7" />
        </div>
      </div>
    );
  }

  if (!hasLicense) {
    return (
      <Link
        href="/dashboard/request-license"
        className="flex items-center justify-between p-6 rounded-xl bg-secondary active:scale-95 transition-all duration-200"
        style={{ boxShadow: "0 4px 20px var(--shadow-secondary)" }}
      >
        <div>
          <h3 className="font-headline font-bold text-white text-lg mb-1">
            Criar carteirinha
          </h3>
          <p className="text-white/80 text-sm">
            Solicite sua carteira estudantil
          </p>
        </div>
        <div className="bg-black/10 rounded-full p-3 shrink-0 ml-4">
          <CreditCard className="text-white w-7 h-7" />
        </div>
      </Link>
    );
  }

  return (
    <Link
      href="/dashboard/license-configuration"
      className="relative overflow-hidden flex items-center justify-between p-6 rounded-xl bg-primary active:scale-95 transition-all duration-200"
      style={{ boxShadow: "0 4px 20px var(--shadow-primary)" }}
    >
      <div className="absolute inset-0 pointer-events-none bg-linear-to-br from-(--shadow-primary-overlay) to-transparent" />

      <div className="relative z-10">
        <h3 className="font-headline font-bold text-white text-lg mb-1">
          Carteirinha aprovada
        </h3>
        <p className="text-white/80 text-sm">
          Abrir configuração de informações
        </p>
      </div>

      <div className="relative z-10 bg-white/10 rounded-full p-3 shrink-0 ml-4">
        <BadgeCheck className="text-white w-7 h-7" />
      </div>
    </Link>
  );
}

export default function LicenseActionCard() {
  return (
    <Suspense fallback={<Skeleton />}>
      <LicenseActionCardInner />
    </Suspense>
  );
}