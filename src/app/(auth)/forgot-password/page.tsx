"use client";

import { useState } from "react";
import Link from "next/link";
import { AuthHeader } from "@/components/auth/AuthHeader";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import { AtSign, ArrowRight, CheckCircle, ArrowLeft } from "lucide-react";
import { getFieldErrors, forgotPasswordSchema } from "@/lib/validation/auth";

export default function ForgotPasswordPage() {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState({ email: "", general: "" });

  const validateForm = () => {
    const result = forgotPasswordSchema.safeParse({ email });

    if (result.success) {
      setErrors({ email: "", general: "" });
      return true;
    }

    const fieldErrors = getFieldErrors(result.error);
    setErrors({
      email: fieldErrors.email ?? "",
      general: "",
    });
    return false;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const result = await forgotPassword(email);

      if (result.success) {
        setSubmitted(true);
      } else {
        setErrors((prev) => ({
          ...prev,
          general: result.error ?? "Erro ao solicitar recuperação",
        }));
      }
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <>
        <AuthHeader description="Recuperar sua senha" />
        <main className="flex-1 -mt-12 bg-surface rounded-t-[2.5rem] relative z-20 px-6 pt-8 pb-12 shadow-[0_-12px_40px_var(--shadow-primary-soft)]">
          <div className="max-w-md mx-auto">
            <div className="space-y-6">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-success" strokeWidth={2} />
                </div>
                <div className="space-y-2">
                  <h2 className="text-lg font-bold text-on-surface">Email enviado!</h2>
                  <p className="text-sm text-on-surface-variant">
                    Se o email estiver cadastrado, você receberá um link de recuperação em breve.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3 pt-4">
                <Link href="/login" className="w-full">
                  <Button fullWidth variant="secondary" size="lg" icon={ArrowRight}>
                    Voltar para Login
                  </Button>
                </Link>

                <button
                  onClick={() => {
                    setSubmitted(false);
                    setEmail("");
                    setErrors({ email: "", general: "" });
                  }}
                  className="text-center text-sm text-primary font-medium hover:underline"
                >
                  Tentar outro email
                </button>
              </div>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <AuthHeader description="Recuperar sua senha" />
      <main className="flex-1 -mt-12 bg-surface rounded-t-[2.5rem] relative z-20 px-6 pt-8 pb-12 shadow-[0_-12px_40px_var(--shadow-primary-soft)]">
        <div className="max-w-md mx-auto">
          <div className="space-y-6">
            {errors.general && (
              <div className="bg-error-container border border-error-border text-error text-sm rounded-xl px-4 py-3">
                {errors.general}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant ml-1">
                  Email
                </label>
                <Input
                  type="email"
                  icon={AtSign}
                  placeholder="seu.email@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  error={errors.email}
                  disabled={loading}
                />
              </div>

              <Button
                type="submit"
                variant="secondary"
                size="lg"
                fullWidth
                loading={loading}
                icon={ArrowRight}
              >
                Enviar Link de Recuperação
              </Button>
            </form>

            <div className="text-center pt-4">
              <Link href="/login" className="inline-flex items-center gap-2 text-sm text-primary font-medium hover:underline">
                <ArrowLeft className="w-4 h-4" />
                Voltar para o login
              </Link>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
