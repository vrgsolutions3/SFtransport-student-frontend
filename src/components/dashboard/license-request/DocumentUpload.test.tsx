import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { FileText } from "lucide-react";
import DocumentUpload from "./DocumentUpload";

const baseConfig = {
  photoType: "ProfilePhoto",
  label: "Foto 3x4",
  description: "Documento obrigatório",
  icon: FileText,
  required: true,
  validateRatio: true,
  acceptPdf: false,
};

describe("DocumentUpload", () => {
  it("deve renderizar estado vazio com call to action", () => {
    render(
      <DocumentUpload
        config={baseConfig}
        entry={null}
        onFileSelect={vi.fn()}
        onRemove={vi.fn()}
      />,
    );

    expect(screen.getByText("Selecionar Foto 3x4")).toBeInTheDocument();
  });

  it("deve bloquear arquivo invalido e mostrar mensagem", () => {
    const { container } = render(
      <DocumentUpload
        config={baseConfig}
        entry={null}
        onFileSelect={vi.fn()}
        onRemove={vi.fn()}
      />,
    );

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const invalidFile = new File(["conteudo"], "arquivo.txt", { type: "text/plain" });

    fireEvent.change(input, { target: { files: [invalidFile] } });

    expect(screen.getByText("Apenas imagens JPEG e PNG são permitidas.")).toBeInTheDocument();
  });

  it("deve disparar callbacks criticos de selecionar arquivo valido e remover", async () => {
    const onFileSelect = vi.fn();
    const onRemove = vi.fn();
    const validFile = new File(["abc"], "foto.jpg", { type: "image/jpeg" });

    const { container, rerender } = render(
      <DocumentUpload
        config={baseConfig}
        entry={null}
        onFileSelect={onFileSelect}
        onRemove={onRemove}
      />,
    );

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [validFile] } });
    expect(onFileSelect).toHaveBeenCalledWith(validFile);

    rerender(
      <DocumentUpload
        config={baseConfig}
        entry={{
          file: validFile,
          previewUrl: "blob:preview",
          result: {
            status: "ok",
            processedBlob: validFile,
            nsfw: null,
            aspectRatio: null,
            faceHeuristic: null,
            message: "",
          },
        }}
        onFileSelect={onFileSelect}
        onRemove={onRemove}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: /remover/i }));
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it("deve renderizar estado de processamento e manter controles desabilitados", () => {
    const processingFile = new File(["abc"], "foto.jpg", { type: "image/jpeg" });

    render(
      <DocumentUpload
        config={baseConfig}
        entry={{
          file: processingFile,
          previewUrl: "blob:preview",
          result: {
            status: "processing",
            processedBlob: null,
            nsfw: null,
            aspectRatio: null,
            faceHeuristic: null,
            message: "Analisando...",
          },
        }}
        onFileSelect={vi.fn()}
        onRemove={vi.fn()}
        disabled
      />,
    );

    expect(screen.getByRole("button", { name: /alterar/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /remover/i })).toBeDisabled();
  });
});
