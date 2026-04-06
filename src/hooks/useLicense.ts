"use client";

import { useState, useEffect } from "react";
import { API_BASE_URL, apiClient } from "@/lib/apiClient";
import type { License } from "@/types/license";

type StudentImage = {
  photoType: "ProfilePhoto" | "EnrollmentProof" | "CourseSchedule" | "LicenseImage";
};

interface UseLicenseResult {
  license: License | null;
  loading: boolean;
  hasLicense: boolean;
  isUnderReview: boolean;
}

interface UseLicenseOptions {
  enabled?: boolean;
}

type SseTicketResponse = {
  ticket: string;
  expiresInMs: number;
};

export function useLicense(options: UseLicenseOptions = {}): UseLicenseResult {
  const { enabled = true } = options;
  const [license, setLicense] = useState<License | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUnderReview, setIsUnderReview] = useState(false);

  useEffect(() => {
    let cancelled = false;

    if (!enabled) {
      return () => {
        cancelled = true;
      };
    }

    let fallbackIntervalId: number | null = null;
    let eventSource: EventSource | null = null;

    const load = async () => {
      try {
        const myLicense = await apiClient.get<License>("/license/me");
        if (cancelled) return;

        setLicense(myLicense);
        setIsUnderReview(false);
        return;
      } catch {
        if (!cancelled) {
          setLicense(null);
        }
      }

      try {
        const myImages = await apiClient.get<StudentImage[]>("/image/me");
        if (cancelled) return;

        const hasEnrollment = myImages.some((img) => img.photoType === "EnrollmentProof");
        const hasSchedule = myImages.some((img) => img.photoType === "CourseSchedule");
        setIsUnderReview(hasEnrollment && hasSchedule);
      } catch {
        if (!cancelled) setIsUnderReview(false);
      }
    };

    const clearFallbackPolling = () => {
      if (fallbackIntervalId !== null) {
        window.clearInterval(fallbackIntervalId);
        fallbackIntervalId = null;
      }
    };

    const startFallbackPolling = (intervalMs = 60000) => {
      if (fallbackIntervalId !== null) return;

      fallbackIntervalId = window.setInterval(() => {
        if (!cancelled && document.visibilityState === "visible") {
          void load();
        }
      }, intervalMs);
    };

    const connectSse = async () => {
      if (typeof EventSource === "undefined") {
        startFallbackPolling();
        return;
      }

      let ticketData: SseTicketResponse;
      try {
        ticketData = await apiClient.post<SseTicketResponse>("/license/events/token", {});
      } catch {
        startFallbackPolling();
        return;
      }

      const sseUrl = `${API_BASE_URL}/license/events?ticket=${encodeURIComponent(ticketData.ticket)}`;
      eventSource = new EventSource(sseUrl);

      eventSource.onopen = () => {
        clearFallbackPolling();
      };

      eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data) as { type?: string };

          if (payload.type === "license.changed") {
            void load();
          }
        } catch {
          // ignora eventos malformados
        }
      };

      eventSource.onerror = () => {
        // Em caso de erro de conexão/autorização, mantemos polling como fallback.
        startFallbackPolling();
      };
    };

    load().finally(() => {
      if (!cancelled) setLoading(false);
    });

    void connectSse();

    const onFocus = () => {
      if (!cancelled) {
        void load();
      }
    };

    const onVisibility = () => {
      if (!cancelled && document.visibilityState === "visible") {
        void load();
      }
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      clearFallbackPolling();
      eventSource?.close();
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [enabled]);

  const effectiveLicense = enabled ? license : null;
  const effectiveLoading = enabled ? loading : false;
  const effectiveUnderReview = enabled ? isUnderReview : false;

  return {
    license: effectiveLicense,
    loading: effectiveLoading,
    hasLicense: effectiveLicense !== null,
    isUnderReview: effectiveUnderReview,
  };
}