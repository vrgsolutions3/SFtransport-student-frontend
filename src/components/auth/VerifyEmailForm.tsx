"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import { BadgeCheck, Pin } from "lucide-react";
import { useState } from "react";

export function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const { verifyEmail } = useAuth();

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    if (!code || code.length !== 6) {
      setError("Digite o código de 6 dígitos");
      return;
    }
    setLoading(true);
    try {
      const result = await verifyEmail(email, code);
      if (result.success) {
        router.push("/dashboard");
      } else {
        setError(result.error ?? "Código inválido");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="font-headline text-2xl font-bold text-on-surface">
          Verifique seu e-mail
        </h2>
        <p className="text-on-surface-variant text-sm">
          Enviamos um código de 6 dígitos para{" "}
          <span className="font-semibold text-on-surface">{email}</span>
        </p>
      </div>

      {error && (
        <div className="bg-error-container border border-error-border text-error text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          label="Código de verificação"
          type="text"
          icon={Pin}
          placeholder="000000"
          value={code}
          onChange={(e) => {
            const val = e.target.value.replace(/\D/g, "").slice(0, 6);
            setCode(val);
          }}
          error=""
        />

        <Button
          type="submit"
          variant="secondary"
          size="lg"
          fullWidth
          loading={loading}
          icon={BadgeCheck}
        >
          Verificar e-mail
        </Button>
      </form>
    </div>
  );
}