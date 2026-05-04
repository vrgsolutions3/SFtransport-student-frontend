import { Check, X } from "lucide-react";

const RULES = [
  { label: "Mínimo 8 caracteres", test: (p: string) => p.length >= 8 },
  { label: "Letra minúscula", test: (p: string) => /[a-z]/.test(p) },
  { label: "Letra maiúscula", test: (p: string) => /[A-Z]/.test(p) },
  { label: "Número", test: (p: string) => /\d/.test(p) },
  { label: "Caractere especial", test: (p: string) => /[^A-Za-z\d]/.test(p) },
];

const LEVELS = [
  { label: "Muito fraca", color: "bg-error" },
  { label: "Fraca",       color: "bg-error" },
  { label: "Razoável",    color: "bg-warning" },
  { label: "Boa",         color: "bg-warning" },
  { label: "Forte",       color: "bg-success" },
];

export function PasswordStrengthIndicator({ password }: { password: string }) {
  if (!password) return null;

  const results = RULES.map(({ test }) => test(password));
  const score = results.filter(Boolean).length;
  const level = LEVELS[score - 1] ?? LEVELS[0];
  const pct = (score / RULES.length) * 100;

  return (
    <div className="mt-2 px-1 space-y-2">
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-surface-container-high rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${level.color}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-xs text-on-surface-variant w-20 text-right shrink-0">
          {level.label}
        </span>
      </div>

      <ul className="space-y-1.5">
        {RULES.map(({ label }, i) => {
          const ok = results[i];
          return (
            <li key={label} className="flex items-center gap-2 text-xs">
              <span
                className={`flex items-center justify-center w-4 h-4 rounded-full shrink-0 transition-colors ${
                  ok ? "bg-success/15 text-success" : "bg-error/10 text-error/70"
                }`}
              >
                {ok ? <Check size={10} strokeWidth={3} /> : <X size={10} strokeWidth={3} />}
              </span>
              <span className={ok ? "text-on-surface-variant" : "text-on-surface-variant/60"}>
                {label}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
