"use client";

import type { License } from "@/types/license";

interface CardStatusProps {
  expirationDate: string;
  status: License["status"];
}

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

export function CardStatus({ expirationDate, status }: CardStatusProps) {
  return (
    <div
      className="bg-surface-container-low rounded-xl flex items-center justify-between mb-4"
      style={{ padding: "16px 20px" }}
    >
      <div>
        <p
          className="text-on-surface-variant"
          style={{ fontSize: "11px", marginBottom: "4px" }}
        >
          Válida até
        </p>
        <p className="font-bold text-on-surface" style={{ fontSize: "15px" }}>
          {formatDate(expirationDate)}
        </p>
      </div>
      <span
        className={`font-semibold rounded-full px-3 py-1 ${statusColor(status)}`}
        style={{ fontSize: "12px" }}
      >
        {statusLabel(status)}
      </span>
    </div>
  );
}
