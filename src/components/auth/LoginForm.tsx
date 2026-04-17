"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { useAuth } from "@/hooks/useAuth";
import {
  ArrowRight,
  Lock,
  AtSign,
  MessageCircleQuestionMark,
  Map,
} from "lucide-react";
import { getFieldErrors, loginCredentialsSchema } from "@/lib/validation/auth";

export function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({
    email: "",
    password: "",
    general: "",
  });

  const validateForm = () => {
    const result = loginCredentialsSchema.safeParse(formData);

    if (result.success) {
      setErrors({ email: "", password: "", general: "" });
      return true;
    }

    const fieldErrors = getFieldErrors(result.error);
    setErrors({
      email: fieldErrors.email ?? "",
      password: fieldErrors.password ?? "",
      general: "",
    });
    return false;
  };

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    try {
      const result = await login(formData.email, formData.password);
      if (result.success) {
        router.push("/dashboard");
      } else {
        setErrors((prev) => ({
          ...prev,
          general: result.error ?? "Credenciais inválidas",
        }));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
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
            placeholder="nome@email.com"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            error={errors.email}
          />
        </div>

        <div className="space-y-2">
          <Input
            type="password"
            icon={Lock}
            placeholder="••••••••"
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
            error={errors.password}
          />
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant ml-1">
              Senha
            </label>
            <Link
              href="/forgot-password"
              className="text-xs text-primary font-bold hover:underline"
            >
              Esqueci a senha
            </Link>
          </div>
        </div>

        <Button
          type="submit"
          variant="secondary"
          size="lg"
          fullWidth
          loading={loading}
          icon={ArrowRight}
        >
          Entrar no Sistema
        </Button>
      </form>

      <div className="text-center pt-2">
        <p className="text-on-surface-variant text-sm">
          Ainda não possui acesso?{" "}
          <Link
            href="/register"
            className="text-primary font-bold hover:underline"
          >
            Registrar-se
          </Link>
        </p>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4">
        <div className="bg-surface-container-low p-4 rounded-2xl flex flex-col gap-3">
          <MessageCircleQuestionMark className="text-primary text-2xl" />
          <span className="text-xs font-bold leading-tight text-on-surface">
            Suporte ao Usuário
          </span>
        </div>
        <Link
          href="/bus"
          className="bg-primary/5 p-4 rounded-2xl flex flex-col gap-3 border border-primary/10"
        >
          <Map className="text-primary text-2xl" />
          <span className="text-xs font-bold leading-tight text-on-surface">
            Ver Rotas Ativas
          </span>
        </Link>
      </div>
    </div>
  );
}
