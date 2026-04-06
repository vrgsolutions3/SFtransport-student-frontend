"use client";

import { useMemo, useState as useSafeState } from "react";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, Check, Moon, Send, SunMedium, Sunset, TriangleAlert } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DayPeriod {
  day: string; // "SEG" | "TER" | "QUA" | "QUI" | "SEX" | "SAB"
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
  todayIndex?: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DAYS = [
  { short: "SEG", full: "Segunda-feira", dayOfWeek: 1 },
  { short: "TER", full: "Terça-feira", dayOfWeek: 2 },
  { short: "QUA", full: "Quarta-feira", dayOfWeek: 3 },
  { short: "QUI", full: "Quinta-feira", dayOfWeek: 4 },
  { short: "SEX", full: "Sexta-feira", dayOfWeek: 5 },
  { short: "SAB", full: "Sábado", dayOfWeek: 6 },
];

const PERIODS = [
  {
    id: "Manhã",
    label: "MANHÃ",
    time: "07:00 — 11:30",
    icon: SunMedium,
  },
  {
    id: "Tarde",
    label: "TARDE",
    time: "13:00 — 17:30",
    icon: Sunset,
  },
  {
    id: "Noite",
    label: "NOITE",
    time: "18:30 — 22:40",
    icon: Moon,
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildKey(day: string, period: string) {
  return `${day}::${period}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Step3Grade({
  data,
  onChange,
  onBack,
  onSubmit,
  submitting = false,
  todayIndex,
}: Step3GradeProps) {
  const todayIdx = todayIndex ?? new Date().getDay();
  const todayDayInfo = DAYS.find((d) => d.dayOfWeek === todayIdx);

  const [activeDay, setActiveDay] = useSafeState<string>(
    todayDayInfo?.short ?? DAYS[0].short,
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

  const canConfirm = totalSelected > 0;

  return (
    <div className="space-y-6">
      {/* ⚠️ ALERTA DE CONFIRMAÇÃO - DESTAQUE ADICIONADO */}
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

      {/* Dia da semana - SEM DATA NUMÉRICA */}
      <div>
        <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant ml-1 mb-3 block">
          Dias da semana com aula (recorrente durante o semestre)
        </label>

        <div
          className="flex gap-2 overflow-x-auto pb-1"
          style={{ scrollbarWidth: "none" }}
        >
          {DAYS.map((day) => {
            const active = day.short === activeDay;
            const isToday = day.dayOfWeek === todayIdx;
            const hasSel = data.selections.some((s) => s.day === day.short);

            return (
              <button
                key={day.short}
                type="button"
                onClick={() => setActiveDay(day.short)}
                aria-label={`Selecionar ${day.full}${isToday ? " (hoje)" : ""}`}
                className={`relative shrink-0 flex flex-col items-center justify-center rounded-2xl transition-all active:scale-95 ${
                  active
                    ? "bg-primary text-white shadow-md"
                    : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
                }`}
                style={{ width: "64px", height: "72px", gap: "4px" }}
              >
                <span
                  className={`text-xs font-bold uppercase tracking-wide ${
                    active ? "text-white/80" : "text-on-surface-variant"
                  }`}
                >
                  {day.short}
                </span>
                {/* Removeu-se o <span> com dateNum */}

                {hasSel && !active && (
                  <span
                    className="absolute bottom-2 bg-primary rounded-full"
                    style={{ width: "6px", height: "6px" }}
                    aria-label="Períodos selecionados neste dia"
                  />
                )}

                {isToday && !active && (
                  <span
                    className="absolute -top-1 -right-1 bg-secondary rounded-full"
                    style={{
                      width: "10px",
                      height: "10px",
                      border: "2px solid var(--color-surface)",
                    }}
                    aria-label="Dia atual"
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Períodos */}
      <div>
        <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant ml-1 mb-3 block">
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
                  period.selected
                    ? "bg-primary/10"
                    : "bg-surface-container-high"
                }`}
                style={{ width: "48px", height: "48px" }}
              >
                <period.icon
                  className={`w-5 h-5 ${
                    period.selected ? "text-primary" : "text-on-surface-variant"
                  }`}
                />
              </div>

              <div className="flex-1 text-left">
                <p
                  className={`text-xs font-bold uppercase tracking-widest mb-0.5 ${
                    period.selected ? "text-primary" : "text-on-surface-variant"
                  }`}
                >
                  {period.label}
                </p>
                <p
                  className={`text-lg font-semibold leading-tight ${
                    period.selected ? "text-on-surface" : "text-on-surface"
                  }`}
                >
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
                {period.selected && (
                  <Check className="w-4 h-4 text-white" />
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-outline-variant pt-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
              Resumo da seleção
            </p>
            <p className="text-base font-bold text-primary mt-0.5">
              {totalSelected === 0
                ? "Nenhum período selecionado"
                : `${totalSelected} ${totalSelected === 1 ? "Período Selecionado" : "Períodos Selecionados"}`}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
              Referência
            </p>
            <p className="text-sm font-semibold text-on-surface mt-0.5">
              Grade semestral
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onBack}
            disabled={submitting}
            className="flex items-center gap-1 text-on-surface-variant 
            font-semibold text-sm active:scale-95 transition-all disabled:opacity-50 px-4 py-2 rounded-lg 
            hover:bg-surface-container-high"
            aria-label="Voltar para etapa anterior"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>

          <div className="flex-1">
            <Button
              type="button"
              variant="primary"
              size="lg"
              fullWidth
              loading={submitting}
              disabled={!canConfirm || submitting}
              icon={Send}
              onClick={onSubmit}
            >
              Finalizar Solicitação
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
