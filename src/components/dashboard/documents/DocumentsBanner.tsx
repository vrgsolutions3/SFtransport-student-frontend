"use client";

import { AlertCircle, X } from "lucide-react";

interface DocumentsBannerProps {
  hasRejectedUpdateRequest: boolean;
  showRejectedBanner: boolean;
  showUpdatedBanner: boolean;
  rejectionReason?: string;
  onCloseRejected: () => void;
  onCloseUpdated: () => void;
}

export function DocumentsBanner({
  hasRejectedUpdateRequest,
  showRejectedBanner,
  showUpdatedBanner,
  rejectionReason,
  onCloseRejected,
  onCloseUpdated,
}: DocumentsBannerProps) {
  if (hasRejectedUpdateRequest && showRejectedBanner) {
    return (
      <div className="bg-error-container border border-error/30 text-error text-sm rounded-xl px-4 py-3 mb-5 flex items-start gap-2">
        <AlertCircle size={16} className="mt-0.5" />
        <div className="flex-1">
          <p className="font-semibold">
            Sua solicitação de alteração foi recusada.
          </p>
          <p>
            Motivo: {rejectionReason ?? "Não informado"}. Revise os documentos e
            faça uma nova solicitação.
          </p>
        </div>
        <button
          type="button"
          onClick={onCloseRejected}
          className="p-1 rounded-md hover:bg-error/10 transition-colors"
          aria-label="Fechar aviso"
        >
          <X size={14} />
        </button>
      </div>
    );
  }

  if (showUpdatedBanner) {
    return (
      <div className="bg-success-container border border-success/30 text-success text-sm rounded-xl px-4 py-3 mb-5 flex items-center gap-2">
        <AlertCircle size={16} />
        <span className="flex-1">
          Solicitação de alteração enviada com sucesso. Ela está em análise.
        </span>
        <button
          type="button"
          onClick={onCloseUpdated}
          className="p-1 rounded-md hover:bg-success/10 transition-colors"
          aria-label="Fechar aviso"
        >
          <X size={14} />
        </button>
      </div>
    );
  }

  return null;
}
