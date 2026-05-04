# Context: QR Code na Carteirinha + Remover Download

## Objetivo

Adicionar uma 3ª face deslizável à carteirinha do aluno contendo o QR Code de verificação, e remover o botão de download da carteirinha.

A carteirinha passará de 2 slides (Frente / Verso) para 3 slides:
1. **Frente** — imagem atual (lado frente da carteirinha)
2. **Verso** — imagem atual (lado verso da carteirinha)
3. **QR Code** — QR code de verificação autêntica da carteirinha

---

## Estado Atual

### Arquivos envolvidos

| Arquivo | Papel |
|---|---|
| `src/app/dashboard/card/page.tsx` | Página principal, orquestra estado, tem o botão de download |
| `src/components/dashboard/card/CardViewer.tsx` | Renderiza slides (agora 2: Frente/Verso), controla swipe |
| `src/components/dashboard/card/CardLightbox.tsx` | Modal de zoom ao clicar na carteirinha |
| `src/lib/cardUtils.ts` | `splitCardImage` — corta o JPEG em frente e verso |
| `src/types/license.ts` | Tipo `License` — não tem `verificationCode` nem `qrCodeUrl` |

### Tipo `License` atual (src/types/license.ts)
```ts
export interface License {
  id: string;
  studentId: string;
  imageLicense: string;
  status: LicenseStatus;
  existing: boolean;
  expirationDate: string;
  createdAt: string;
  updatedAt: string;
}
```

### CardViewer atual
- Aceita `cardSides: { front: string; back: string } | null`
- Renderiza 2 slides com dots: `["Frente", "Verso"]`
- `activeSlide` vai de 0 a 1
- Swipe horizontal troca entre os 2 slides

### CardLightbox atual
- Recebe `cardSides`, `activeSlide` (0 ou 1)
- Mostra `cardSides.front` ou `cardSides.back` baseado no `activeSlide`

### card/page.tsx atual
- Estado `cardSides: { front: string; back: string } | null`
- `activeSlide: number` (0 ou 1)
- Tem `handleDownload` que baixa `imageLicense` como JPEG
- Tem um `<button>` de download no final do `<main>`

---

## Backend — como o QR code é gerado (importante para segurança)

O backend (`license-document-builder.service.ts`) gera o QR assim:
```ts
// Lê QR_CODE_BASE_URL do .env via ConfigService.getOrThrow — nunca hardcoded
generateVerificationUrl(): { verificationCode: string; qrCodeUrl: string } {
  const verificationCode = randomUUID();
  return {
    verificationCode,
    qrCodeUrl: `${this.qrCodeBaseUrl}/${verificationCode}`,
  };
}
```

O `qrCodeUrl` completo (ex: `https://verificar.vrgorganization.com/abc-uuid`) é:
- Enviado para a API Python como `qr_code_url` — ela imprime o QR no JPEG da carteirinha
- Salvo no banco junto com `verificationCode`
- **Retornado pelo `GET /license/me`** no campo `qrCodeUrl`

A rota pública de verificação:
```
GET /license/verify/:code   (Public — sem autenticação)
```

**Conclusão de segurança:** o frontend **não deve reconstruir a URL** do QR. A URL já está pronta no campo `qrCodeUrl` que vem da API. Usar `NEXT_PUBLIC_APP_URL` ou `window.location.origin` no frontend seria errado — criaria uma URL diferente da que está impressa na imagem e poderia expor lógica de construção de URL no cliente.

---

## O que precisa ser feito

### 1. Atualizar `src/types/license.ts`

Adicionar os campos que o backend já retorna mas o frontend ignora:

```ts
export interface License {
  id: string;
  studentId: string;
  imageLicense: string;
  status: LicenseStatus;
  existing: boolean;
  expirationDate: string;
  createdAt: string;
  updatedAt: string;
  verificationCode?: string;   // UUID único (fallback se qrCodeUrl não vier)
  qrCodeUrl?: string | null;   // URL completa pré-gerada pelo backend — usar esta
}
```

---

### 2. Instalar biblioteca de QR code

Instalar `react-qr-code` (SVG puro, sem canvas, funciona offline/PWA):

```bash
npm install react-qr-code
```

---

### 3. Atualizar `CardViewer` para 3 slides

**Arquivo:** `src/components/dashboard/card/CardViewer.tsx`

Nova interface — passar `qrCodeUrl` (não reconstruir no frontend):
```ts
interface CardViewerProps {
  cardSides: { front: string; back: string } | null;
  qrCodeUrl?: string | null;   // URL completa vinda do backend
  lightboxOpen: boolean;
  onOpenLightbox: () => void;
  onSlideChange: (index: number) => void;
}
```

Mudanças:
- Os slides passam de `["Frente", "Verso"]` para `["Frente", "Verso", "QR Code"]`
- O swipe agora vai de 0 a 2 (clamp no `Math.min(activeSlide + 1, 2)`)
- O slide 2 (QR Code) **não abre lightbox** — o `onOpenLightbox` só é chamado nos slides 0 e 1
- O slide 2 renderiza `<QRCode value={qrCodeUrl} />` de `react-qr-code`

Estrutura do slide 2:
```tsx
// Slide 2 — QR Code
<div className="w-full flex flex-col items-center justify-center py-8 gap-4">
  <div className="bg-white p-4 rounded-2xl shadow-sm">
    <QRCode
      value={qrCodeUrl}
      size={200}
      level="M"
    />
  </div>
  <p className="text-xs text-on-surface-variant text-center px-6">
    Apresente este QR code para verificar a autenticidade da sua carteirinha
  </p>
</div>
```

Dots de navegação — o 3º dot representa o QR Code:
```tsx
{["Frente", "Verso", "QR Code"].map((label, i) => (
  <button
    key={label}
    onClick={() => handleSlideChange(i)}
    className={`transition-all duration-300 rounded-full ${
      activeSlide === i ? "bg-primary w-6 h-2" : "bg-outline-variant w-2 h-2"
    }`}
    aria-label={label}
  />
))}
```

**Importante:** quando `qrCodeUrl` for `undefined` ou `null`, mostrar apenas 2 slides (Frente/Verso) como atualmente. Não mostrar o 3º dot.

---

### 4. Atualizar `CardLightbox`

**Arquivo:** `src/components/dashboard/card/CardLightbox.tsx`

O lightbox não exibe o QR code (slide 2 não abre lightbox). Garantir que não trave se `activeSlide === 2` for passado:

```ts
if (!open || !cardSides || activeSlide === 2) return null;
```

---

### 5. Atualizar `card/page.tsx`

**Arquivo:** `src/app/dashboard/card/page.tsx`

Mudanças:
- **Remover** o import de `Download` do lucide-react
- **Remover** a função `handleDownload`
- **Remover** o `<button>` de download inteiro (o bloco que contém `Baixar carteirinha`)
- Passar `qrCodeUrl={effectiveLicense.qrCodeUrl}` para `<CardViewer>` — nunca reconstruir a URL

Estado `cardSides` não precisa mudar — o QR é renderizado pelo `CardViewer` direto a partir de `qrCodeUrl`.

---

## Fluxo final

```
Backend (banco)
  └── qrCodeUrl = "https://verificar.vrg.com/uuid-unico"  ← gerado com QR_CODE_BASE_URL do .env

GET /license/me
  └── retorna { ..., qrCodeUrl: "https://verificar.vrg.com/uuid-unico" }

card/page.tsx
  ├── effectiveLicense.qrCodeUrl → CardViewer (prop)   ← URL pronta, sem reconstrução
  ├── cardSides { front, back }  → CardViewer (prop)
  └── sem botão de download

CardViewer
  ├── slide 0: <img src={cardSides.front} />
  ├── slide 1: <img src={cardSides.back} />
  └── slide 2: <QRCode value={qrCodeUrl} />            ← mesma URL que está impressa na carteirinha
              → NÃO abre lightbox no slide 2

CardLightbox
  ├── slide 0: <img src={cardSides.front} />
  ├── slide 1: <img src={cardSides.back} />
  └── slide 2: return null (não renderiza)
```

---

## Regras de comportamento

- **Nunca reconstruir a URL do QR no frontend.** Usar sempre `license.qrCodeUrl` que vem do backend. A API Python já gravou essa URL dentro do JPEG — o QR exibido deve bater com o impresso.
- Se `qrCodeUrl` for `null` ou `undefined` (carteirinha antiga sem QR gerado), mostrar apenas 2 slides (Frente/Verso). Não mostrar o 3º dot.
- O slide do QR code **não abre o lightbox** (clicar no QR não faz zoom).
- O QR code deve ter mínimo 200×200px para ser escaneado.
- O fundo do QR code deve ser sempre branco (`bg-white`) independente do tema dark/light — scanners de QR precisam de contraste preto no branco.
- **Não há botão de download** em nenhuma parte da página de carteirinha.
- O swipe horizontal funciona normalmente entre os 3 slides.
- A lógica de cache offline (`offlineLicense`) não muda — `qrCodeUrl` e `verificationCode` são cacheados junto com o objeto `License`.

---

## Verificação de conclusão

- [ ] `verificationCode` e `qrCodeUrl` adicionados ao tipo `License`
- [ ] `react-qr-code` instalado
- [ ] `CardViewer` recebe `qrCodeUrl` (não `verificationCode`, não reconstrói URL)
- [ ] `CardViewer` renderiza 3 slides quando `qrCodeUrl` é uma string não-vazia
- [ ] `CardViewer` renderiza 2 slides quando `qrCodeUrl` é null/undefined
- [ ] Slide do QR code não abre lightbox
- [ ] `CardLightbox` retorna null quando `activeSlide === 2`
- [ ] Botão de download removido de `card/page.tsx`
- [ ] Import `Download` removido de `card/page.tsx`
- [ ] Função `handleDownload` removida de `card/page.tsx`
- [ ] QR code tem fundo branco fixo (não afetado pelo dark mode)
- [ ] Swipe entre os 3 slides funciona corretamente
