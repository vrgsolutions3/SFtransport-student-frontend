"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { AlertCircle, ArrowLeft, ArrowRight, CheckSquare, Send, Square } from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Button } from "@/components/ui/Button";
import StepIndicator from "@/components/license-request/StepIndicator";
import DocumentUpload from "@/components/license-request/DocumentUpload";
import { type Step3Data } from "@/components/license-request/Step3grade";
import { LICENSE_DOCUMENTS, type DocumentConfig } from "@/constants/license-documents";
import { useNSFW } from "@/hooks/useNSFW";
import { useImageProcessor } from "@/hooks/useImageProcessor";
import { useLicense } from "@/hooks/useLicense";
import { apiClient } from "@/lib/apiClient";

type FlowStep = 1 | 2 | 3;
type PhotoType = "ProfilePhoto" | "EnrollmentProof" | "CourseSchedule";
type StudentImageListItem = {
  _id: string;
};

const STEP_LABELS_TWO = ["Seleção", "Documentos"];
const STEP_LABELS_THREE = ["Seleção", "Documentos", "Grade"];

const Step3GradeNoSSR = dynamic(() => import("@/components/license-request/Step3grade"), {
  ssr: false,
});

function isPhotoType(value: string): value is PhotoType {
  return value === "ProfilePhoto" || value === "EnrollmentProof" || value === "CourseSchedule";
}

function buildInitialSelections(): Record<PhotoType, boolean> {
  return {
    ProfilePhoto: false,
    EnrollmentProof: false,
    CourseSchedule: false,
  };
}

function selectedConfigs(selectedTypes: PhotoType[]): DocumentConfig[] {
  const selectedSet = new Set(selectedTypes);
  return LICENSE_DOCUMENTS.filter((doc) => selectedSet.has(doc.photoType as PhotoType));
}

export default function UpdateDocumentsRequestPage() {
  const router = useRouter();
  const nsfw = useNSFW();
  const { hasLicense, licenseRequest, isUnderReview, loading: loadingLicense } = useLicense();
  const [checkingInitialDocuments, setCheckingInitialDocuments] = useState(true);
  const [hasInitialDocuments, setHasInitialDocuments] = useState(false);

  const [step, setStep] = useState<FlowStep>(1);
  const [selected, setSelected] = useState<Record<PhotoType, boolean>>(buildInitialSelections());
  const [gradeData, setGradeData] = useState<Step3Data>({ selections: [] });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const selectedTypes = useMemo(
    () => (Object.entries(selected).filter(([, checked]) => checked).map(([type]) => type).filter(isPhotoType)),
    [selected],
  );

  const selectedDocs = useMemo(() => selectedConfigs(selectedTypes), [selectedTypes]);

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
    let cancelled = false;

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
        if (!cancelled) {
          router.replace("/dashboard/request-license");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setCheckingInitialDocuments(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [router]);

  const toggleSelection = (type: PhotoType) => {
    setSelected((prev) => ({
      ...prev,
      [type]: !prev[type],
    }));
  };

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

        const fileName = blob.type === "application/pdf"
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

  if (loadingLicense || checkingInitialDocuments || !hasInitialDocuments) {
    return (
      <div className="min-h-screen bg-surface">
        <header className="fixed top-0 w-full z-50 bg-surface-container-lowest/80 backdrop-blur-md border-b border-outline-variant/30">
          <div className="h-16 px-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-surface-container-low animate-pulse" />
            <div className="h-5 w-36 rounded-md bg-surface-container-low animate-pulse" />
            <div className="ml-auto w-9 h-9 rounded-full bg-surface-container-low animate-pulse" />
          </div>
        </header>

        <main className="animate-pulse pt-20 pb-28 px-5 max-w-lg mx-auto space-y-4">
          <div className="bg-surface-container-low rounded-2xl h-16 border border-outline-variant/30" />
          <div className="bg-surface-container-low rounded-2xl h-8 w-2/3 border border-outline-variant/30" />
          <div className="bg-surface-container-low rounded-2xl h-20 border border-outline-variant/30" />
          <div className="bg-surface-container-low rounded-2xl h-20 border border-outline-variant/30" />
          <div className="bg-surface-container-low rounded-2xl h-20 border border-outline-variant/30" />
        </main>

        <div className="fixed bottom-0 left-0 right-0 z-40 px-6 pb-8 pt-4 bg-linear-to-t from-surface via-surface/90 to-transparent">
          <div className="h-12 w-3/4 max-w-xs mx-auto rounded-xl bg-surface-container-low border border-outline-variant/30 animate-pulse" />
        </div>
      </div>
    );
  }

  if (!loadingLicense && hasPendingRequest) {
    return (
      <div className="min-h-screen bg-surface">
        <header className="fixed top-0 w-full z-50 bg-surface-container-lowest/80 backdrop-blur-md border-b border-outline-variant/30 flex items-center gap-3 px-4 h-16">
          <button
            onClick={() => router.push("/dashboard/documents")}
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

        <main className="pt-24 pb-10 px-5 max-w-lg mx-auto">
          <section className="bg-warning-container border border-warning/30 rounded-2xl p-6 text-center">
            <AlertCircle className="mx-auto text-warning mb-3" size={28} />
            <h2 className="text-on-surface font-semibold mb-2">
              Solicitação em andamento
            </h2>
            <p className="text-sm text-on-surface-variant mb-5">
              {licenseRequest?.type === "initial"
                ? "Você já tem uma solicitação pendente de criação de carteirinha. Aguarde a análise."
                : "Você já possui uma solicitação de alteração de documentos em andamento."}
            </p>
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={() => router.push("/dashboard/documents")}
            >
              Voltar
            </Button>
          </section>
        </main>
      </div>
    );
  }

  if (!loadingLicense && !hasLicense) {
    return (
      <div className="min-h-screen bg-surface">
        <header className="fixed top-0 w-full z-50 bg-surface-container-lowest/80 backdrop-blur-md border-b border-outline-variant/30 flex items-center gap-3 px-4 h-16">
          <button
            onClick={() => router.push("/dashboard/documents")}
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

        <main className="pt-24 pb-10 px-5 max-w-lg mx-auto">
          <section className="bg-warning-container border border-warning/30 rounded-2xl p-6 text-center">
            <AlertCircle className="mx-auto text-warning mb-3" size={28} />
            <h2 className="text-on-surface font-semibold mb-2">
              Reenvio indisponível
            </h2>
            <p className="text-sm text-on-surface-variant mb-5">
              O reenvio de documentos só pode ocorrer após a criação da carteirinha.
            </p>
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={() => router.push("/dashboard/documents")}
            >
              Voltar
            </Button>
          </section>
        </main>
      </div>
    );
  }

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
        <StepIndicator currentStep={step} totalSteps={totalSteps} labels={labels} />

        {error && (
          <div className="bg-error-container border border-error-border text-error text-sm rounded-xl px-4 py-3 mb-5 flex items-center gap-2">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {step === 1 && (
          <section className="space-y-4">
            <p className="text-sm text-on-surface-variant">
              Selecione quais documentos você deseja atualizar.
            </p>

            <div className="space-y-3">
              {LICENSE_DOCUMENTS.map((doc) => {
                const type = doc.photoType as PhotoType;
                const checked = selected[type];

                return (
                  <button
                    key={doc.photoType}
                    type="button"
                    onClick={() => toggleSelection(type)}
                    className={`w-full rounded-xl border px-4 py-3 flex items-center gap-3 text-left transition-all active:scale-[0.99] ${
                      checked
                        ? "border-primary bg-primary/5"
                        : "border-outline-variant/40 bg-surface-container-low"
                    }`}
                  >
                    {checked ? (
                      <CheckSquare className="w-5 h-5 text-primary shrink-0" />
                    ) : (
                      <Square className="w-5 h-5 text-on-surface-variant shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-on-surface">{doc.label}</p>
                      <p className="text-xs text-on-surface-variant">{doc.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {step === 2 && (
          <section className="space-y-4 pb-4">
            <p className="text-sm text-on-surface-variant">
              Envie os arquivos dos documentos selecionados.
            </p>

            {selectedDocs.map((doc, index) => (
              <DocumentUpload
                key={doc.photoType}
                config={doc}
                entry={entries[index] ?? null}
                onFileSelect={(file) => setFile(index, file, doc.validateRatio)}
                onRemove={() => removeEntry(index)}
                disabled={isProcessing || submitting}
              />
            ))}
          </section>
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

      {step === 1 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 px-6 pb-8 pt-4 bg-linear-to-t from-surface via-surface/90 to-transparent flex justify-center">
          <Button
            variant="primary"
            size="lg"
            icon={ArrowRight}
            className="w-3/4 max-w-xs"
            onClick={onContinueStep1}
            disabled={selectedTypes.length === 0}
          >
            Continuar
          </Button>
        </div>
      )}

      {step === 2 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 px-6 pb-8 pt-6 bg-linear-to-t from-surface via-surface/90 to-transparent">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setStep(1)}
              disabled={submitting || isProcessing}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-on-surface-variant hover:bg-surface-container rounded-lg transition-all disabled:opacity-40"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </button>
            <Button
              variant="primary"
              size="lg"
              className="flex-1"
              onClick={onContinueStep2}
              disabled={!allSelectedUploaded || submitting || isProcessing}
              loading={submitting}
              icon={hasCourseSchedule ? ArrowRight : Send}
            >
              {hasCourseSchedule ? "Continuar" : "Enviar solicitação"}
            </Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 px-6 pb-8 pt-6 bg-linear-to-t from-surface via-surface/90 to-transparent">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setStep(2)}
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
              onClick={handleSubmit}
              disabled={submitting || gradeData.selections.length === 0}
              loading={submitting}
              icon={Send}
            >
              Enviar solicitação
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
