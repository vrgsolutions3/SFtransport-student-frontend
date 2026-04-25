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
}

export function BusCard({ route }: { route: BusRoute }) {
  const acronyms = (route.destinations ?? []).map((d) => d.name).filter(Boolean);

  return (
    <div
      className="rounded-2xl bg-surface-container-low border border-outline-variant/30 p-5"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <div className="flex items-center justify-between mb-4 gap-3">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Bus className="w-4 h-4 text-primary" />
          </div>
          <div>
            <span className="font-headline font-bold text-on-surface text-base block">
              {route.lineNumber}
            </span>
          </div>
        </div>
      </div>

      {acronyms.length > 0 ? (
        <p className="text-sm text-on-surface-variant">{acronyms.join(', ')}</p>
      ) : null}
    </div>
  );
}
