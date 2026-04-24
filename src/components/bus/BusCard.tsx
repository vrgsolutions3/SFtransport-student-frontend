import { Bus, MapPin, Users } from "lucide-react";

interface BusRouteDestination {
  name: string;
  active: boolean;
}

export interface BusRoute {
  _id: string;
  lineNumber: string;
  destinations: BusRouteDestination[];
  active: boolean;
}

export function BusCard({ route }: { route: BusRoute }) {
  const activeDestinations = (route.destinations ?? []).filter((destination) => destination.active);

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
            <span className="text-xs text-on-surface-variant">
              {route.active ? "Rota ativa" : "Rota inativa"}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 bg-surface-container-high rounded-full px-3 py-1">
          <Users className="w-3.5 h-3.5 text-on-surface-variant" />
          <span className="text-xs text-on-surface-variant font-medium">
            {activeDestinations.length} destinos ativos
          </span>
        </div>
      </div>

      {activeDestinations.length > 0 ? (
        <div className="flex flex-col gap-2">
          {activeDestinations.map((destination) => (
            <div
              key={destination.name}
              className="flex items-start gap-2.5 bg-surface-container rounded-xl p-3"
            >
              <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-on-surface leading-tight">
                  {destination.name}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-on-surface-variant italic">
          Nenhum destino ativo vinculado.
        </p>
      )}
    </div>
  );
}
