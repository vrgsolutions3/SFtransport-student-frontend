"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { useAuth } from "@/hooks/useAuth";
import { Mail, Phone, UserRound, Lock, Send, CreditCard } from "lucide-react";

function formatPhone(digits: string): string {
  if (digits.length === 0) return "";
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10)
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function formatCpf(digits: string): string {
  if (digits.length === 0) return "";
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9)
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

function isValidCpf(cpf: string): boolean {
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  const calc = (digits: string, weights: number[]) => {
    const sum = digits.split("").reduce((acc, d, i) => acc + parseInt(d) * weights[i], 0);
    const rem = sum % 11;
    return rem < 2 ? 0 : 11 - rem;
  };
  const d1 = calc(cpf.slice(0, 9), [10, 9, 8, 7, 6, 5, 4, 3, 2]);
  if (d1 !== parseInt(cpf[9])) return false;
  const d2 = calc(cpf.slice(0, 10), [11, 10, 9, 8, 7, 6, 5, 4, 3, 2]);
  return d2 === parseInt(cpf[10]);
}

export function RegisterForm() {
  const router = useRouter();
  const { register } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    telephone: "",
    cpf: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 11);
    setFormData({ ...formData, telephone: digits });
  };

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 11);
    setFormData({ ...formData, cpf: digits });
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    if (!formData.name) {
      newErrors.name = "Nome é obrigatório";
      isValid = false;
    }

    if (!formData.email) {
      newErrors.email = "Email é obrigatório";
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Email inválido";
      isValid = false;
    }

    if (!formData.telephone) {
      newErrors.telephone = "Telefone é obrigatório";
      isValid = false;
    } else if (formData.telephone.length < 10) {
      newErrors.telephone = "Telefone inválido — mínimo 10 dígitos com DDD";
      isValid = false;
    }

    if (!formData.cpf) {
      newErrors.cpf = "CPF é obrigatório";
      isValid = false;
    } else if (!isValidCpf(formData.cpf)) {
      newErrors.cpf = "CPF inválido";
      isValid = false;
    }

    if (!formData.password) {
      newErrors.password = "Senha é obrigatória";
      isValid = false;
    } else if (formData.password.length < 8) {
      newErrors.password = "Senha deve ter no mínimo 8 caracteres";
      isValid = false;
    } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = "Senha deve ter maiúscula, minúscula e número";
      isValid = false;
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "As senhas não coincidem";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    try {
      const result = await register({
        name: formData.name,
        email: formData.email,
        telephone: formData.telephone,
        cpf: formData.cpf,
        password: formData.password,
      });

      if (result.success) {
        router.push(`/verify-email?email=${encodeURIComponent(formData.email)}`);
      } else {
        setErrors((prev) => ({ ...prev, general: result.error ?? "Erro ao criar conta" }));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="mb-6">
        <h3 className="font-headline text-xl md:text-2xl font-bold text-on-surface mb-2">
          Criar nova conta
        </h3>
        <p className="text-on-surface-variant text-sm">
          Preencha os dados abaixo para se cadastrar
        </p>
      </div>

      {errors.general && (
        <div className="bg-error-container border border-error-border text-error text-sm rounded-xl px-4 py-3 mb-4">
          {errors.general}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nome Completo"
          type="text"
          icon={UserRound}
          placeholder="Seu nome completo"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          error={errors.name}
          maxLength={100}
        />

        <Input
          label="Email"
          type="email"
          icon={Mail}
          placeholder="nome@email.com"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          error={errors.email}
          maxLength={254}
        />

        <Input
          label="Telefone"
          type="tel"
          icon={Phone}
          placeholder="(22) 99999-9999"
          value={formatPhone(formData.telephone)}
          onChange={handlePhoneChange}
          error={errors.telephone}
        />

        <Input
          label="CPF"
          type="text"
          icon={CreditCard}
          placeholder="000.000.000-00"
          value={formatCpf(formData.cpf)}
          onChange={handleCpfChange}
          error={errors.cpf}
          inputMode="numeric"
        />

        <Input
          label="Senha"
          type="password"
          icon={Lock}
          placeholder="Mín. 8 caracteres, maiúscula e número"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          error={errors.password}
          maxLength={64}
        />

        <Input
          label="Confirmar Senha"
          type="password"
          icon={Lock}
          placeholder="Digite a senha novamente"
          value={formData.confirmPassword}
          onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
          error={errors.confirmPassword}
          maxLength={64}
        />

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          loading={loading}
          icon={Send}
          className="mt-4"
        >
          Criar Conta
        </Button>
      </form>

      <div className="mt-8 pt-6 border-t border-surface-container-high text-center">
        <p className="text-on-surface-variant text-sm">
          Já possui uma conta?
          <Link href="/login" className="text-primary font-bold hover:underline ml-1">
            Fazer login
          </Link>
        </p>
      </div>
    </>
  );
}
