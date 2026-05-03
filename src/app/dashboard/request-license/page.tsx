"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useEnrollmentPeriodContext } from "@/contexts/EnrollmentPeriodContext";
import { useLicenseContext } from "@/contexts/LicenseContext";
import StepIndicator from "@/components/dashboard/license-request/StepIndicator";
import Step1InfoForm, {
  Step1Data,
} from "@/components/dashboard/license-request/Step1InfoForm";
import Step3Grade, {
  Step3Data,
} from "@/components/dashboard/license-request/Step3grade";
import ConfirmSubmitModal from "@/components/dashboard/license-request/ConfirmSubmitModal";
import RequestLicensePageSkeleton from "@/components/dashboard/license-request/RequestLicenseSkeleton";
import { LicenseStepFooter } from "@/components/dashboard/license-request/LicenseStepFooter";
import { LicenseErrorBanner } from "@/components/dashboard/license-request/LicenseErrorBanner";
import { LICENSE_DOCUMENTS } from "@/constants/license-documents";
import {
  deserializeDocumentEntries,
  makeEmptyEntries,
  serializeDocumentEntries,
} from "@/lib/documentEntries";
import {
  getWithTTL,
  ONE_DAY_MS,
  removeWithTTL,
  setWithTTL,
} from "@/lib/storageWithTTL";
import type { DocumentEntries } from "@/components/dashboard/license-request/Step2Documents";
import type { PersistedStep2 } from "@/lib/documentEntries";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { ArrowLeft, Lock } from "lucide-react";

const STORAGE_KEY = "license_request_step1";
const STORAGE_KEY_STEP2 = "license_request_step2";
const STORAGE_KEY_STEP3 = "license_request_step3";

const EMPTY_STEP1: Step1Data = {
  institution: "",
  degree: "",
  shift: "",
  bloodType: "",
  universityId: "",
};
const EMPTY_STEP3: Step3Data = { selections: [] };

const Step2Documents = dynamic(
  () => import("@/components/dashboard/license-request/Step2Documents"),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-4 animate-pulse">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="h-20 rounded-xl bg-surface-container-low border border-outline-variant/30"
          />
        ))}
      </div>
    ),
  },
);


export default function RequestLicensePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { isUnderReview, isWaitlisted, loading, licenseRequest, refresh } = useLicenseContext();
  const { loading: periodLoading, hasOpenPeriod } = useEnrollmentPeriodContext();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [step1, setStep1] = useState<Step1Data>(EMPTY_STEP1);
  const [step3, setStep3] = useState<Step3Data>(EMPTY_STEP3);
  const [documentEntries, setDocumentEntries] = useState<DocumentEntries>(makeEmptyEntries());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  const interactionBlocked = loading || periodLoading || isUnderReview || isWaitlisted;

  useEffect(() => {
    let cancelled = false;

    if (
      !loading &&
      licenseRequest?.type === "initial" &&
      (isUnderReview || isWaitlisted)
    ) {
      router.replace("/dashboard");
      return;
    }

    const savedStep1 = getWithTTL<Step1Data>(STORAGE_KEY, ONE_DAY_MS);
    if (savedStep1) setStep1({ ...EMPTY_STEP1, ...savedStep1 });

    const savedStep3 = getWithTTL<Step3Data>(STORAGE_KEY_STEP3, ONE_DAY_MS);
    if (savedStep3) setStep3(savedStep3);

    const savedStep2 = getWithTTL<PersistedStep2>(STORAGE_KEY_STEP2, ONE_DAY_MS);
    if (savedStep2) {
      void deserializeDocumentEntries(savedStep2).then((entries) => {
        if (!cancelled) setDocumentEntries(entries);
      });
    }

    return () => {
      cancelled = true;
    };
  }, [isUnderReview, isWaitlisted, loading, licenseRequest?.type, router]);

  const handleContinueFromStep1 = () => {
    setWithTTL(STORAGE_KEY, step1);
    setStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const handleBackFromStep2 = () => {
    setStep(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const handleContinueFromStep2 = async () => {
    setWithTTL(STORAGE_KEY, step1);
    const serialized = await serializeDocumentEntries(documentEntries);
    setWithTTL(STORAGE_KEY_STEP2, serialized);
    setStep(3);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const handleBackFromStep3 = () => {
    setStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleFinalSubmit = async () => {
    setSubmitting(true);
    setError("");
    try {
      setWithTTL(STORAGE_KEY_STEP3, step3);
      const formData = new FormData();
      const appendIfFilled = (key: string, value: string) => {
        const normalized = value.trim();
        if (normalized.length > 0) formData.append(key, normalized);
      };
      appendIfFilled("institution", step1.institution);
      appendIfFilled("degree", step1.degree);
      appendIfFilled("shift", step1.shift);
      appendIfFilled("bloodType", step1.bloodType);
      formData.append("schedule", JSON.stringify(step3.selections));
      for (const doc of LICENSE_DOCUMENTS) {
        const entry = documentEntries[doc.photoType];
        const blob = entry?.result?.processedBlob ?? entry?.file;
        if (!blob) continue;
        // Client-side guard: documents that don't accept PDF must be images (JPEG/JPG/PNG)
        if (!doc.acceptPdf) {
          if (!blob.type || !["image/jpeg", "image/jpg", "image/png"].includes(blob.type)) {
            const label = doc.label || "Arquivo";
            setError(`${label} inválido: envie um arquivo JPEG, JPG ou PNG.`);
            setSubmitting(false);
            window.scrollTo({ top: 0, behavior: "smooth" });
            return;
          }
        }
        const fallbackName =
          blob.type === "image/jpeg" || blob.type === "image/jpg"
            ? `${doc.photoType}.jpg`
            : blob.type === "image/png"
            ? `${doc.photoType}.png`
            : `${doc.photoType}.bin`;
        const uploadFileName = (() => {
          const original = entry?.file?.name;
          if (!original) return fallbackName;
          const base = original.replace(/\.[^.]+$/, "");
          if (blob.type === "image/jpeg" || blob.type === "image/jpg") return `${base}.jpg`;
          if (blob.type === "image/png") return `${base}.png`;
          return original;
        })();
        formData.append(doc.photoType, blob, uploadFileName);
      }
      // If an university was selected via autocomplete, ensure the student's profile
      // is associated to the university (backend expects `student.universityId`).
      if (step1.universityId) {
        try {
          await api.patch('/student/me', { universityId: step1.universityId });
        } catch (err: unknown) {
          const e = err as { message?: string };
          setError(e?.message ?? 'Erro ao associar instituição. Tente novamente.');
          window.scrollTo({ top: 0, behavior: 'smooth' });
          setSubmitting(false);
          return;
        }
      }

      const result = await api.postForm<{ waitlisted?: boolean; filaPosition?: number }>(
        "/student/me/license-submit",
        formData,
      );
      removeWithTTL(STORAGE_KEY);
      removeWithTTL(STORAGE_KEY_STEP2);
      removeWithTTL(STORAGE_KEY_STEP3);
      refresh();
      if (result?.waitlisted) {
        router.push(`/dashboard?waitlisted=true&position=${result.filaPosition ?? 1}`);
      } else {
        router.push("/dashboard?requested=true");
      }
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e?.message ?? "Erro ao enviar pedido. Tente novamente.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || !isAuthenticated || loading || periodLoading) {
    return <RequestLicensePageSkeleton />;
  }

  if (!hasOpenPeriod) {
    return (
      <div className="min-h-screen bg-surface">
        <header className="fixed top-0 w-full z-50 bg-surface-container-lowest/80 backdrop-blur-md shadow-sm flex items-center gap-3 px-4 h-16">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-full hover:bg-surface-container-low transition-colors active:scale-95"
          >
            <ArrowLeft size={20} className="text-on-surface" />
          </button>
          <h1 className="font-headline font-bold text-on-surface text-lg flex-1">
            Solicitar Carteirinha
          </h1>
          <ThemeToggle className="text-on-surface-variant hover:bg-surface-container-low" />
        </header>

        <main className="pt-24 pb-10 px-5 max-w-lg mx-auto">
          <section className="rounded-2xl border border-outline-variant/30 bg-surface-container-low p-6 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-warning-container">
              <Lock className="text-warning w-7 h-7" />
            </div>
            <h2 className="font-headline text-xl font-bold text-on-surface mb-2">
              Inscrições encerradas
            </h2>
            <p className="text-sm text-on-surface-variant mb-6">
              Aguarde a abertura de um novo período para enviar sua solicitação.
            </p>
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="w-full h-12 rounded-xl bg-primary text-white font-semibold text-sm transition-all active:scale-95"
            >
              Voltar ao dashboard
            </button>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      <header className="fixed top-0 w-full z-50 bg-surface-container-lowest/80 backdrop-blur-md shadow-sm flex items-center gap-3 px-4 h-16">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-full hover:bg-surface-container-low transition-colors active:scale-95"
        >
          <ArrowLeft size={20} className="text-on-surface" />
        </button>
        <h1 className="font-headline font-bold text-on-surface text-lg flex-1">
          Solicitar Carteirinha
        </h1>
        <ThemeToggle className="text-on-surface-variant hover:bg-surface-container-low" />
      </header>

      <main className="pt-20 pb-28 px-5 max-w-lg mx-auto">
        <StepIndicator currentStep={step} />
        <LicenseErrorBanner error={error} />
        {step === 1 && (
          <Step1InfoForm
            data={step1}
            onChange={setStep1}
            onContinue={handleContinueFromStep1}
          />
        )}
        {step === 2 && (
          <Step2Documents
            entries={documentEntries}
            onChange={setDocumentEntries}
            onBack={handleBackFromStep2}
            onContinue={handleContinueFromStep2}
            continueDisabled={interactionBlocked}
          />
        )}
        {step === 3 && (
          <Step3Grade
            data={step3}
            onChange={setStep3}
            onBack={handleBackFromStep3}
            onSubmit={handleFinalSubmit}
            submitting={submitting}
          />
        )}
      </main>

      <LicenseStepFooter
        step={step}
        submitting={submitting}
        interactionBlocked={interactionBlocked}
        selectionsCount={step3.selections.length}
        onBackFromStep3={handleBackFromStep3}
        onOpenConfirmModal={() => setShowConfirmModal(true)}
      />

      <ConfirmSubmitModal
        open={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleFinalSubmit}
        submitting={submitting}
        institution={step1.institution}
        degree={step1.degree}
        shift={step1.shift}
        totalPeriods={step3.selections.length}
      />
    </div>
  );
}
