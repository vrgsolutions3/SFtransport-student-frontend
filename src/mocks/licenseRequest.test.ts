import { describe, it, expect } from "vitest";
import { apiClient } from "@/lib/apiClient";

function computeFilaPosition(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return (hash % 20) + 1;
}

describe("POST /api/v1/license-request MSW mock", () => {
  it("retorna filaPosition determinística por universityId (JSON)", async () => {
    const uniA = "uni-A-123";
    const uniB = "uni-B-456";

    const resA1 = await apiClient.post<any>("/license-request", { universityId: uniA });
    const resA2 = await apiClient.post<any>("/license-request", { universityId: uniA });
    const resB = await apiClient.post<any>("/license-request", { universityId: uniB });

    expect(resA1).toHaveProperty("filaPosition");
    expect(resA2).toHaveProperty("filaPosition");
    expect(resB).toHaveProperty("filaPosition");

    expect(resA1.filaPosition).toBe(computeFilaPosition(uniA));
    expect(resA2.filaPosition).toBe(computeFilaPosition(uniA));
    expect(resB.filaPosition).toBe(computeFilaPosition(uniB));

    // posições para uniA e uniB devem ser diferentes na maioria dos casos
    expect(resA1.filaPosition).not.toBe(resB.filaPosition);
  });

  it("retorna filaPosition determinística quando universityId enviado via query", async () => {
    const uniQ = "uni-query-xyz";
    const res = await apiClient.post<any>(`/license-request?universityId=${encodeURIComponent(uniQ)}`, {});
    expect(res.filaPosition).toBe(computeFilaPosition(uniQ));
  });

  it("retorna filaPosition determinística quando universityId enviado via FormData", async () => {
    const uniF = "uni-formdata-987";
    const form = new FormData();
    form.append("universityId", uniF);

    const res = await apiClient.postForm<any>("/license-request", form);
    expect(res.filaPosition).toBe(computeFilaPosition(uniF));
  });

  it("retorna filaPosition determinística quando universityId enviado via header", async () => {
    const uniH = "uni-header-555";

    const resp = await fetch("/api/v1/license-request", {
      method: "POST",
      headers: { "x-mock-university": uniH },
      body: JSON.stringify({}),
      credentials: "include",
    });

    const data = await resp.json();
    expect(data.filaPosition).toBe(computeFilaPosition(uniH));
  });
});
