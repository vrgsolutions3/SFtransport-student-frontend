"use client";

import { useEffect, useState } from "react";
import { BusHeader } from "@/components/bus/BusHeader";
import { BusCard, type BusRoute } from "@/components/bus/BusCard";
import { BusSkeleton } from "@/components/bus/BusSkeleton";
import { BusEmpty } from "@/components/bus/BusEmpty";
import { BusError } from "@/components/bus/BusError";

export default function BusRoutesPage() {
  const [routes, setRoutes] = useState<BusRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/v1/bus", { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => {
        const mapped: BusRoute[] = (Array.isArray(data) ? data : []).map(
          (item: any) => {
            // If already a BusRoute shape, normalize and return
            if (item && item.lineNumber) {
              const normalizedPeriod =
                item.period ??
                item.shift ??
                item.turno ??
                item.periodo ??
                item.schedule?.period ??
                (item.startTime && item.endTime
                  ? `${item.startTime} - ${item.endTime}`
                  : item.start_time && item.end_time
                    ? `${item.start_time} - ${item.end_time}`
                    : undefined);

              return {
                ...(item as BusRoute),
                period: normalizedPeriod,
              } as BusRoute;
            }

            const identifier = item?.identifier ?? item?.lineNumber ?? "";
            const id = item?._id ?? "";

            // derive period from common API shapes
            const period =
              item?.period ??
              item?.shift ??
              item?.turno ??
              item?.periodo ??
              item?.schedule?.period ??
              (item?.startTime && item?.endTime
                ? `${item.startTime} - ${item.endTime}`
                : item?.start_time && item?.end_time
                  ? `${item.start_time} - ${item.end_time}`
                  : undefined);

            let destinations: { name: string; active: boolean }[] = [];

            if (Array.isArray(item?.destinations)) {
              destinations = item.destinations.map((d: any) => ({
                name: d.name ?? d.universityName ?? identifier,
                active: d.active ?? true,
              }));
            } else if (Array.isArray(item?.universitySlots)) {
              destinations = item.universitySlots.map((s: any) => ({
                name:
                  s.universityName ??
                  (typeof s.universityId === "string"
                    ? s.universityId
                    : (s.universityId?.toString?.() ?? identifier)),
                active: true,
              }));
            }

            if (destinations.length === 0)
              destinations.push({ name: identifier, active: true });

            return {
              _id: id,
              lineNumber: identifier,
              destinations,
              active: item?.active ?? true,
              period,
            } as BusRoute;
          },
        );

        setRoutes(mapped);
      })
      .catch((err) => {
        if (err.name !== "AbortError") setError(true);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, []);

  return (
    <div className="min-h-screen bg-surface">
      <BusHeader />
      <main className="pt-24 pb-10 px-5 max-w-lg mx-auto">
        {loading && <BusSkeleton />}
        {error && <BusError />}
        {!loading && !error && routes.length === 0 && <BusEmpty />}
        {!loading && !error && routes.length > 0 && (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-on-surface-variant mb-1">
              {routes.length}{" "}
              {routes.length === 1 ? "rota ativa" : "rotas ativas"}
            </p>
            {routes.map((route) => (
              <BusCard key={route._id} route={route} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
