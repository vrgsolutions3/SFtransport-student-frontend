"use client";

import { useMemo, useState } from "react";
import { Check, Moon, Sun, Sunrise, TriangleAlert } from "lucide-react";
import type { LucideIcon } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DayPeriod {
  day: string; // "SEG" | "TER" | "QUA" | "QUI" | "SEX"
  period: string; // "Manhã" | "Tarde" | "Noite"
}

export interface Step3Data {
  selections: DayPeriod[];
}

interface Step3GradeProps {
  data: Step3Data;
  onChange: (data: Step3Data) => void;
  onBack: () => void;
  onSubmit: () => void;
  submitting?: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DAYS = [
  { short: "SEG", full: "Segunda-feira", dayOfWeek: 1 },
  { short: "TER", full: "Terça-feira", dayOfWeek: 2 },
  { short: "QUA", full: "Quarta-feira", dayOfWeek: 3 },
  { short: "QUI", full: "Quinta-feira", dayOfWeek: 4 },
  { short: "SEX", full: "Sexta-feira", dayOfWeek: 5 },
];

interface Period {
  id: string;
  label: string;
  time: string;
  Icon: LucideIcon;
}

const PERIODS: Period[] = [
  { id: "Manhã",  label: "Manhã", time: "07:00 — 11:30", Icon: Sunrise },
  { id: "Tarde",  label: "Tarde", time: "13:00 — 17:30", Icon: Sun     },
  { id: "Noite",  label: "Noite", time: "18:30 — 22:40", Icon: Moon    },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildKey(day: string, period: string) {
  return `${day}::${period}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Step3Grade({
  data,
  onChange,
}: Step3GradeProps) {
  const [activeDay, setActiveDay] = useState<string>(
    DAYS[0].short,
  );

  const selectionSet = useMemo(
    () => new Set(data.selections.map((s) => buildKey(s.day, s.period))),
    [data.selections],
  );

  const isSelected = (day: string, period: string) =>
    selectionSet.has(buildKey(day, period));

  const toggle = (day: string, period: string) => {
    const key = buildKey(day, period);
    const already = selectionSet.has(key);
    const next = already
      ? data.selections.filter((s) => !(s.day === day && s.period === period))
      : [...data.selections, { day, period }];
    onChange({ selections: next });
  };

  const periodsForActiveDay = PERIODS.map((p) => ({
    ...p,
    selected: isSelected(activeDay, p.id),
  }));

  const totalSelected = data.selections.length;

  const activeDayFull =
    DAYS.find((d) => d.short === activeDay)?.full ?? activeDay;

  return (
    <div className="space-y-6">
      {/* Alerta */}
      <div
        className="flex items-start gap-3 rounded-xl bg-warning/10 border border-warning/30"
        style={{ padding: "14px 16px" }}
        role="alert"
        aria-live="polite"
      >
        <TriangleAlert className="text-warning" />
        <div className="text-sm text-on-surface leading-relaxed">
          <p className="font-bold text-warning">Atenção!</p>
          <p>
            Garanta que os horários selecionados abaixo são{" "}
            <strong>exatamente os mesmos</strong> que você enviou no documento
            da etapa anterior.
          </p>
        </div>
      </div>

      {/* Dia da semana */}
      <div>
        <label className="text-sm font-medium text-on-surface-variant ml-1 mb-3 block">
          Dias da semana com aula (recorrente durante o semestre)
        </label>

        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
          {DAYS.map((day) => {
            const active = day.short === activeDay;
            const hasSel = data.selections.some((s) => s.day === day.short);

            return (
              <button
                key={day.short}
                type="button"
                onClick={() => setActiveDay(day.short)}
                aria-label={`Selecionar ${day.full}`}
                className={`relative shrink-0 flex-1 min-w-0 flex flex-col items-center justify-center gap-1 rounded-2xl h-16 transition-all active:scale-95 ${
                  active
                    ? "bg-primary text-white shadow-md"
                    : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
                }`}
              >
                <span
                  className={`text-xs font-bold uppercase tracking-wide ${
                    active ? "text-white/80" : "text-on-surface-variant"
                  }`}
                >
                  {day.short}
                </span>

                {hasSel && !active && (
                  <span
                    className="absolute bottom-2 bg-primary rounded-full"
                    style={{ width: "6px", height: "6px" }}
                    aria-label="Períodos selecionados neste dia"
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Períodos */}
      <div>
        <label className="text-sm font-medium text-on-surface-variant ml-1 mb-3 block">
          Períodos — {activeDayFull}
        </label>

        <div className="space-y-3">
          {periodsForActiveDay.map((period) => (
            <button
              key={period.id}
              type="button"
              onClick={() => toggle(activeDay, period.id)}
              aria-label={`${period.selected ? "Remover" : "Adicionar"} período ${period.label} (${period.time})`}
              className={`w-full flex items-center gap-4 rounded-2xl transition-all active:scale-[0.98] ${
                period.selected
                  ? "bg-surface-container border-2 border-primary"
                  : "bg-surface-container-low border-2 border-transparent hover:border-outline-variant"
              }`}
              style={{ padding: "16px 20px" }}
            >
              <div
                className={`flex items-center justify-center rounded-xl shrink-0 ${
                  period.selected ? "bg-primary/10" : "bg-surface-container-high"
                }`}
                style={{ width: "48px", height: "48px" }}
              >
                <period.Icon
                  className={`w-5 h-5 ${period.selected ? "text-primary" : "text-on-surface-variant"}`}
                />
              </div>

              <div className="flex-1 text-left">
                <p
                  className={`text-sm font-medium mb-0.5 ${
                    period.selected ? "text-primary" : "text-on-surface-variant"
                  }`}
                >
                  {period.label}
                </p>
                <p className="text-lg font-semibold leading-tight text-on-surface">
                  {period.time}
                </p>
              </div>

              <div
                className={`flex items-center justify-center rounded-full shrink-0 transition-all ${
                  period.selected
                    ? "bg-primary"
                    : "border-2 border-outline-variant bg-transparent"
                }`}
                style={{ width: "28px", height: "28px" }}
                aria-hidden="true"
              >
                {period.selected && <Check className="w-4 h-4 text-white" />}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Resumo */}
      <div className="mt-2 bg-surface-container-low rounded-xl px-4 py-3 flex items-center justify-between border border-outline-variant/40">
        <span className={`text-sm ${totalSelected === 0 ? "text-on-surface-muted" : "text-primary font-medium"}`}>
          {totalSelected === 0
            ? "Nenhum período selecionado"
            : `${totalSelected} período${totalSelected !== 1 ? "s" : ""} selecionado${totalSelected !== 1 ? "s" : ""}`}
        </span>
      </div>
    </div>
  );
}
