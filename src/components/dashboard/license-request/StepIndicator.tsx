"use client";

const DEFAULT_STEPS = [
  { label: "Informações" },
  { label: "Documentos" },
  { label: "Grade" },
];

interface StepIndicatorProps {
  currentStep: number;
  totalSteps?: number;
  labels?: string[];
}

export default function StepIndicator({
  currentStep,
  totalSteps = DEFAULT_STEPS.length,
  labels,
}: StepIndicatorProps) {
  const stepLabels = labels ?? DEFAULT_STEPS.map((step) => step.label);
  const safeTotal = Math.max(1, totalSteps);
  const safeCurrent = Math.min(Math.max(currentStep, 1), safeTotal);
  const progress = Math.round((safeCurrent / safeTotal) * 100);
  const label = stepLabels[safeCurrent - 1] ?? "";

  return (
    <div className="mb-6 space-y-2">
      <div className="h-1.5 w-full rounded-full bg-outline-variant overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500 ease-in-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-xs text-on-surface-variant">
        Passo {safeCurrent} de {safeTotal} — {label}
      </p>
    </div>
  );
}
