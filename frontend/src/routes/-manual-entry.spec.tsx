import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { ManualEntryCard } from "./index";

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: unknown) => options,
}));
vi.mock("@/lib/route-guard", () => ({ requirePrivateSession: vi.fn() }));

describe("ManualEntryCard", () => {
  it("submits the manual-entry contract after a valid range", async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn().mockResolvedValue(undefined);
    render(<ManualEntryCard onAdd={onAdd} />);

    await user.clear(screen.getByLabelText("Inicio"));
    await user.type(screen.getByLabelText("Inicio"), "09:00");
    await user.clear(screen.getByLabelText("Fin"));
    await user.type(screen.getByLabelText("Fin"), "10:00");
    await user.click(screen.getByRole("button", { name: "Registrar Horas Manualmente" }));

    expect(onAdd).toHaveBeenCalledWith({
      date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      startTime: "09:00",
      endTime: "10:00",
    });
  });

  it("rejects a range whose end is not after its start", async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();
    render(<ManualEntryCard onAdd={onAdd} />);

    await user.clear(screen.getByLabelText("Fin"));
    await user.type(screen.getByLabelText("Fin"), "15:00");
    await user.clear(screen.getByLabelText("Inicio"));
    await user.type(screen.getByLabelText("Inicio"), "16:00");
    await user.click(screen.getByRole("button", { name: "Registrar Horas Manualmente" }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "La hora de fin debe ser posterior a la de inicio",
    );
    expect(onAdd).not.toHaveBeenCalled();
  });

  it("shows a remote validation error without clearing the form", async () => {
    const user = userEvent.setup();
    const onAdd = vi
      .fn()
      .mockRejectedValue(new Error("El registro manual se solapa con otra jornada"));
    render(<ManualEntryCard onAdd={onAdd} />);

    const start = screen.getByLabelText("Inicio");
    await user.clear(start);
    await user.type(start, "09:00");
    await user.click(screen.getByRole("button", { name: "Registrar Horas Manualmente" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "El registro manual se solapa con otra jornada",
    );
    expect(start).toHaveValue("09:00");
  });

  it("shows a remote future-date validation error", async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn().mockRejectedValue(new Error("No se permiten registros futuros"));
    render(<ManualEntryCard onAdd={onAdd} />);

    await user.click(screen.getByRole("button", { name: "Registrar Horas Manualmente" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("No se permiten registros futuros");
  });
});
