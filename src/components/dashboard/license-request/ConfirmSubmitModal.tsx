"use client";

import { ClipboardCheck, Send, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface ConfirmSubmitModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  submitting: boolean;
  semVagas: boolean;
  institution: string;
  degree: string;
  shift: string;
  totalPeriods: number;
}

export default function ConfirmSubmitModal({
  open,
  onClose,
  onConfirm,
  submitting,
  semVagas,
  institution,
  degree,
  shift,
  totalPeriods,
}: ConfirmSubmitModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={() => { if (!submitting) onClose(); }}
    >
      <div
        className="bg-surface w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl px-6 pt-6 pb-10 sm:pb-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ícone */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
            <ClipboardCheck className="w-7 h-7 text-primary" />
          </div>
          <h2 className="text-lg font-bold text-on-surface text-center">
            Confirmar envio
          </h2>
          <p className="text-sm text-on-surface-variant text-center">
            Verifique seus dados antes de enviar
          </p>
        </div>

        {/* Resumo */}
        <div className="bg-surface-container-low rounded-xl px-4 py-3 space-y-2">
          {[
            { label: "Instituição", value: institution },
            { label: "Curso", value: degree },
            { label: "Turno", value: shift },
            { label: "Períodos", value: `${totalPeriods} período(s) selecionado(s)` },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between items-center text-sm">
              <span className="text-on-surface-variant">{label}</span>
              <span className="text-on-surface font-medium truncate max-w-[60%] text-right">
                {value}
              </span>
            </div>
          ))}
        </div>

        {/* Aviso */}
        <div className="flex items-start gap-2 bg-warning-container/50 rounded-xl px-3 py-2.5">
          <TriangleAlert className="w-4 h-4 text-warning shrink-0 mt-0.5" />
          <p className="text-xs text-on-surface leading-relaxed">
            Certifique-se que os horários coincidem com os documentos enviados na etapa anterior.
          </p>
        </div>

        {semVagas && (
          <div className="rounded-lg bg-tertiary-container p-4 text-on-tertiary text-sm leading-relaxed">
            <strong>Atenção:</strong> Não há vagas disponíveis no momento.
            Sua solicitação entrará na fila de espera e você será notificado por e-mail quando uma vaga for liberada.
          </div>
        )}

        {/* Botões */}
        <div className="flex flex-col gap-2">
          <Button
            variant="primary"
            size="lg"
            fullWidth
            loading={submitting}
            icon={Send}
            onClick={onConfirm}
          >
            Confirmar e Enviar
          </Button>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="w-full py-2.5 text-sm font-medium text-on-surface-variant hover:bg-surface-container rounded-xl transition-all disabled:opacity-40"
          >
            Revisar
          </button>
        </div>
      </div>
    </div>
  );
}
