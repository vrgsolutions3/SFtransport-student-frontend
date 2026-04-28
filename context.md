# Recomendações de performance — Página Dashboard

Resumo das recomendações para reduzir LCP e melhorar performance da página `dashboard`.

1. Evitar tornar toda a página client-side
   - Remover `"use client"` de `src/app/dashboard/page.tsx` quando possível; tornar `DashboardPage` um Server Component para entregar HTML inicial já com conteúdo crítico.
   - Mover apenas partes interativas para client components (ex.: `PushNotificationsCard`, botões, toggles) usando imports dinâmicos.

2. Realizar autenticação/session server-side
   - Obter sessão no servidor (ex.: em layout/server component) e passar `user` como prop aos componentes client, evitando fetchs `/api/auth/session` no mount do cliente.

3. Adiar / lazy-load fetches não-críticos
   - Renderizar conteúdos críticos (greeting, header, nav) via SSR; carregar informações adicionais (detalhes da licença, SSE) assíncronamente com placeholders leves.
   - Usar `next/dynamic` para importar componentes pesados só no cliente.

4. Reduzir número de requests no carregamento inicial
   - Consolidar endpoints no backend (ex.: endpoint único `/session/initial` que retorne sessão + license + enrollmentPeriod) para reduzir latência de round-trips.

5. Melhorar timeout/caching/HTTP
   - Ativar cache adequado e compressão (gzip/brotli) no backend/proxy; reduzir payloads JSON quando possível.

6. Tornar SSE opcional / iniciar após render
   - Não abrir stream SSE imediatamente no mount; iniciar após o conteúdo crítico carregado ou usar polling inicial + SSE apenas se usuário interagir com o cartão.

7. Medir backend
   - Medir tempos de resposta dos endpoints críticos (`/api/auth/session`, `/api/v1/license/me`, `/api/v1/enrollment-period/active`) para confirmar se a causa é latência no servidor.

8. Outras micro-otimizações
   - Evitar `dynamic = 'force-dynamic'` se não for necessário.
   - Usar `next/font` para reduzir bloqueio por fontes e lazy-importar bibliotecas pesadas no cliente.

---
Arquivo gerado automaticamente a partir da análise Lighthouse do dashboard.
