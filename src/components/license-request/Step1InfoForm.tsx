"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { AutocompleteInput } from "@/components/ui/AutocompleteInput";
import { useInstitutionAutocomplete } from "@/hooks/useInstitutionAutocomplete";
import { ArrowRight, BookOpenText, ChevronDown, Clock3, Droplets, School } from "lucide-react";

export interface Step1Data {
  institution: string;
  degree: string;
  shift: string;
  bloodType: string;
  bus: string;
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

  const {
    institutionOptions,
    courseOptions,
    handleInstitutionChange,
    handleCourseChange,
    institution,
    course,
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

  const handleContinue = () => {
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
    <div className="space-y-5">
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

      {/* Turno - Select estilizado */}
      <div className="space-y-2">
        <label
          htmlFor="shift"
          className="text-xs font-bold uppercase tracking-wider text-on-surface-variant ml-1"
        >
          Turno <span className="text-error">*</span>
        </label>
        <div
          className={`relative group w-full min-w-0 flex items-center bg-surface-container-low border-2 rounded-xl transition-all duration-150 ${
            touched.shift && errors.shift
              ? "border-error"
              : "border-outline hover:border-on-surface-variant focus-within:border-primary focus-within:shadow-[0_0_0_4px_var(--shadow-primary-soft)]"
          }`}
        >
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Clock3
              className={`w-5 h-5 transition-colors duration-150 group-focus-within:text-primary ${
                touched.shift && errors.shift ? "text-error" : "text-on-surface-variant"
              }`}
            />
          </div>

          <select
            id="shift"
            value={data.shift}
            onChange={(e) => {
              updateFormData({ shift: e.target.value });
              markAsTouched("shift");
            }}
            onBlur={() => markAsTouched("shift")}
            aria-required="true"
            aria-invalid={touched.shift && !!errors.shift}
            className="w-full min-w-0 h-14 bg-transparent pl-12 pr-11 text-sm sm:text-base text-on-surface outline-none appearance-none"
          >
            <option value="" disabled>
              Selecione o turno
            </option>
            {SHIFT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
            <ChevronDown className="w-5 h-5 text-on-surface-variant" />
          </div>
        </div>
        {touched.shift && errors.shift && (
          <p className="text-xs text-error mt-1 ml-1" role="alert">
            {errors.shift}
          </p>
        )}
      </div>

      {/* Tipo Sanguíneo - Select estilizado */}
      <div className="space-y-2">
        <label
          htmlFor="bloodType"
          className="text-xs font-bold uppercase tracking-wider text-on-surface-variant ml-1"
        >
          Tipo Sanguíneo <span className="text-error">*</span>
        </label>
        <div
          className={`relative group w-full min-w-0 flex items-center bg-surface-container-low border-2 rounded-xl transition-all duration-150 ${
            touched.bloodType && errors.bloodType
              ? "border-error"
              : "border-outline hover:border-on-surface-variant focus-within:border-primary focus-within:shadow-[0_0_0_4px_var(--shadow-primary-soft)]"
          }`}
        >
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Droplets
              className={`w-5 h-5 transition-colors duration-150 group-focus-within:text-primary ${
                touched.bloodType && errors.bloodType ? "text-error" : "text-on-surface-variant"
              }`}
            />
          </div>

          <select
            id="bloodType"
            value={data.bloodType}
            onChange={(e) => {
              updateFormData({ bloodType: e.target.value });
              markAsTouched("bloodType");
            }}
            onBlur={() => markAsTouched("bloodType")}
            aria-required="true"
            aria-invalid={touched.bloodType && !!errors.bloodType}
            className="w-full min-w-0 h-14 bg-transparent pl-12 pr-11 text-sm sm:text-base text-on-surface outline-none appearance-none"
          >
            <option value="" disabled>
              Selecione o tipo sanguíneo
            </option>
            {BLOOD_TYPE_OPTIONS.map((bt) => (
              <option key={bt} value={bt}>
                {bt}
              </option>
            ))}
          </select>

          <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
            <ChevronDown className="w-5 h-5 text-on-surface-variant" />
          </div>
        </div>
        {touched.bloodType && errors.bloodType && (
          <p className="text-xs text-error mt-1 ml-1" role="alert">
            {errors.bloodType}
          </p>
        )}
      </div>

      <Button
        type="button"
        variant="primary"
        size="lg"
        fullWidth
        onClick={handleContinue}
        icon={ArrowRight}
      >
        Continuar
      </Button>
    </div>
  );
}
