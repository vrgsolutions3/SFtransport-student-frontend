import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import Step1InfoForm, { type Step1Data } from "./Step1InfoForm";

const hookMocks = vi.hoisted(() => ({
  handleInstitutionChange: vi.fn(),
  handleCourseChange: vi.fn(),
}));

vi.mock("@/hooks/useInstitutionAutocomplete", () => ({
  useInstitutionAutocomplete: () => ({
    institutionOptions: ["IFRJ"],
    courseOptions: ["Informática"],
    handleInstitutionChange: hookMocks.handleInstitutionChange,
    handleCourseChange: hookMocks.handleCourseChange,
  }),
}));

function Step1Harness({ onContinue }: { onContinue: () => void }) {
  const [data, setData] = useState<Step1Data>({
    institution: "",
    degree: "",
    shift: "",
    bloodType: "",
  });

  return <Step1InfoForm data={data} onChange={setData} onContinue={onContinue} />;
}

describe("Step1InfoForm", () => {
  it("deve exibir erros por campo quando formulario estiver vazio", () => {
    const onContinue = vi.fn();
    const { container } = render(<Step1Harness onContinue={onContinue} />);

    fireEvent.submit(container.querySelector("#license-step1") as HTMLFormElement);

    expect(screen.getByText(/instituicao de ensino e obrigatoria/i)).toBeInTheDocument();
    expect(screen.getByText(/curso e obrigatorio/i)).toBeInTheDocument();
    expect(screen.getByText(/turno e obrigatorio/i)).toBeInTheDocument();
    expect(screen.getByText(/tipo sanguineo e obrigatorio/i)).toBeInTheDocument();
    expect(onContinue).not.toHaveBeenCalled();
  });

  it("deve permitir continuar quando campos obrigatorios estiverem validos", async () => {
    const onContinue = vi.fn();
    const { container } = render(<Step1Harness onContinue={onContinue} />);

    await userEvent.type(screen.getByLabelText(/instituição de ensino/i), "IFRJ");
    await userEvent.type(screen.getByLabelText(/curso/i), "Informática");
    await userEvent.click(screen.getByRole("button", { name: "Manhã" }));
    await userEvent.click(screen.getByRole("button", { name: /selecione o tipo sanguíneo/i }));
    await userEvent.click(screen.getByRole("button", { name: "O+" }));

    fireEvent.submit(container.querySelector("#license-step1") as HTMLFormElement);

    expect(onContinue).toHaveBeenCalledTimes(1);
  });
});
