"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { BusHeader } from "@/components/bus/BusHeader";
import { BusCard, type BusRoute } from "@/components/bus/BusCard";
import { BusSkeleton } from "@/components/bus/BusSkeleton";
import { BusEmpty } from "@/components/bus/BusEmpty";
import { BusError } from "@/components/bus/BusError";

export default function BusRoutesPage() {
  const [routes, setRoutes] = useState<BusRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [sortBy, setSortBy] = useState<"number" | "university" | "shift">("number");
  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sortOpen) return;
    const handler = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node))
        setSortOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [sortOpen]);

  const shiftRank = (period?: string) => {
    if (!period) return 99;
    const key = period.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
    if (key.includes("manha")) return 0;
    if (key.includes("tarde")) return 1;
    if (key.includes("noite")) return 2;
    return 99;
  };

  const sortedRoutes = useMemo(() => {
    if (sortBy === "university") {
      return [...routes].sort((a, b) => {
        const nameA = a.destinations[0]?.name ?? "";
        const nameB = b.destinations[0]?.name ?? "";
        return nameA.localeCompare(nameB, "pt-BR");
      });
    }
    if (sortBy === "shift") {
      return [...routes].sort(
        (a, b) => shiftRank(a.period) - shiftRank(b.period),
      );
    }
    return [...routes].sort((a, b) => {
      const numA = parseFloat(a.lineNumber) || 0;
      const numB = parseFloat(b.lineNumber) || 0;
      return numA - numB;
    });
  }, [routes, sortBy]);

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
            <div className="flex items-center justify-between mb-1">
              <div ref={sortRef} className="relative">
                <button
                  type="button"
                  onClick={() => setSortOpen((o) => !o)}
                  className="flex items-center gap-2 h-8 pl-3 pr-2 rounded-lg border border-outline-variant/50 bg-surface-container-low text-xs text-on-surface transition-colors hover:bg-surface-container"
                >
                  <span className="text-on-surface-variant">Ordenar por:</span>
                  <span className="font-medium">
                    {sortBy === "number" ? "Número" : sortBy === "university" ? "Faculdade" : "Turno"}
                  </span>
                  <ChevronDown
                    size={13}
                    className={`text-on-surface-variant transition-transform duration-200 ${sortOpen ? "rotate-180" : ""}`}
                  />
                </button>
                {sortOpen && (
                  <div className="absolute right-0 top-full mt-1 z-20 min-w-36 bg-surface-container-low border border-outline-variant/40 rounded-xl shadow-md overflow-hidden">
                    {(
                      [
                        { value: "number", label: "Número" },
                        { value: "university", label: "Faculdade" },
                        { value: "shift", label: "Turno" },
                      ] as const
                    ).map(({ value, label }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => {
                          setSortBy(value);
                          setSortOpen(false);
                        }}
                        className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-on-surface hover:bg-surface-container transition-colors"
                      >
                        {label}
                        {sortBy === value && (
                          <Check size={14} className="text-primary" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <p className="flex items-center gap-1.5 text-sm text-on-surface-variant">
                <span className={`w-2 h-2 rounded-full ${routes.length === 0 ? "bg-error" : "bg-success"}`} />
                {routes.length}{" "}
                {routes.length === 1 ? "rota ativa" : "rotas ativas"}
              </p>
            </div>
            {sortedRoutes.map((route) => (
              <BusCard key={route._id} route={route} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
