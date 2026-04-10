"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/lib/apiClient";
import type { License, LicenseRequest } from "@/types/license";

interface UseLicenseResult {
  license: License | null;
  licenseRequest: LicenseRequest | null;
  loading: boolean;
  hasLicense: boolean;
  isUnderReview: boolean;
  isRejected: boolean;
  rejectionReason: string | null;
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
  const [licenseRequest, setLicenseRequest] = useState<LicenseRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUnderReview, setIsUnderReview] = useState(false);
  const [isRejected, setIsRejected] = useState(false);
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (!enabled) {
      return () => {
        cancelled = true;
      };
    }

    let fallbackIntervalId: number | null = null;
    let streamAbortController: AbortController | null = null;

    const load = async () => {
      try {
        const myLicense = await apiClient.get<License>("/license/me");
        if (cancelled) return;

        setLicense(myLicense);
        setLicenseRequest(null);
        setIsUnderReview(false);
        setIsRejected(false);
        setRejectionReason(null);
        return;
      } catch {
        if (!cancelled) {
          setLicense(null);
        }
      }

      try {
        const request = await apiClient.get<LicenseRequest>("/license-request/me");
        if (cancelled) return;

        if (!request) {
          setLicenseRequest(null);
          setIsUnderReview(false);
          setIsRejected(false);
          setRejectionReason(null);
          return;
        }

        setLicenseRequest(request);

        if (request.status === "pending") {
          setIsUnderReview(true);
          setIsRejected(false);
          setRejectionReason(null);
        } else if (request.status === "rejected") {
          setIsUnderReview(false);
          setIsRejected(true);
          setRejectionReason(request.rejectionReason);
        } else {
          setIsUnderReview(false);
          setIsRejected(false);
          setRejectionReason(null);
        }
      } catch {
        if (!cancelled) {
          setLicenseRequest(null);
          setIsUnderReview(false);
          setIsRejected(false);
          setRejectionReason(null);
        }
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
      let ticketData: SseTicketResponse;
      try {
        ticketData = await apiClient.post<SseTicketResponse>("/license/events/token", {});
      } catch {
        startFallbackPolling();
        return;
      }

      const abortController = new AbortController();
      streamAbortController = abortController;

      try {
        const response = await fetch("/api/license/events", {
          method: "POST",
          headers: {
            "x-sse-ticket": ticketData.ticket,
          },
          credentials: "include",
          cache: "no-store",
          signal: abortController.signal,
        });

        if (!response.ok || !response.body) {
          startFallbackPolling();
          return;
        }

        clearFallbackPolling();

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (!cancelled) {
          const { value, done } = await reader.read();

          if (done) {
            break;
          }

          if (!value) {
            continue;
          }

          buffer += decoder.decode(value, { stream: true });
          const rawEvents = buffer.split("\n\n");
          buffer = rawEvents.pop() ?? "";

          for (const rawEvent of rawEvents) {
            const dataLines = rawEvent
              .split("\n")
              .filter((line) => line.startsWith("data:"))
              .map((line) => line.slice(5).trimStart());

            if (dataLines.length === 0) {
              continue;
            }

            try {
              const payload = JSON.parse(dataLines.join("\n")) as { type?: string };

              if (payload.type === "license.changed") {
                void load();
              }
            } catch {
              // ignora eventos malformados
            }
          }
        }
      } catch {
        // Em caso de erro de conexão/autorização, mantemos polling como fallback.
      } finally {
        if (!cancelled) {
          startFallbackPolling();
        }
      }
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
      streamAbortController?.abort();
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [enabled]);

  const effectiveLicense = enabled ? license : null;
  const effectiveLicenseRequest = enabled ? licenseRequest : null;
  const effectiveLoading = enabled ? loading : false;
  const effectiveUnderReview = enabled ? isUnderReview : false;
  const effectiveRejected = enabled ? isRejected : false;
  const effectiveRejectionReason = enabled ? rejectionReason : null;

  return {
    license: effectiveLicense,
    licenseRequest: effectiveLicenseRequest,
    loading: effectiveLoading,
    hasLicense: effectiveLicense !== null,
    isUnderReview: effectiveUnderReview,
    isRejected: effectiveRejected,
    rejectionReason: effectiveRejectionReason,
  };
}