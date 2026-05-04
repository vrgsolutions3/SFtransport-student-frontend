import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DocumentCard } from "./DocumentCard";
import type { StudentImage } from "@/lib/documentUtils";

const mocks = vi.hoisted(() => ({
  downloadDataUrl: vi.fn(),
  resolveDocumentData: vi.fn(),
  fileNameForType: vi.fn(),
}));

vi.mock("@/lib/documentUtils", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/documentUtils")>();
  return {
    ...original,
    downloadDataUrl: mocks.downloadDataUrl,
    resolveDocumentData: mocks.resolveDocumentData,
    fileNameForType: mocks.fileNameForType,
  };
});

const baseImage: StudentImage = {
  _id: "img-1",
  studentId: "student-1",
  photoType: "ProfilePhoto",
  active: true,
  hasFile: true,
  photo3x4: "data:image/jpeg;base64,abc123",
  documentImage: null,
};

describe("DocumentCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.fileNameForType.mockReturnValue("foto-3x4.jpg");
  });

  describe("quando nao ha arquivo disponivel", () => {
    beforeEach(() => {
      mocks.resolveDocumentData.mockReturnValue({ src: null, isPdf: false });
    });

    it("exibe mensagem de arquivo nao disponivel", () => {
      render(<DocumentCard image={baseImage} onPreview={vi.fn()} />);
      expect(screen.getByText(/arquivo não disponível/i)).toBeInTheDocument();
    });

    it("desabilita o botao de download", () => {
      render(<DocumentCard image={baseImage} onPreview={vi.fn()} />);
      expect(screen.getByRole("button", { name: /baixar/i })).toBeDisabled();
    });

    it("nao chama downloadDataUrl ao clicar em baixar", () => {
      render(<DocumentCard image={baseImage} onPreview={vi.fn()} />);
      fireEvent.click(screen.getByRole("button", { name: /baixar/i }));
      expect(mocks.downloadDataUrl).not.toHaveBeenCalled();
    });
  });

  describe("quando o arquivo e um PDF", () => {
    beforeEach(() => {
      mocks.resolveDocumentData.mockReturnValue({
        src: "data:application/pdf;base64,abc123",
        isPdf: true,
      });
    });

    it("exibe label de documento em PDF", () => {
      render(<DocumentCard image={baseImage} onPreview={vi.fn()} />);
      expect(screen.getByText(/documento em pdf/i)).toBeInTheDocument();
    });

    it("nao exibe botao de preview para PDF", () => {
      render(<DocumentCard image={baseImage} onPreview={vi.fn()} />);
      expect(screen.queryByRole("button", { name: /visualizar/i })).not.toBeInTheDocument();
    });

    it("nao chama onPreview para PDF", () => {
      const onPreview = vi.fn();
      render(<DocumentCard image={baseImage} onPreview={onPreview} />);
      expect(onPreview).not.toHaveBeenCalled();
    });

    it("habilita e chama download com dados corretos", () => {
      mocks.fileNameForType.mockReturnValue("comprovante-matricula.pdf");
      render(<DocumentCard image={baseImage} onPreview={vi.fn()} />);
      const btn = screen.getByRole("button", { name: /baixar/i });
      expect(btn).not.toBeDisabled();
      fireEvent.click(btn);
      expect(mocks.downloadDataUrl).toHaveBeenCalledWith(
        "data:application/pdf;base64,abc123",
        "comprovante-matricula.pdf",
      );
    });
  });

  describe("quando o arquivo e uma imagem", () => {
    beforeEach(() => {
      mocks.resolveDocumentData.mockReturnValue({
        src: "data:image/jpeg;base64,abc123",
        isPdf: false,
      });
    });

    it("exibe a imagem renderizada", () => {
      render(<DocumentCard image={baseImage} onPreview={vi.fn()} />);
      const img = screen.getByRole("img");
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute("src", "data:image/jpeg;base64,abc123");
    });

    it("exibe botao de preview clicavel", () => {
      render(<DocumentCard image={baseImage} onPreview={vi.fn()} />);
      expect(screen.getByRole("button", { name: /visualizar/i })).toBeInTheDocument();
    });

    it("chama onPreview com src e titulo ao clicar na imagem", () => {
      const onPreview = vi.fn();
      render(<DocumentCard image={baseImage} onPreview={onPreview} />);
      fireEvent.click(screen.getByRole("button", { name: /visualizar/i }));
      expect(onPreview).toHaveBeenCalledTimes(1);
      expect(onPreview).toHaveBeenCalledWith("data:image/jpeg;base64,abc123", expect.any(String));
    });

    it("nao exibe label de PDF", () => {
      render(<DocumentCard image={baseImage} onPreview={vi.fn()} />);
      expect(screen.queryByText(/documento em pdf/i)).not.toBeInTheDocument();
    });

    it("habilita e chama download com dados corretos", () => {
      render(<DocumentCard image={baseImage} onPreview={vi.fn()} />);
      fireEvent.click(screen.getByRole("button", { name: /baixar/i }));
      expect(mocks.downloadDataUrl).toHaveBeenCalledWith(
        "data:image/jpeg;base64,abc123",
        "foto-3x4.jpg",
      );
    });
  });

  it("exibe o titulo correto do tipo de foto", () => {
    mocks.resolveDocumentData.mockReturnValue({ src: null, isPdf: false });
    render(<DocumentCard image={{ ...baseImage, photoType: "EnrollmentProof" }} onPreview={vi.fn()} />);
    expect(screen.getByText(/comprovante de matrícula/i)).toBeInTheDocument();
  });
});
