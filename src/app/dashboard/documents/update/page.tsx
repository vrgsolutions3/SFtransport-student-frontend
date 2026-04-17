"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import StepIndicator from "@/components/dashboard/license-request/StepIndicator";
import { type Step3Data } from "@/components/dashboard/license-request/Step3grade";
import { useAuth } from "@/hooks/useAuth";
import { useNSFW } from "@/hooks/useNSFW";
import { useImageProcessor } from "@/hooks/useImageProcessor";
import { useLicenseContext } from "@/contexts/LicenseContext";
import { apiClient } from "@/lib/apiClient";
import {
  buildInitialSelections,
  isPhotoType,
  selectedConfigs,
  STEP_LABELS_TWO,
  STEP_LABELS_THREE,
  type FlowStep,
  type PhotoType,
  type StudentImageListItem,
} from "@/lib/updateDocumentUtils";
import { UpdateDocumentsSkeleton } from "@/components/dashboard/documents/update/UpdateDocumentsSkeleton";
import { UpdateDocumentsPendingState } from "@/components/dashboard/documents/update/UpdateDocumentsPendingState";
import { UpdateDocumentsNoLicenseState } from "@/components/dashboard/documents/update/UpdateDocumentsNoLicenseState";
import { UpdateDocumentsFooter } from "@/components/dashboard/documents/update/UpdateDocumentsFooter";
import { UpdateDocumentsStep1 } from "@/components/dashboard/documents/update/UpdateDocumentsStep1";
import { UpdateDocumentsStep2 } from "@/components/dashboard/documents/update/UpdateDocumentsStep2";

const Step3GradeNoSSR = dynamic(
  () => import("@/components/dashboard/license-request/Step3grade"),
  { ssr: false },
);

export default function UpdateDocumentsRequestPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const nsfw = useNSFW();
  const {
    hasLicense,
    licenseRequest,
    isUnderReview,
    loading: loadingLicense,
  } = useLicenseContext();
  const [checkingInitialDocuments, setCheckingInitialDocuments] =
    useState(true);
  const [hasInitialDocuments, setHasInitialDocuments] = useState(false);

  const [step, setStep] = useState<FlowStep>(1);
  const [selected, setSelected] = useState<Record<PhotoType, boolean>>(
    buildInitialSelections(),
  );
  const [gradeData, setGradeData] = useState<Step3Data>({ selections: [] });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const selectedTypes = useMemo(
    () =>
      Object.entries(selected)
        .filter(([, checked]) => checked)
        .map(([type]) => type)
        .filter(isPhotoType),
    [selected],
  );

  const selectedDocs = useMemo(
    () => selectedConfigs(selectedTypes),
    [selectedTypes],
  );

  const { entries, isProcessing, setFile, removeEntry } = useImageProcessor(
    nsfw.status === "ready" ? nsfw.model : null,
    selectedDocs.length,
  );

  const hasCourseSchedule = selected.CourseSchedule;
  const totalSteps = hasCourseSchedule ? 3 : 2;
  const labels = hasCourseSchedule ? STEP_LABELS_THREE : STEP_LABELS_TWO;
  const hasPendingRequest =
    isUnderReview && licenseRequest?.status === "pending";

  const allSelectedUploaded =
    selectedDocs.length > 0 &&
    entries.length === selectedDocs.length &&
    entries.every((entry) => entry !== null && entry.result?.status === "ok");

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    let cancelled = false;

    if (authLoading || !isAuthenticated) {
      return () => {
        cancelled = true;
      };
    }

    apiClient
      .get<StudentImageListItem[]>("/image/student/me")
      .then((data) => {
        if (cancelled) return;
        const documents = Array.isArray(data) ? data : [];
        if (documents.length === 0) {
          router.replace("/dashboard/request-license");
          return;
        }
        setHasInitialDocuments(true);
      })
      .catch(() => {
        if (!cancelled) router.replace("/dashboard/request-license");
      })
      .finally(() => {
        if (!cancelled) setCheckingInitialDocuments(false);
      });
    return () => {
      cancelled = true;
    };
  }, [authLoading, isAuthenticated, router]);

  const toggleSelection = (type: PhotoType) =>
    setSelected((prev) => ({ ...prev, [type]: !prev[type] }));

  const onContinueStep1 = () => {
    if (selectedTypes.length === 0) {
      setError("Selecione ao menos um documento para continuar.");
      return;
    }
    setError("");
    setStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onContinueStep2 = async () => {
    if (!allSelectedUploaded) {
      setError("Envie todos os documentos selecionados para continuar.");
      return;
    }
    setError("");
    if (hasCourseSchedule) {
      setStep(3);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    await handleSubmit();
  };

  const handleSubmit = async () => {
    if (!allSelectedUploaded) {
      setError("Envie todos os documentos selecionados antes de finalizar.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("changedDocuments", JSON.stringify(selectedTypes));
      selectedDocs.forEach((doc, index) => {
        const entry = entries[index];
        const blob = entry?.result?.processedBlob ?? entry?.file;
        if (!blob) return;
        const fileName =
          blob.type === "application/pdf"
            ? `${doc.photoType}.pdf`
            : `${doc.photoType}.jpg`;
        formData.append(doc.photoType, blob, fileName);
      });
      await apiClient.postForm("/student/me/document-update-request", formData);
      router.push("/dashboard/documents?updated=true");
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e?.message ?? "Erro ao enviar solicitação. Tente novamente.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || !isAuthenticated || loadingLicense || checkingInitialDocuments || !hasInitialDocuments)
    return <UpdateDocumentsSkeleton />;
  if (!loadingLicense && hasPendingRequest)
    return (
      <UpdateDocumentsPendingState
        isInitial={licenseRequest?.type === "initial"}
        onBack={() => router.push("/dashboard/documents")}
      />
    );
  if (!loadingLicense && !hasLicense)
    return (
      <UpdateDocumentsNoLicenseState
        onBack={() => router.push("/dashboard/documents")}
      />
    );

  return (
    <div className="min-h-screen bg-surface">
      <header className="fixed top-0 w-full z-50 bg-surface-container-lowest/80 backdrop-blur-md border-b border-outline-variant/30 flex items-center gap-3 px-4 h-16">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-full hover:bg-surface-container-low transition-colors active:scale-95"
          aria-label="Voltar"
        >
          <ArrowLeft className="text-on-surface" size={20} />
        </button>
        <h1 className="font-headline font-bold text-on-surface text-lg flex-1">
          Alterar Documentos
        </h1>
        <ThemeToggle className="text-on-surface-variant hover:bg-surface-container-low" />
      </header>

      <main className="pt-20 pb-28 px-5 max-w-lg mx-auto">
        <StepIndicator
          currentStep={step}
          totalSteps={totalSteps}
          labels={labels}
        />

        {error && (
          <div className="bg-error-container border border-error-border text-error text-sm rounded-xl px-4 py-3 mb-5 flex items-center gap-2">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {step === 1 && (
          <UpdateDocumentsStep1
            selected={selected}
            onToggle={toggleSelection}
          />
        )}
        {step === 2 && (
          <UpdateDocumentsStep2
            selectedDocs={selectedDocs}
            entries={entries}
            isProcessing={isProcessing}
            submitting={submitting}
            onFileSelect={(index, file, validateRatio) =>
              setFile(index, file, validateRatio ?? false)
            }
            onRemove={removeEntry}
          />
        )}
        {step === 3 && (
          <section className="space-y-4 pb-4">
            <p className="text-sm text-on-surface-variant">
              Refaça sua grade horária antes de finalizar a solicitação.
            </p>
            <Step3GradeNoSSR
              data={gradeData}
              onChange={setGradeData}
              onBack={() => undefined}
              onSubmit={() => undefined}
              submitting={submitting}
            />
          </section>
        )}
      </main>

      <UpdateDocumentsFooter
        step={step}
        submitting={submitting}
        isProcessing={isProcessing}
        allSelectedUploaded={allSelectedUploaded}
        hasCourseSchedule={hasCourseSchedule}
        gradeSelectionsCount={gradeData.selections.length}
        selectedTypesCount={selectedTypes.length}
        onContinueStep1={onContinueStep1}
        onContinueStep2={onContinueStep2}
        onBackToStep1={() => setStep(1)}
        onBackToStep2={() => setStep(2)}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
