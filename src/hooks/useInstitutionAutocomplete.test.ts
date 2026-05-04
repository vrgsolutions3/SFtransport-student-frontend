import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useInstitutionAutocomplete } from "./useInstitutionAutocomplete";

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  api: {
    get: (...args: unknown[]) => mocks.get(...args),
  },
}));

const makeUniversities = () => [
  { _id: "u1", name: "Universidade Federal do Rio de Janeiro", acronym: "UFRJ" },
  { _id: "u2", name: "Instituto Federal do Rio de Janeiro", acronym: "IFRJ" },
];

const makeCourses = (universityId: string) => [
  { _id: "c1", name: "Ciência da Computação", universityId },
  { _id: "c2", name: "Administração", universityId },
];

describe("useInstitutionAutocomplete", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("carregamento de universidades", () => {
    it("chama api.get('/university') na montagem", async () => {
      mocks.get.mockResolvedValueOnce([]);
      renderHook(() => useInstitutionAutocomplete());
      await waitFor(() => expect(mocks.get).toHaveBeenCalledWith("/university"));
    });

    it("retorna universidades ordenadas alfabeticamente por nome", async () => {
      mocks.get.mockResolvedValueOnce(makeUniversities());
      const { result } = renderHook(() => useInstitutionAutocomplete());

      await waitFor(() => expect(result.current.loadingUniversities).toBe(false));

      expect(result.current.institutionOptions[0]).toBe(
        "Instituto Federal do Rio de Janeiro",
      );
      expect(result.current.institutionOptions[1]).toBe(
        "Universidade Federal do Rio de Janeiro",
      );
    });

    it("erro 403 → mensagem de permissao especifica", async () => {
      const err = Object.assign(new Error("Forbidden"), { status: 403 });
      mocks.get.mockRejectedValueOnce(err);
      const { result } = renderHook(() => useInstitutionAutocomplete());

      await waitFor(() => expect(result.current.loadingUniversities).toBe(false));

      expect(result.current.loadError).toMatch(/nao tem permissao/i);
    });

    it("erro generico → mensagem generica", async () => {
      mocks.get.mockRejectedValueOnce(new Error("network error"));
      const { result } = renderHook(() => useInstitutionAutocomplete());

      await waitFor(() => expect(result.current.loadingUniversities).toBe(false));

      expect(result.current.loadError).toMatch(/nao foi possivel carregar as instituicoes/i);
    });

    it("lista vazia → institutionOptions vazio sem erro", async () => {
      mocks.get.mockResolvedValueOnce([]);
      const { result } = renderHook(() => useInstitutionAutocomplete());

      await waitFor(() => expect(result.current.loadingUniversities).toBe(false));

      expect(result.current.institutionOptions).toHaveLength(0);
      expect(result.current.loadError).toBe("");
    });
  });

  describe("normalizeInstitutionInput", () => {
    it("mapeia acronimo exato para nome completo", async () => {
      mocks.get.mockResolvedValueOnce(makeUniversities());
      const { result } = renderHook(() => useInstitutionAutocomplete());

      await waitFor(() => expect(result.current.loadingUniversities).toBe(false));

      expect(result.current.normalizeInstitutionInput("IFRJ")).toBe(
        "Instituto Federal do Rio de Janeiro",
      );
    });

    it("e case-insensitive e faz trim de espacos", async () => {
      mocks.get.mockResolvedValueOnce(makeUniversities());
      const { result } = renderHook(() => useInstitutionAutocomplete());

      await waitFor(() => expect(result.current.loadingUniversities).toBe(false));

      expect(result.current.normalizeInstitutionInput("  ufrj  ")).toBe(
        "Universidade Federal do Rio de Janeiro",
      );
    });

    it("retorna o input original se nao encontrar correspondencia", async () => {
      mocks.get.mockResolvedValueOnce(makeUniversities());
      const { result } = renderHook(() => useInstitutionAutocomplete());

      await waitFor(() => expect(result.current.loadingUniversities).toBe(false));

      expect(result.current.normalizeInstitutionInput("XYZ Desconhecida")).toBe(
        "XYZ Desconhecida",
      );
    });

    it("mapeia nome completo para si mesmo", async () => {
      mocks.get.mockResolvedValueOnce(makeUniversities());
      const { result } = renderHook(() => useInstitutionAutocomplete());

      await waitFor(() => expect(result.current.loadingUniversities).toBe(false));

      expect(
        result.current.normalizeInstitutionInput(
          "universidade federal do rio de janeiro",
        ),
      ).toBe("Universidade Federal do Rio de Janeiro");
    });
  });

  describe("matchesInstitutionOption", () => {
    it("input vazio retorna true para qualquer opcao", async () => {
      mocks.get.mockResolvedValueOnce(makeUniversities());
      const { result } = renderHook(() => useInstitutionAutocomplete());

      await waitFor(() => expect(result.current.loadingUniversities).toBe(false));

      expect(
        result.current.matchesInstitutionOption(
          "Universidade Federal do Rio de Janeiro",
          "",
        ),
      ).toBe(true);
    });

    it("match por substring no nome da instituicao", async () => {
      mocks.get.mockResolvedValueOnce(makeUniversities());
      const { result } = renderHook(() => useInstitutionAutocomplete());

      await waitFor(() => expect(result.current.loadingUniversities).toBe(false));

      expect(
        result.current.matchesInstitutionOption(
          "Universidade Federal do Rio de Janeiro",
          "federal",
        ),
      ).toBe(true);
    });

    it("match por substring no acronimo", async () => {
      mocks.get.mockResolvedValueOnce(makeUniversities());
      const { result } = renderHook(() => useInstitutionAutocomplete());

      await waitFor(() => expect(result.current.loadingUniversities).toBe(false));

      expect(
        result.current.matchesInstitutionOption(
          "Instituto Federal do Rio de Janeiro",
          "ifrj",
        ),
      ).toBe(true);
    });

    it("nao match quando substring nao esta no nome nem no acronimo", async () => {
      mocks.get.mockResolvedValueOnce(makeUniversities());
      const { result } = renderHook(() => useInstitutionAutocomplete());

      await waitFor(() => expect(result.current.loadingUniversities).toBe(false));

      expect(
        result.current.matchesInstitutionOption(
          "Instituto Federal do Rio de Janeiro",
          "xyz",
        ),
      ).toBe(false);
    });
  });

  describe("handleInstitutionChange", () => {
    it("ao trocar instituicao, curso e resetado para string vazia", async () => {
      mocks.get.mockResolvedValueOnce(makeUniversities());
      const { result } = renderHook(() =>
        useInstitutionAutocomplete("", "Ciência da Computação"),
      );

      await waitFor(() => expect(result.current.loadingUniversities).toBe(false));

      act(() => {
        result.current.handleInstitutionChange(
          "Universidade Federal do Rio de Janeiro",
        );
      });

      expect(result.current.course).toBe("");
    });

    it("handleCourseChange marca o curso como dirty e atualiza o valor", async () => {
      mocks.get.mockResolvedValueOnce(makeUniversities());
      const { result } = renderHook(() => useInstitutionAutocomplete());

      await waitFor(() => expect(result.current.loadingUniversities).toBe(false));

      act(() => {
        result.current.handleCourseChange("Administração");
      });

      expect(result.current.course).toBe("Administração");
    });
  });

  describe("carregamento de cursos", () => {
    it("carrega cursos quando universidade e selecionada via initialInstitution", async () => {
      mocks.get
        .mockResolvedValueOnce(makeUniversities())
        .mockResolvedValueOnce(makeCourses("u1"));

      const { result } = renderHook(() =>
        useInstitutionAutocomplete("Universidade Federal do Rio de Janeiro"),
      );

      await waitFor(() => expect(result.current.loadingUniversities).toBe(false));
      await waitFor(() => expect(result.current.courseOptions.length).toBeGreaterThan(0));

      expect(mocks.get).toHaveBeenCalledWith("/course/by-university/u1");
      expect(result.current.courseOptions).toContain("Administração");
      expect(result.current.courseOptions).toContain("Ciência da Computação");
    });

    it("nao carrega cursos se nenhuma universidade selecionada", async () => {
      mocks.get.mockResolvedValueOnce([]);
      renderHook(() => useInstitutionAutocomplete());

      await waitFor(() => expect(mocks.get).toHaveBeenCalledTimes(1));

      expect(mocks.get).not.toHaveBeenCalledWith(
        expect.stringContaining("/course/by-university"),
      );
    });

    it("erro 403 nos cursos → mensagem de permissao de cursos", async () => {
      const err = Object.assign(new Error("Forbidden"), { status: 403 });
      mocks.get
        .mockResolvedValueOnce(makeUniversities())
        .mockRejectedValueOnce(err);

      const { result } = renderHook(() =>
        useInstitutionAutocomplete("Universidade Federal do Rio de Janeiro"),
      );

      await waitFor(() => expect(result.current.loadingUniversities).toBe(false));
      await waitFor(() => expect(result.current.loadingCourses).toBe(false));

      expect(result.current.loadError).toMatch(/nao tem permissao para listar cursos/i);
    });

    it("erro generico nos cursos → mensagem generica de cursos", async () => {
      mocks.get
        .mockResolvedValueOnce(makeUniversities())
        .mockRejectedValueOnce(new Error("network"));

      const { result } = renderHook(() =>
        useInstitutionAutocomplete("Universidade Federal do Rio de Janeiro"),
      );

      await waitFor(() => expect(result.current.loadingUniversities).toBe(false));
      await waitFor(() => expect(result.current.loadingCourses).toBe(false));

      expect(result.current.loadError).toMatch(/nao foi possivel carregar os cursos/i);
    });

    it("ao trocar instituicao, cursos sao resetados e novo fetch e feito", async () => {
      mocks.get
        .mockResolvedValueOnce(makeUniversities()) // universities
        .mockResolvedValueOnce(makeCourses("u1")) // cursos da UFRJ
        .mockResolvedValueOnce(makeCourses("u2")); // cursos do IFRJ após troca

      const { result } = renderHook(() =>
        useInstitutionAutocomplete("Universidade Federal do Rio de Janeiro"),
      );

      await waitFor(() => expect(result.current.courseOptions.length).toBeGreaterThan(0));

      act(() => {
        result.current.handleInstitutionChange("Instituto Federal do Rio de Janeiro");
      });

      await waitFor(() =>
        expect(mocks.get).toHaveBeenCalledWith("/course/by-university/u2"),
      );
    });
  });
});
