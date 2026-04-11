"use client";

import { ArrowLeft, ArrowRight, Send } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { FlowStep } from "@/lib/updateDocumentUtils";

interface UpdateDocumentsFooterProps {
  step: FlowStep;
  submitting: boolean;
  isProcessing: boolean;
  allSelectedUploaded: boolean;
  hasCourseSchedule: boolean;
  gradeSelectionsCount: number;
  selectedTypesCount: number;
  onContinueStep1: () => void;
  onContinueStep2: () => void;
  onBackToStep1: () => void;
  onBackToStep2: () => void;
  onSubmit: () => void;
}

export function UpdateDocumentsFooter({
  step,
  submitting,
  isProcessing,
  allSelectedUploaded,
  hasCourseSchedule,
  gradeSelectionsCount,
  selectedTypesCount,
  onContinueStep1,
  onContinueStep2,
  onBackToStep1,
  onBackToStep2,
  onSubmit,
}: UpdateDocumentsFooterProps) {
  if (step === 1) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-40 px-6 pb-8 pt-4 bg-linear-to-t from-surface via-surface/90 to-transparent flex justify-center">
        <Button
          variant="primary"
          size="lg"
          icon={ArrowRight}
          className="w-3/4 max-w-xs"
          onClick={onContinueStep1}
          disabled={selectedTypesCount === 0}
        >
          Continuar
        </Button>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-40 px-6 pb-8 pt-6 bg-linear-to-t from-surface via-surface/90 to-transparent">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBackToStep1}
            disabled={submitting || isProcessing}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-on-surface-variant hover:bg-surface-container rounded-lg transition-all disabled:opacity-40"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>
          <Button
            variant="primary"
            size="lg"
            className="flex-1"
            onClick={onContinueStep2}
            disabled={!allSelectedUploaded || submitting || isProcessing}
            loading={submitting}
            icon={hasCourseSchedule ? ArrowRight : Send}
          >
            {hasCourseSchedule ? "Continuar" : "Enviar solicitação"}
          </Button>
        </div>
      </div>
    );
  }

  if (step === 3) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-40 px-6 pb-8 pt-6 bg-linear-to-t from-surface via-surface/90 to-transparent">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBackToStep2}
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
            onClick={onSubmit}
            disabled={submitting || gradeSelectionsCount === 0}
            loading={submitting}
            icon={Send}
          >
            Enviar solicitação
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
