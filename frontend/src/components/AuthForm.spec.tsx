import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthForm } from "./AuthForm";

describe("AuthForm", () => {
  it("shows login fields by default and registration fields after switching mode", async () => {
    const user = userEvent.setup();
    render(<AuthForm />);

    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Contraseña")).toBeInTheDocument();
    expect(screen.queryByLabelText("Nombre completo")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Crear cuenta" }));

    expect(screen.getByLabelText("Nombre completo")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Registrarme" })).toBeInTheDocument();
  });

  it("shows registration validation errors and does not submit invalid data", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<AuthForm mode="register" onSubmit={onSubmit} />);

    await user.click(screen.getByRole("button", { name: "Registrarme" }));

    expect(screen.getByText("El nombre completo es obligatorio")).toBeInTheDocument();
    expect(screen.getByText("El email es obligatorio")).toBeInTheDocument();
    expect(screen.getByText("La contraseña es obligatoria")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("submits a valid registration and exposes password requirements", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<AuthForm mode="register" onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText("Nombre completo"), "Diego Ferrer");
    await user.type(screen.getByLabelText("Email"), "diego@example.com");
    await user.type(screen.getByLabelText("Contraseña"), "Abcdefg!");
    await user.click(screen.getByRole("button", { name: "Registrarme" }));

    expect(onSubmit).toHaveBeenCalledWith({
      fullName: "Diego Ferrer",
      email: "diego@example.com",
      password: "Abcdefg!",
    });
    expect(screen.getByText(/8 caracteres/)).toBeInTheDocument();
    expect(screen.getByText(/una letra mayúscula/)).toBeInTheDocument();
    expect(screen.getByText(/un símbolo/)).toBeInTheDocument();
  });

  it("shows a generic error when the server rejects login credentials", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockRejectedValue({ status: 401 });
    render(<AuthForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText("Email"), "diego@example.com");
    await user.type(screen.getByLabelText("Contraseña"), "Wrong123!");
    await user.click(screen.getByRole("button", { name: "Iniciar sesión" }));

    expect(await screen.findByText("El email o la contraseña no son válidos")).toBeInTheDocument();
  });

  it("keeps form controls reachable by keyboard with visible focus classes", async () => {
    const user = userEvent.setup();
    render(<AuthForm mode="register" />);

    await user.tab();
    expect(document.activeElement).toBe(screen.getByLabelText("Nombre completo"));
    expect(screen.getByLabelText("Nombre completo")).toHaveClass("focus:ring-2");

    await user.tab();
    expect(document.activeElement).toBe(screen.getByLabelText("Email"));
    await user.tab();
    expect(document.activeElement).toBe(screen.getByLabelText("Contraseña"));
  });
});
