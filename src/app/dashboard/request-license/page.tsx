"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { ArrowLeft, ArrowRight, AlertCircle, Send } from "lucide-react";

import { api } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useLicense } from "@/hooks/useLicense";
import StepIndicator from "@/components/license-request/StepIndicator";
import Step1InfoForm, {
  Step1Data,
} from "@/components/license-request/Step1InfoForm";
import Step3Grade, {
  Step3Data,
} from "@/components/license-request/Step3grade";
import ConfirmSubmitModal from "@/components/license-request/ConfirmSubmitModal";

import { LICENSE_DOCUMENTS } from "@/constants/license-documents";
import {
  getWithTTL,
  ONE_DAY_MS,
  removeWithTTL,
  setWithTTL,
} from "@/lib/storageWithTTL";

import type { DocumentEntries } from "@/components/license-request/Step2Documents";

const STORAGE_KEY = "license_request_step1";
const STORAGE_KEY_STEP2 = "license_request_step2";
const STORAGE_KEY_STEP3 = "license_request_step3";

const EMPTY_STEP1: Step1Data = {
  institution: "",
  degree: "",
  shift: "",
  bloodType: "",
};

const EMPTY_STEP3: Step3Data = {
  selections: [],
};

interface PersistedDocumentEntry {
  name: string;
  type: string;
  dataUrl: string;
}

type PersistedStep2 = Record<string, PersistedDocumentEntry | null>;

const Step2Documents = dynamic(
  () => import("@/components/license-request/Step2Documents"),
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
  }
);

function makeEmptyEntries(): DocumentEntries {
  return Object.fromEntries(
    LICENSE_DOCUMENTS.map((d) => [d.photoType, null])
  );
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Falha ao ler arquivo"));
    reader.readAsDataURL(file);
  });
}

async function serializeDocumentEntries(
  entries: DocumentEntries
): Promise<PersistedStep2> {
  const serialized: PersistedStep2 = {};

  for (const doc of LICENSE_DOCUMENTS) {
    const entry = entries[doc.photoType];
    const source = entry?.file ?? null;

    if (!source) {
      serialized[doc.photoType] = null;
      continue;
    }

    const dataUrl = await fileToDataUrl(source);
    serialized[doc.photoType] = {
      name: source.name,
      type: source.type,
      dataUrl,
    };
  }

  return serialized;
}

async function dataUrlToFile(
  dataUrl: string,
  fileName: string,
  type: string,
): Promise<File> {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  return new File([blob], fileName, { type });
}

async function deserializeDocumentEntries(data: PersistedStep2): Promise<DocumentEntries> {
  const hydrated = makeEmptyEntries();

  for (const doc of LICENSE_DOCUMENTS) {
    const persisted = data[doc.photoType];
    if (!persisted) continue;

    const file = await dataUrlToFile(
      persisted.dataUrl,
      persisted.name,
      persisted.type,
    );
    hydrated[doc.photoType] = {
      file,
      previewUrl: file.type.startsWith("image/") ? persisted.dataUrl : "",
      result: null,
    };
  }

  return hydrated;
}

export default function RequestLicensePage() {
  const router = useRouter();
  const { isUnderReview, loading } = useLicense();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [step1, setStep1] = useState<Step1Data>(EMPTY_STEP1);
  const [step3, setStep3] = useState<Step3Data>(EMPTY_STEP3);
  const [documentEntries, setDocumentEntries] =
    useState<DocumentEntries>(makeEmptyEntries());

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    let cancelled = false;

    if (!loading && isUnderReview) {
      router.replace("/dashboard?pending=true");
      return;
    }

    const savedStep1 = getWithTTL<Step1Data>(STORAGE_KEY, ONE_DAY_MS);
    if (savedStep1) setStep1(savedStep1);

    const savedStep3 = getWithTTL<Step3Data>(STORAGE_KEY_STEP3, ONE_DAY_MS);
    if (savedStep3) setStep3(savedStep3);

    const savedStep2 = getWithTTL<PersistedStep2>(STORAGE_KEY_STEP2, ONE_DAY_MS);
    if (savedStep2) {
      void deserializeDocumentEntries(savedStep2).then((entries) => {
        if (!cancelled) {
          setDocumentEntries(entries);
        }
      });
    }

    return () => {
      cancelled = true;
    };
  }, [isUnderReview, loading, router]);

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
        if (normalized.length > 0) {
          formData.append(key, normalized);
        }
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

        const fallbackName = blob.type === "image/jpeg"
          ? `${doc.photoType}.jpg`
          : `${doc.photoType}.pdf`;

        const uploadFileName = blob.type === "image/jpeg"
          ? (entry?.file?.name?.replace(/\.[^.]+$/, "") || doc.photoType) + ".jpg"
          : entry?.file?.name ?? fallbackName;

        formData.append(
          doc.photoType,
          blob,
          uploadFileName
        );
      }

      await api.postForm("/student/me/license-submit", formData);

      removeWithTTL(STORAGE_KEY);
      removeWithTTL(STORAGE_KEY_STEP2);
      removeWithTTL(STORAGE_KEY_STEP3);

      router.push("/dashboard?requested=true");
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e?.message ?? "Erro ao enviar pedido. Tente novamente.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setSubmitting(false);
    }
  };

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

        {error && (
          <div className="bg-error-container border border-error-border text-error text-sm rounded-xl px-4 py-3 mb-5 flex items-center gap-2">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

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

      {step === 1 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 px-6 pb-8 pt-4 flex justify-center bg-linear-to-t from-surface via-surface/90 to-transparent">
          <Button
            type="submit"
            form="license-step1"
            variant="primary"
            size="lg"
            icon={ArrowRight}
            className="w-3/4 max-w-xs"
          >
            Continuar
          </Button>
        </div>
      )}

      {step === 3 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 px-6 pb-8 pt-6 flex items-center gap-3 bg-linear-to-t from-surface via-surface/90 to-transparent">
          <button
            type="button"
            onClick={handleBackFromStep3}
            disabled={submitting}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-on-surface-variant hover:bg-surface-container rounded-lg transition-all disabled:opacity-40"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>
          <Button
            variant="primary"
            size="lg"
            className="flex-1"
            loading={submitting}
            disabled={step3.selections.length === 0 || submitting}
            icon={Send}
            onClick={() => setShowConfirmModal(true)}
          >
            Finalizar
          </Button>
        </div>
      )}

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