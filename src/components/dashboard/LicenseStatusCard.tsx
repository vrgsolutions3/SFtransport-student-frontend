"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useEnrollmentPeriodContext } from "@/contexts/EnrollmentPeriodContext";
import { useLicenseContext } from "@/contexts/LicenseContext";
import { License } from "@/types/license";
import { CreditCard, Hourglass, ListOrdered, Lock, QrCode } from "lucide-react";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function statusLabel(status: License["status"]) {
  const map: Record<License["status"], string> = {
    active: "Ativa",
    inactive: "Inativa",
    expired: "Expirada",
  };
  return map[status];
}

function statusColor(status: License["status"]) {
  const map: Record<License["status"], string> = {
    active: "text-success bg-success-container",
    inactive: "text-warning bg-warning-container",
    expired: "text-error bg-error-container",
  };
  return map[status];
}

function LicenseStatusCardInner() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { hasOpenPeriod, loading: periodLoading } = useEnrollmentPeriodContext();
  const { license, loading, hasLicense, isWaitlisted, filaPosition } = useLicenseContext();
  const searchParams = useSearchParams();
  const justRequested = searchParams.get("requested") === "true";

  if (loading || periodLoading) {
    return (
      <div
        className="rounded-xl bg-surface-container-low animate-pulse"
        style={{ height: "80px", border: "1px solid var(--shadow-border)" }}
      />
    );
  }

  if (!hasLicense) {
    if (!hasOpenPeriod) {
      return (
        <div
          className="rounded-xl bg-surface-container-low"
          style={{
            padding: "20px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            border: "1px solid var(--shadow-border)",
          }}
        >
          <div>
            <p className="font-headline font-bold text-on-surface" style={{ fontSize: "15px", marginBottom: "4px" }}>
              Inscrições encerradas
            </p>
            <p className="text-on-surface-variant" style={{ fontSize: "12px" }}>
              Aguarde a abertura de um novo período.
            </p>
          </div>
          <div className="bg-warning-container rounded-full" style={{ padding: "10px" }}>
            <Lock className="text-warning" size={24} />
          </div>
        </div>
      );
    }

    if (isWaitlisted) {
      return (
        <div
          className="rounded-xl bg-tertiary-container"
          style={{
            padding: "20px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            border: "1px solid var(--shadow-tertiary)",
          }}
        >
          <div>
            <p className="font-headline font-bold text-on-tertiary" style={{ fontSize: "15px", marginBottom: "4px" }}>
              Na fila de espera
            </p>
            <p className="text-on-tertiary" style={{ fontSize: "12px" }}>
              {filaPosition !== null
                ? `Posição atual: ${filaPosition}`
                : "A fila ainda não existe."}
            </p>
          </div>
          <div className="bg-black/10 rounded-full" style={{ padding: "10px" }}>
            <ListOrdered className="text-on-tertiary" size={24} />
          </div>
        </div>
      );
    }

    if (justRequested) {
      return (
        <div
          className="rounded-xl bg-surface-container-low"
          style={{
            padding: "20px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            border: "1px solid var(--shadow-border)",
          }}
        >
          <div>
            <p className="font-headline font-bold text-on-surface" style={{ fontSize: "15px", marginBottom: "4px" }}>
              Pedido enviado!
            </p>
            <p className="text-on-surface-variant" style={{ fontSize: "12px" }}>
              Aguardando análise do responsável
            </p>
          </div>
          <div className="bg-surface-container-high rounded-full" style={{ padding: "10px" }}>
            <Hourglass className="text-primary" size={24} />
          </div>
        </div>
      );
    }

    return (
      <Link
        href="/dashboard/request-license"
        className="rounded-xl bg-secondary active:scale-95 transition-all duration-200"
        style={{
          padding: "20px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "0 4px 20px var(--shadow-secondary)",
        }}
      >
        <div>
          <p className="font-headline font-bold text-white" style={{ fontSize: "15px", marginBottom: "4px" }}>
            Criar carteirinha
          </p>
          <p className="text-white/75" style={{ fontSize: "12px" }}>
            Solicite sua carteira estudantil
          </p>
        </div>
        <div className="bg-black/10 rounded-full" style={{ padding: "10px" }}>
          <CreditCard className="text-white" size={24} />
        </div>
      </Link>
    );
  }

  return (
    <Link
      href="/dashboard/card"
      className="rounded-xl bg-primary active:scale-95 transition-all duration-200"
      style={{
        padding: "20px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        boxShadow: "0 4px 20px var(--shadow-primary)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "linear-gradient(135deg, var(--shadow-primary-overlay) 0%, transparent 100%)" }}
      />
      <div style={{ position: "relative", zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
          <p className="font-headline font-bold text-white" style={{ fontSize: "15px" }}>
            Carteirinha ativa
          </p>
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusColor(license!.status)}`}
            style={{ fontSize: "11px" }}
          >
            {statusLabel(license!.status)}
          </span>
        </div>
        <p className="text-white/70" style={{ fontSize: "12px" }}>
          Válida até {formatDate(license!.expirationDate)}
        </p>
      </div>
      <div className="bg-surface-container-lowest/10 rounded-full" style={{ padding: "10px", position: "relative", zIndex: 10 }}>
        <QrCode className="text-white" size={24} />
      </div>
    </Link>
  );
}

export default function LicenseStatusCard() {
  return (
    <Suspense
      fallback={
        <div
          className="rounded-xl bg-surface-container-low animate-pulse"
          style={{ height: "80px", border: "1px solid var(--shadow-border)" }}
        />
      }
    >
      <LicenseStatusCardInner />
    </Suspense>
  );
}
