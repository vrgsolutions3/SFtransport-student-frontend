"use client";

import { ArrowLeft, ArrowRight, Send } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface LicenseStepFooterProps {
  step: 1 | 2 | 3;
  submitting: boolean;
  interactionBlocked: boolean;
  selectionsCount: number;
  onBackFromStep3: () => void;
  onOpenConfirmModal: () => void;
}

export function LicenseStepFooter({
  step,
  submitting,
  interactionBlocked,
  selectionsCount,
  onBackFromStep3,
  onOpenConfirmModal,
}: LicenseStepFooterProps) {
  if (step === 1) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-40 px-6 pb-8 pt-4 flex justify-center bg-linear-to-t from-surface via-surface/90 to-transparent">
        <Button
          type="submit"
          form="license-step1"
          variant="primary"
          size="lg"
          icon={ArrowRight}
          className="w-3/4 max-w-xs"
          disabled={interactionBlocked}
        >
          Continuar
        </Button>
      </div>
    );
  }

  if (step === 3) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-40 px-6 pb-8 pt-6 flex items-center gap-3 bg-linear-to-t from-surface via-surface/90 to-transparent">
        <button
          type="button"
          onClick={onBackFromStep3}
          disabled={submitting}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-on-surface-variant hover:bg-surface-container rounded-lg transition-all disabled:opacity-40"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </button>
        <Button
          variant="primary"
          size="lg"
          className="flex-1"
          loading={submitting}
          disabled={selectionsCount === 0 || submitting || interactionBlocked}
          icon={Send}
          onClick={onOpenConfirmModal}
        >
          Finalizar
        </Button>
      </div>
    );
  }

  return null;
}
