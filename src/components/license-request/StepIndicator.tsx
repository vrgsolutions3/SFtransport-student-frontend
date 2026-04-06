"use client";

const STEPS = [
  { label: "Informações" },
  { label: "Documentos" },
  { label: "Grade" },
];

interface StepIndicatorProps {
  currentStep: number;
}

export default function StepIndicator({ currentStep }: StepIndicatorProps) {
  const progress = [33, 66, 100][currentStep - 1] ?? 33;
  const label = STEPS[currentStep - 1]?.label ?? "";

  return (
    <div className="mb-6 space-y-2">
      <div className="h-1.5 w-full rounded-full bg-outline-variant overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500 ease-in-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-xs text-on-surface-variant">
        Passo {currentStep} de 3 — {label}
      </p>
    </div>
  );
}
