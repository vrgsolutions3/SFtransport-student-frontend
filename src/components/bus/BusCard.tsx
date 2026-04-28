import { Bus } from "lucide-react";

interface BusRouteDestination {
  name: string;
  active: boolean;
}

export interface BusRoute {
  _id: string;
  lineNumber: string;
  destinations: BusRouteDestination[];
  active?: boolean;
  period?: string;
}

/**
 * Compact, mobile-first Bus card.
 * - shows line number, destinations (one-line, truncated) and an optional period badge
 * - keeps layout small and touch-friendly for mobile screens
 */
export function BusCard({ route }: { route: BusRoute }) {
  const acronyms = (route.destinations ?? [])
    .map((d) => d.name)
    .filter(Boolean);
  const period = route.period ?? "";

  return (
    <div
      className="w-full max-w-sm mx-auto flex items-center justify-between rounded-xl bg-surface-container-low border border-outline-variant/30 p-3 gap-3"
      style={{ boxShadow: "var(--shadow-card)" }}
      role="group"
      aria-label={`Linha ${route.lineNumber}${period ? ` - ${period}` : ""}`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <Bus className="w-4 h-4 text-primary" />
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-headline font-bold text-on-surface text-base truncate">
              {route.lineNumber}
            </span>
            {route.active === false ? (
              <span className="text-[10px] text-warning/90">Inativa</span>
            ) : null}
          </div>

          {acronyms.length > 0 ? (
            <p className="text-xs text-on-surface-variant truncate mt-1">
              {acronyms.join(", ")}
            </p>
          ) : null}
        </div>
      </div>

      {period ? (
        <div className="flex flex-col items-end ml-2">
          <span className="text-[10px] uppercase font-medium px-2 py-1 rounded-full bg-primary/10 text-primary">
            {period}
          </span>
        </div>
      ) : null}
    </div>
  );
}
