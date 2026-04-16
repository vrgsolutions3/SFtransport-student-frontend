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
    fetch("/api/v1/bus")
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => setRoutes(data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
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
