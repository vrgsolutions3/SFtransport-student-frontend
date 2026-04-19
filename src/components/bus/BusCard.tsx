import { Bus, MapPin, Users } from "lucide-react";

interface University {
  _id: string;
  name: string;
  acronym: string;
  address: string;
}

export interface BusRoute {
  _id: string;
  identifier: string;
  capacity: number;
  universityIds: University[];
}

export function BusCard({ route }: { route: BusRoute }) {
  return (
    <div
      className="rounded-2xl bg-surface-container-low border border-outline-variant/30 p-5"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Bus className="w-4 h-4 text-primary" />
          </div>
          <span className="font-headline font-bold text-on-surface text-base">
            {route.identifier}
          </span>
        </div>
        <div className="flex items-center gap-1.5 bg-surface-container-high rounded-full px-3 py-1">
          <Users className="w-3.5 h-3.5 text-on-surface-variant" />
          <span className="text-xs text-on-surface-variant font-medium">
            {route.capacity} lugares
          </span>
        </div>
      </div>

      {(route.universityIds ?? []).length > 0 ? (
        <div className="flex flex-col gap-2">
          {(route.universityIds ?? []).map((uni) => (
            <div
              key={uni._id}
              className="flex items-start gap-2.5 bg-surface-container rounded-xl p-3"
            >
              <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-on-surface leading-tight">
                  {uni.name}
                  <span className="ml-1.5 text-xs font-normal text-on-surface-variant">
                    ({uni.acronym})
                  </span>
                </p>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  {uni.address}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-on-surface-variant italic">
          Nenhuma instituição vinculada.
        </p>
      )}
    </div>
  );
}
