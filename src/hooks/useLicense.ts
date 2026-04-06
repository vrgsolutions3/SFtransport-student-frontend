"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/lib/apiClient";
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

export function useLicense(): UseLicenseResult {
  const [license, setLicense] = useState<License | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUnderReview, setIsUnderReview] = useState(false);

  useEffect(() => {
    let cancelled = false;

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

    load().finally(() => {
      if (!cancelled) setLoading(false);
    });

    const onFocus = () => {
      if (!cancelled) {
        load();
      }
    };

    const onVisibility = () => {
      if (!cancelled && document.visibilityState === "visible") {
        load();
      }
    };

    // Revalida periodicamente para refletir aprovações feitas pelo funcionário sem F5.
    const intervalId = window.setInterval(() => {
      if (!cancelled && document.visibilityState === "visible") {
        load();
      }
    }, 15000);

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return { license, loading, hasLicense: license !== null, isUnderReview };
}