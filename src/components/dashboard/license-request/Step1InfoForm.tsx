"use client";

import { useState, useRef, useEffect } from "react";
import { AutocompleteInput } from "@/components/ui/AutocompleteInput";
import { useInstitutionAutocomplete } from "@/hooks/useInstitutionAutocomplete";
import { BookOpenText, ChevronDown, Droplets, School } from "lucide-react";

export interface Step1Data {
  institution: string;
  degree: string;
  shift: string;
  bloodType: string;
}

interface Step1InfoFormProps {
  data: Step1Data;
  onChange: (data: Step1Data) => void;
  onContinue: () => void;
}

const SHIFT_OPTIONS = [
  { value: "Manhã", label: "Manhã" },
  { value: "Tarde", label: "Tarde" },
  { value: "Noite", label: "Noite" },
  { value: "Integral", label: "Integral" },
];

const BLOOD_TYPE_OPTIONS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export default function Step1InfoForm({
  data,
  onChange,
  onContinue,
}: Step1InfoFormProps) {
  const [errors, setErrors] = useState<
    Partial<Record<keyof Step1Data, string>>
  >({});
  const [touched, setTouched] = useState<
    Partial<Record<keyof Step1Data, boolean>>
  >({});
  const [bloodTypeOpen, setBloodTypeOpen] = useState(false);
  const bloodTypeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!bloodTypeRef.current?.contains(e.target as Node)) {
        setBloodTypeOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const {
    institutionOptions,
    courseOptions,
    handleInstitutionChange,
    handleCourseChange,
  } = useInstitutionAutocomplete(data.institution, data.degree);

  const updateFormData = (updates: Partial<Step1Data>) => {
    const newData = { ...data, ...updates };
    onChange(newData);

    const fieldName = Object.keys(updates)[0] as keyof Step1Data;
    if (errors[fieldName]) {
      setErrors((prev) => ({ ...prev, [fieldName]: undefined }));
    }
  };

  const onInstitutionChange = (newInstitution: string) => {
    handleInstitutionChange(newInstitution);
    updateFormData({ institution: newInstitution, degree: "" });
  };

  const onCourseChange = (newCourse: string) => {
    handleCourseChange(newCourse);
    updateFormData({ degree: newCourse });
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof Step1Data, string>> = {};

    if (!data.institution || data.institution.trim() === "") {
      newErrors.institution = "Instituição de ensino é obrigatória";
    }

    if (!data.degree || data.degree.trim() === "") {
      newErrors.degree = "Curso é obrigatório";
    }

    if (!data.shift || data.shift === "") {
      newErrors.shift = "Turno é obrigatório";
    }

    if (!data.bloodType || data.bloodType === "") {
      newErrors.bloodType = "Tipo sanguíneo é obrigatório";
    }

    setErrors(newErrors);

    const allTouched: Partial<Record<keyof Step1Data, boolean>> = {
      institution: true,
      degree: true,
      shift: true,
      bloodType: true,
    };
    setTouched(allTouched);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onContinue();
    }
  };

  const markAsTouched = (field: keyof Step1Data) => {
    if (!touched[field]) {
      setTouched((prev) => ({ ...prev, [field]: true }));
    }
  };

  return (
    <form id="license-step1" onSubmit={handleSubmit} className="space-y-5 pb-10">
      <div>
        <AutocompleteInput
          label="Instituição de Ensino"
          icon={School}
          placeholder="Digite o nome da faculdade"
          options={institutionOptions}
          value={data.institution}
          onValueChange={onInstitutionChange}
          onBlur={() => markAsTouched("institution")}
          required
          error={touched.institution ? errors.institution : undefined}
        />
      </div>

      <div>
        <AutocompleteInput
          label="Curso"
          icon={BookOpenText}
          placeholder={
            data.institution
              ? "Digite o nome do curso"
              : "Selecione uma instituição primeiro"
          }
          options={courseOptions}
          value={data.degree}
          onValueChange={onCourseChange}
          disabled={!data.institution}
          
          onBlur={() => markAsTouched("degree")}
          required
          error={touched.degree ? errors.degree : undefined}
        />
      </div>

      {/* Turno - Segmented control */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-on-surface-variant ml-1">
          Turno <span className="text-error">*</span>
        </label>
        <div
          className={`flex h-12 rounded-xl border overflow-hidden transition-all duration-150
            ${touched.shift && errors.shift ? "border-error" : "border-outline-variant"}`}
        >
          {SHIFT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { updateFormData({ shift: opt.value }); markAsTouched("shift"); }}
              className={`flex-1 text-sm font-medium transition-all duration-150
                ${data.shift === opt.value
                  ? "bg-primary text-on-primary"
                  : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high"
                }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {touched.shift && errors.shift && (
          <p className="text-xs text-error mt-1 ml-1" role="alert">
            {errors.shift}
          </p>
        )}
      </div>

      {/* Tipo Sanguíneo - Dropdown customizado */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-on-surface-variant ml-1">
          Tipo Sanguíneo <span className="text-error">*</span>
        </label>
        <div ref={bloodTypeRef} className="relative">
          <button
            type="button"
            onClick={() => { setBloodTypeOpen((prev) => !prev); markAsTouched("bloodType"); }}
            className={`w-full h-12 flex items-center gap-3 px-4 rounded-xl border-2 bg-surface-container-low text-sm font-medium transition-all duration-150
              ${touched.bloodType && errors.bloodType
                ? "border-error"
                : "border-outline hover:border-on-surface-variant"
              }`}
          >
            <Droplets className={`w-5 h-5 shrink-0 ${touched.bloodType && errors.bloodType ? "text-error" : "text-on-surface-variant"}`} />
            <span className={`flex-1 text-left ${data.bloodType ? "text-on-surface" : "text-on-surface-muted"}`}>
              {data.bloodType || "Selecione o tipo sanguíneo"}
            </span>
            <ChevronDown className={`w-4 h-4 shrink-0 text-on-surface-variant transition-transform duration-150 ${bloodTypeOpen ? "rotate-180" : ""}`} />
          </button>

          {bloodTypeOpen && (
            <div className="absolute z-50 w-full mt-1 bg-surface-container-low rounded-xl shadow-lg border border-outline-variant/30 p-2">
              <div className="grid grid-cols-2 gap-1">
                {BLOOD_TYPE_OPTIONS.map((bt) => (
                  <button
                    key={bt}
                    type="button"
                    onClick={() => { updateFormData({ bloodType: bt }); markAsTouched("bloodType"); setBloodTypeOpen(false); }}
                    className={`p-2.5 text-sm text-center rounded-lg transition-colors duration-150
                      ${data.bloodType === bt
                        ? "bg-primary-fixed text-primary font-bold"
                        : "text-on-surface hover:bg-surface-container-high"
                      }`}
                  >
                    {bt}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        {touched.bloodType && errors.bloodType && (
          <p className="text-xs text-error mt-1 ml-1" role="alert">
            {errors.bloodType}
          </p>
        )}
      </div>

    </form>
  );
}
