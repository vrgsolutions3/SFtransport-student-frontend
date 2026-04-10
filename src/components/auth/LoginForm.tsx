"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { useAuth } from "@/hooks/useAuth";
import { ArrowRight, Lock, AtSign, MessageCircleQuestionMark, Map, } from "lucide-react";
import { getFieldErrors, loginCredentialsSchema } from "@/lib/validation/auth";


export function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({ email: "", password: "", general: "" });

  const validateForm = () => {
    const result = loginCredentialsSchema.safeParse(formData);

    if (!formData.email) {
      newErrors.email = "Email é obrigatório";
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Email inválido";
      isValid = false;
    }

    if (!formData.password) {
      newErrors.password = "Senha é obrigatória";
      isValid = false;
    } else if (formData.password.length < 8) {
      newErrors.password = "Senha deve ter no mínimo 8 caracteres";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
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
        setErrors((prev) => ({ ...prev, general: result.error ?? "Credenciais inválidas" }));
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
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            error={errors.email}
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant ml-1">
            Senha
          </label>
          <Input
            type="password"
            icon={Lock}
            placeholder="••••••••"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            error={errors.password}
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
          Entrar no Sistema
        </Button>
      </form>

      <div className="text-center pt-2">
        <p className="text-on-surface-variant text-sm">
          Ainda não possui acesso?{" "}
          <Link href="/register" className="text-primary font-bold hover:underline">
            Registrar-se
          </Link>
        </p>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4">
        <div className="bg-surface-container-low p-4 rounded-2xl flex flex-col gap-3">
          <MessageCircleQuestionMark className="text-primary text-2xl" />
          <span className="text-xs font-bold leading-tight text-on-surface">Suporte ao Usuário</span>
        </div>
        <div className="bg-primary/5 p-4 rounded-2xl flex flex-col gap-3 border border-primary/10">
          <Map className="text-primary text-2xl" />
          <span className="text-xs font-bold leading-tight text-on-surface">Ver Rotas Ativas</span>
        </div>
      </div>
    </div>
  );
}
