"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AuthHeader } from "@/components/auth/AuthHeader";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import { Lock, ArrowRight, CheckCircle, AlertCircle, ArrowLeft } from "lucide-react";
import { getFieldErrors, resetPasswordFormSchema } from "@/lib/validation/auth";

interface FormState {
  password: string;
  confirmPassword: string;
}

interface ErrorsState {
  password: string;
  confirmPassword: string;
  general: string;
}

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const { resetPassword } = useAuth();

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [expired, setExpired] = useState(false);
  const [formData, setFormData] = useState<FormState>({
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<ErrorsState>({
    password: "",
    confirmPassword: "",
    general: "",
  });

  // Redirect if no token
  useEffect(() => {
    if (!token) {
      router.replace("/forgot-password");
    }
  }, [token, router]);

  const validateForm = () => {
    const result = resetPasswordFormSchema.safeParse(formData);

    if (result.success) {
      setErrors({ password: "", confirmPassword: "", general: "" });
      return true;
    }

    const fieldErrors = getFieldErrors(result.error);
    setErrors({
      password: fieldErrors.password ?? "",
      confirmPassword: fieldErrors.confirmPassword ?? "",
      general: "",
    });
    return false;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || !token) return;

    setLoading(true);
    try {
      const result = await resetPassword(token, formData.password);

      if (result.success) {
        setSuccess(true);
        // Redirect after 3 seconds
        setTimeout(() => {
          router.push("/login");
        }, 3000);
      } else {
        const messageLooksLikeTokenIssue = /token|expirad|expirou|inválid|invalido/i.test(
          result.error ?? "",
        );

        if (result.expired || messageLooksLikeTokenIssue) {
          setExpired(true);
        } else {
          setErrors((prev) => ({
            ...prev,
            general: result.error ?? "Erro ao redefinir senha",
          }));
        }
      }
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return null; // Redirect happening via useEffect
  }

  if (success) {
    return (
      <>
        <AuthHeader description="Senha redefinida com sucesso!" />
        <main className="flex-1 -mt-12 bg-surface rounded-t-[2.5rem] relative z-20 px-6 pt-8 pb-12 shadow-[0_-12px_40px_var(--shadow-primary-soft)]">
          <div className="max-w-md mx-auto">
            <div className="space-y-6">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-success" strokeWidth={2} />
                </div>
                <div className="space-y-2">
                  <h2 className="text-lg font-bold text-on-surface">Sucesso!</h2>
                  <p className="text-sm text-on-surface-variant">
                    Sua senha foi redefinida com sucesso. Você será redirecionado para o login em breve.
                  </p>
                </div>
              </div>

              <Link href="/login" className="w-full">
                <Button fullWidth variant="secondary" size="lg" icon={ArrowRight}>
                  Ir para Login
                </Button>
              </Link>
            </div>
          </div>
        </main>
      </>
    );
  }

  if (expired) {
    return (
      <>
        <AuthHeader description="Link de recuperação expirado" />
        <main className="flex-1 -mt-12 bg-surface rounded-t-[2.5rem] relative z-20 px-6 pt-8 pb-12 shadow-[0_-12px_40px_var(--shadow-primary-soft)]">
          <div className="max-w-md mx-auto">
            <div className="space-y-6">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="w-16 h-16 bg-error/20 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-error" strokeWidth={2} />
                </div>
                <div className="space-y-2">
                  <h2 className="text-lg font-bold text-on-surface">Link expirado</h2>
                  <p className="text-sm text-on-surface-variant">
                    O link de recuperação já não é válido. Solicite um novo link.
                  </p>
                </div>
              </div>

              <Link href="/forgot-password" className="w-full">
                <Button fullWidth variant="secondary" size="lg" icon={ArrowRight}>
                  Solicitar Novo Link
                </Button>
              </Link>

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

  return (
    <>
      <AuthHeader description="Defina uma nova senha" />
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
                  Nova Senha
                </label>
                <Input
                  type="password"
                  icon={Lock}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  error={errors.password}
                  disabled={loading}
                />
                <p className="text-xs text-on-surface-variant ml-1">
                  Mínimo 8 caracteres, com maiúscula, minúscula e número
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant ml-1">
                  Confirmar Senha
                </label>
                <Input
                  type="password"
                  icon={Lock}
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  error={errors.confirmPassword}
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
                Redefinir Senha
              </Button>
            </form>

            <div className="text-center pt-4">
              <Link href="/forgot-password" className="inline-flex items-center gap-2 text-sm text-primary font-medium hover:underline">
                <ArrowLeft className="w-4 h-4" />
                Solicitar novo link
              </Link>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordContent />
    </Suspense>
  );
}
