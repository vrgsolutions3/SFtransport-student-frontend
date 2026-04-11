"use client";

import { Suspense } from "react";
import Link from "next/link";
import { CreditCard, BadgeCheck, Clock3, ListOrdered, Lock, XCircle } from "lucide-react";

function Skeleton() {
  return (
    <div className="rounded-xl bg-surface-container-low animate-pulse h-22 border border-outline-variant/30" />
  );
}

interface LicenseActionCardProps {
  loading: boolean;
  hasLicense: boolean;
  isUnderReview: boolean;
  isRejected: boolean;
  isWaitlisted: boolean;
  filaPosition: number | null;
  hasOpenEnrollmentPeriod: boolean;
  rejectionReason: string | null;
}

function LicenseActionCardInner({
  loading,
  hasLicense,
  isUnderReview,
  isRejected,
  isWaitlisted,
  filaPosition,
  hasOpenEnrollmentPeriod,
  rejectionReason,
}: LicenseActionCardProps) {

  if (loading) return <Skeleton />;

  if (isWaitlisted) {
    return (
      <div
        className="flex cursor-not-allowed items-center justify-between rounded-xl bg-tertiary-container p-6"
        style={{ boxShadow: "0 4px 20px var(--shadow-tertiary)" }}
        aria-disabled="true"
      >
        <div>
          <h3 className="font-headline text-lg font-bold text-on-tertiary mb-1">
            Na fila de espera
          </h3>
          <p className="text-sm text-on-tertiary/90">
            {filaPosition !== null
              ? `Posição atual: ${filaPosition}`
              : "A fila ainda não existe."}
          </p>
        </div>
        <div className="bg-black/10 rounded-full p-3 shrink-0 ml-4">
          <ListOrdered className="text-on-tertiary w-7 h-7" />
        </div>
      </div>
    );
  }

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

  if (isRejected) {
    return (
      <div
        className="flex flex-col rounded-xl bg-error-container border border-error/30 p-5"
        style={{ boxShadow: "0 4px 20px var(--shadow-error, rgba(186,26,26,0.15))" }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <XCircle className="text-error w-5 h-5 shrink-0" />
            <h3 className="font-headline font-bold text-error text-base">
              Carteirinha recusada
            </h3>
          </div>
        </div>
        {rejectionReason && (
          <p className="text-sm text-error/80 mb-4">
            Motivo: <span className="font-medium">{rejectionReason}</span>
          </p>
        )}
        <Link
          href="/dashboard/request-license"
          className="flex items-center justify-center gap-2 rounded-xl bg-error text-white text-sm font-semibold py-2.5 px-4 active:scale-95 transition-all"
        >
          <CreditCard className="w-4 h-4" />
          Solicitar novamente
        </Link>
      </div>
    );
  }

  if (!hasLicense) {
    if (!hasOpenEnrollmentPeriod) {
      return (
        <div
          className="flex cursor-not-allowed items-center justify-between p-6 rounded-xl bg-surface-container-low border border-outline-variant/30"
          style={{ boxShadow: "0 4px 20px var(--shadow-border)" }}
          aria-disabled="true"
        >
          <div>
            <h3 className="font-headline font-bold text-on-surface text-lg mb-1">
              Inscrições encerradas
            </h3>
            <p className="text-on-surface-variant text-sm">
              Aguarde a abertura de um novo período.
            </p>
          </div>
          <div className="bg-warning-container rounded-full p-3 shrink-0 ml-4">
            <Lock className="text-warning w-7 h-7" />
          </div>
        </div>
      );
    }

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

export default function LicenseActionCard(props: LicenseActionCardProps) {
  return (
    <Suspense fallback={<Skeleton />}>
      <LicenseActionCardInner {...props} />
    </Suspense>
  );
}