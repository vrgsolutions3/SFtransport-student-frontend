// ─────────────────────────────────────────────────────────────
// lib/api.ts
// Shim de compatibilidade — delega para o apiClient refatorado.
// Mantém a interface { api, setTokens, clearTokens } para que
// os componentes existentes não precisem ser alterados agora.
//
// ⚠️  Novos arquivos devem importar diretamente de "@/lib/apiClient".
// ─────────────────────────────────────────────────────────────
 
import { apiClient } from "./apiClient";
 
/** @deprecated Use apiClient de "@/lib/apiClient" */
export const api = apiClient;
 
/**
 * @deprecated Tokens não são mais gerenciados pelo caller.
 * O AuthContext cuida disso internamente.
 * Mantido apenas para não quebrar imports existentes.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function setTokens(_accessToken: string, _refreshToken: string) {
  // No-op: AuthContext.saveToken() é quem seta o cookie + memória
}
 
/**
 * @deprecated Use AuthContext.logout() para limpar a sessão.
 */
export function clearTokens() {
  // No-op: sessão agora é controlada por cookie httpOnly sid no BFF.
}
 