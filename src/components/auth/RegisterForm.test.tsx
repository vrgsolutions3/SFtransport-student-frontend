import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RegisterForm } from "./RegisterForm";

const pushMock = vi.fn();
const registerMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    register: registerMock,
  }),
}));

vi.mock("./EulaModal", () => ({
  EulaModal: ({ open, onAccept }: { open: boolean; onAccept: () => void; onClose: () => void }) =>
    open ? (
      <div>
        <button type="button" onClick={onAccept}>
          Aceitar termos
        </button>
      </div>
    ) : null,
}));

describe("RegisterForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    registerMock.mockResolvedValue({ success: true, isInstitutional: false });
  });

  it("deve validar campos e exibir erros por campo", async () => {
    render(<RegisterForm />);

    await userEvent.type(screen.getByPlaceholderText("nome@email.com"), "email-invalido");
    await userEvent.type(screen.getByPlaceholderText("(22) 99999-9999"), "123");
    await userEvent.type(screen.getByPlaceholderText("000.000.000-00"), "11111111111");
    await userEvent.type(
      screen.getByPlaceholderText("Mín. 8 caracteres"),
      "abc",
    );
    await userEvent.type(screen.getByPlaceholderText("Digite a senha novamente"), "xyz");
    await userEvent.click(screen.getByRole("button", { name: /criar conta/i }));

    expect(registerMock).not.toHaveBeenCalled();
  });

  it("deve exibir erro geral quando cadastro falhar", async () => {
    registerMock.mockResolvedValue({ success: false, error: "Cadastro indisponivel" });
    render(<RegisterForm />);

    await userEvent.type(screen.getByPlaceholderText("Seu nome completo"), "Joao Teste");
    await userEvent.type(screen.getByPlaceholderText("nome@email.com"), "joao@test.com");
    await userEvent.type(screen.getByPlaceholderText("(22) 99999-9999"), "22999999999");
    await userEvent.type(screen.getByPlaceholderText("000.000.000-00"), "52998224725");
    await userEvent.type(
      screen.getByPlaceholderText("Mín. 8 caracteres"),
      "Senha123",
    );
    await userEvent.type(screen.getByPlaceholderText("Digite a senha novamente"), "Senha123");

    // abre o modal de termos e aceita
    await userEvent.click(screen.getByRole("button", { name: /li e aceito|termos/i }));
    await userEvent.click(screen.getByRole("button", { name: /aceitar termos/i }));

    await userEvent.click(screen.getByRole("button", { name: /criar conta/i }));

    expect(await screen.findByText("Cadastro indisponivel")).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("deve manter navegacao de teclado basica", async () => {
    render(<RegisterForm />);

    await userEvent.tab();
    expect(screen.getByPlaceholderText("Seu nome completo")).toHaveFocus();

    await userEvent.tab();
    expect(screen.getByPlaceholderText("nome@email.com")).toHaveFocus();
  });
});
