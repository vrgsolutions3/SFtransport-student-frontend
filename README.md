# VRG Transport Student Frontend

Frontend BFF para autenticação e área do aluno.

## Pré-requisitos

- Node.js 18+
- npm

## Instalação

```bash
npm install
```

## Configuração

Crie o arquivo `.env` com base no `.env.example`.

```bash
cp .env.example .env
```

Exemplo mínimo:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
API_PROXY_TARGET=http://localhost:3000
SERVICE_SECRET=<mesmo_valor_do_backend>

SESSION_TTL_STUDENT_DAYS=3

CSRF_COOKIE_NAME=csrf_token_local
CSRF_HEADER_NAME=x-csrf-token-local
```

## Sessão do Aluno

Ordem de resolução do TTL de cookie:

1. `SESSION_TTL_STUDENT_DAYS`
2. `SESSION_TTL_DAYS` (fallback legado)

## Execução

```bash
npm run dev
```

Aplicação local: `http://localhost:3001`

## Testes

```bash
npm run test
```
