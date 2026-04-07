Memoria de contexto - Fase 3 (frontend student, BFF session-first)
Data: 2026-04-06

Objetivo da fase
Migrar o frontend student para consumir autenticacao via BFF com sessao opaca (cookie sid httpOnly), removendo dependencias de JWT no browser.

Decisoes aplicadas
- Browser nao escreve nem le token de acesso.
- Cookie sid e escrito/limpo apenas em rotas server-side do Next.
- Frontend cliente conversa com /api/auth/* para auth e /api/v1/* para dominio.
- BFF sempre injeta x-service-secret e x-session-id nas chamadas ao backend.
- /api/v1/auth/* bloqueado para forcar uso de /api/auth/*.

Implementacoes realizadas
1) Camada server-side de auth (BFF)
- Criado utilitario de auth server-side:
  - src/lib/server/bff-auth.ts
- Criadas rotas:
  - src/app/api/auth/login/route.ts
  - src/app/api/auth/verify/route.ts
  - src/app/api/auth/register/route.ts
  - src/app/api/auth/resend-code/route.ts
  - src/app/api/auth/logout/route.ts
  - src/app/api/auth/session/route.ts

2) Proxy BFF para dominio
- Criado:
  - src/app/api/v1/[...path]/route.ts
- Comportamento:
  - encaminha para backend API
  - injeta x-service-secret
  - injeta x-session-id quando houver sid
  - preserva metodo/body/headers essenciais
  - bloqueia auth via /api/v1/auth/*

3) Auth client-side migrada para sessao
- Reescrito:
  - src/contexts/AuthContext.tsx
  - src/lib/apiClient.ts
  - src/types/auth.ts
- Mudancas:
  - removida fila anti-401 + refresh
  - removido bearer token em memoria
  - bootstrap por GET /api/auth/session
  - login/verify/set state via /api/auth/*
  - logout idempotente via /api/auth/logout

4) Protecao de rotas frontend
- Atualizado:
  - src/proxy.ts
- Mudanca principal:
  - criterio de sessao agora e cookie sid (nao access_token)

5) Consumo de licenca alinhado com sessao
- Atualizado:
  - src/hooks/useLicense.ts
  - src/app/dashboard/page.tsx
  - src/app/dashboard/card/page.tsx
  - src/components/dashboard/LicenseActionCard.tsx
  - src/components/dashboard/LicenseStatusCard.tsx
- Mudancas:
  - carregamento condicionado a autenticacao bootstrapada
  - polling + SSE ticket flow para atualizacao de status

6) Configuracao e ambiente
- Atualizado:
  - .env.example
  - next.config.ts
  - src/app/layout.tsx
  - src/lib/api.ts
- Novas chaves:
  - API_PROXY_TARGET
  - BFF_SERVICE_SECRET
  - SESSION_TTL_DAYS

Validacao executada
- Build de producao do frontend executado com sucesso (exit code 0).
- Diagnosticos dos principais arquivos alterados sem erros de TypeScript.

Riscos e pontos de atencao
- Necessario garantir BFF_SERVICE_SECRET configurado no ambiente do frontend.
- Necessario garantir SERVICE_SECRET identico entre frontend (server-side) e backend.
- Validar manualmente fluxo completo no browser com backend ativo.

Checklist parcial da fase
- [x] BFF routes de auth criadas
- [x] Proxy server-side /api/v1 criado
- [x] AuthContext migrado para sessao
- [x] Middleware/proxy migrado para sid
- [x] Build frontend ok
- [ ] Validacao funcional ponta a ponta (register/verify/login/dashboard/logout)
- [ ] Documentacao final de contrato frontend fase 3
