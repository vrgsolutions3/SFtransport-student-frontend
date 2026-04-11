"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/apiClient";
import { isApiError } from "@/types/auth";
import type { EnrollmentPeriod } from "@/types/enrollmentPeriod";

interface UseEnrollmentPeriodOptions {
  enabled?: boolean;
}

interface UseEnrollmentPeriodResult {
  period: EnrollmentPeriod | null;
  loading: boolean;
  hasOpenPeriod: boolean;
  semVagas: boolean;
}

export function useEnrollmentPeriod(
  options: UseEnrollmentPeriodOptions = {},
): UseEnrollmentPeriodResult {
  const { enabled = true } = options;
  const [period, setPeriod] = useState<EnrollmentPeriod | null>(null);
  const [loading, setLoading] = useState(enabled);

  useEffect(() => {
    let cancelled = false;

    if (!enabled) {
      setLoading(false);
      setPeriod(null);
      return () => {
        cancelled = true;
      };
    }

    const load = async () => {
      setLoading(true);

      try {
        const active = await apiClient.get<EnrollmentPeriod>("/enrollment-period/active");

        if (!cancelled) {
          setPeriod(active);
        }
      } catch (err: unknown) {
        if (cancelled) return;

        if (isApiError(err) && err.status === 404) {
          setPeriod(null);
          return;
        }

        setPeriod(null);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  const now = Date.now();
  const hasOpenPeriod =
    period !== null &&
    period.active === true &&
    new Date(period.startDate).getTime() <= now &&
    new Date(period.endDate).getTime() >= now;

  const semVagas =
    period !== null && period.filledSlots >= period.totalSlots;

  return {
    period,
    loading: enabled ? loading : false,
    hasOpenPeriod,
    semVagas,
  };
}
