# Context — Student Frontend

O que precisa ser feito neste frontend em função das mudanças recentes do backend.

---

## Pendente

### ~~1. Tratar resposta de `POST /student/me/license-submit`~~ ✅
Após submissão, o backend pode retornar `{ waitlisted: true, filaPosition: N }` quando não há
vagas disponíveis. Atualmente o frontend ignora a resposta e redireciona direto para
`/dashboard?requested=true` independentemente do resultado.

**Comportamento esperado:**
- Se `waitlisted === true` → redirecionar para `/dashboard?waitlisted=true&position=N`
- Se `waitlisted === false` → manter redirecionamento atual para `/dashboard?requested=true`

**Arquivo:** `src/app/dashboard/request-license/page.tsx` linha 200

```ts
// Antes:
await api.postForm("/student/me/license-submit", formData);
router.push("/dashboard?requested=true");

// Depois:
const result = await api.postForm<{ waitlisted?: boolean; filaPosition?: number }>(
  "/student/me/license-submit",
  formData,
);
if (result?.waitlisted) {
  router.push(`/dashboard?waitlisted=true&position=${result.filaPosition ?? 1}`);
} else {
  router.push("/dashboard?requested=true");
}
```

**Verificar também:** se a página `/dashboard` já exibe um estado visual para `?waitlisted=true`.

---

### 2. Testar SSE end-to-end com Redis *(sem código — validação manual)*
O fluxo de tickets SSE (`POST /license/events/token` → `GET /license/events?ticket=`) está
implementado no código, mas precisa ser validado com o backend agora que os tickets são
armazenados no Redis (em vez de Map in-memory).

**Em ambiente multi-instância:** o ticket emitido por uma instância deve ser consumível por outra.

**Arquivo:** `src/hooks/useLicense.ts` linhas 150-177
**BFF proxy:** `src/app/api/license/events/route.ts`

**Ação:** Testar o fluxo completo — aprovar uma licença e verificar se o evento SSE chega
ao dashboard do aluno. Verificar se o ticket expira corretamente após 60s.

---

### 3. Recomendações de performance do dashboard (contexto anterior)
Itens herdados do arquivo de análise Lighthouse anterior:

- [ ] Remover `"use client"` de `src/app/dashboard/page.tsx` — tornar Server Component
- [ ] Obter sessão server-side no layout para evitar fetch `/api/auth/session` no mount
- [ ] Lazy-load componentes pesados com `next/dynamic`
- [ ] Adiar abertura do stream SSE para após render do conteúdo crítico
- [ ] Considerar endpoint `/session/initial` no backend para consolidar round-trips

---

## Já feito (nenhuma ação necessária)

- [x] Autenticação por sessão com cookie httpOnly — `src/app/api/auth/login/route.ts`
- [x] `credentials: "include"` nas chamadas — `src/lib/apiClient.ts`
- [x] Rate limiting em login, register, verify, resend-code, forgot/reset-password
- [x] Tipos suportam `waitlisted` e `filaPosition` — `src/types/license.ts`
- [x] Hook `useLicense` trata estado `waitlisted` e expõe `isWaitlisted`, `filaPosition`
- [x] SSE ticket implementado no hook e no BFF proxy
