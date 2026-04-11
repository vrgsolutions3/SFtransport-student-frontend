import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LoginForm } from "./LoginForm";

const pushMock = vi.fn();
const loginMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    login: loginMock,
  }),
}));

describe("LoginForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    loginMock.mockResolvedValue({ success: true });
  });

  it("deve validar senha antes de enviar quando tamanho e invalido", async () => {
    render(<LoginForm />);

    await userEvent.type(screen.getByPlaceholderText("nome@email.com"), "joao@test.com");
    await userEvent.type(screen.getByPlaceholderText("••••••••"), "123");
    await userEvent.click(screen.getByRole("button", { name: "Entrar no Sistema" }));

    expect(await screen.findByText("Senha deve ter no minimo 6 caracteres")).toBeInTheDocument();
    expect(loginMock).not.toHaveBeenCalled();
  });

  it("deve exibir erro geral quando autenticacao falha", async () => {
    loginMock.mockResolvedValue({ success: false, error: "Credenciais invalidas" });
    render(<LoginForm />);

    await userEvent.type(screen.getByPlaceholderText("nome@email.com"), "joao@test.com");
    await userEvent.type(screen.getByPlaceholderText("••••••••"), "Senha123");
    await userEvent.click(screen.getByRole("button", { name: "Entrar no Sistema" }));

    expect(await screen.findByText("Credenciais invalidas")).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
  });
});
