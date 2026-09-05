import { useState, type FormEvent } from "react";
import type { AuthCredentials, RegistrationInput } from "@/lib/auth";

type AuthMode = "login" | "register";
type AuthValues = AuthCredentials | RegistrationInput;
type AuthErrors = Partial<Record<"fullName" | "email" | "password", string>>;

export function AuthForm({
  mode: initialMode = "login",
  onSubmit,
}: {
  mode?: AuthMode;
  onSubmit?: (values: AuthValues) => void | Promise<void>;
}) {
  const [mode, setMode] = useState(initialMode);
  const [values, setValues] = useState<RegistrationInput>({
    fullName: "",
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<AuthErrors>({});
  const [submitError, setSubmitError] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const registerMode = mode === "register";

  const changeMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setErrors({});
  };

  const update = (field: keyof RegistrationInput, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setSubmitError(undefined);
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validate(values, registerMode);
    setErrors(nextErrors);
    setSubmitError(undefined);
    if (Object.keys(nextErrors).length > 0 || !onSubmit) return;

    setIsSubmitting(true);
    try {
      await onSubmit(registerMode ? values : { email: values.email, password: values.password });
    } catch (error) {
      const status = getErrorStatus(error);
      setSubmitError(
        status === 409
          ? "El email ya está registrado"
          : status === 401
            ? "El email o la contraseña no son válidos"
            : "No fue posible completar la solicitud",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form noValidate onSubmit={submit} className="mt-8 grid gap-3">
      {registerMode ? (
        <Field label="Nombre completo" error={errors.fullName}>
          <input
            name="fullName"
            value={values.fullName}
            onChange={(event) => update("fullName", event.target.value)}
            autoComplete="name"
            className={inputClass}
          />
        </Field>
      ) : null}

      {submitError ? <p className="text-[12px] text-stop">{submitError}</p> : null}

      <Field label="Email" error={errors.email}>
        <input
          name="email"
          type="email"
          value={values.email}
          onChange={(event) => update("email", event.target.value)}
          autoComplete="email"
          className={inputClass}
        />
      </Field>

      <Field label="Contraseña" error={errors.password}>
        <input
          name="password"
          type="password"
          value={values.password}
          onChange={(event) => update("password", event.target.value)}
          autoComplete={registerMode ? "new-password" : "current-password"}
          className={inputClass}
        />
      </Field>

      {registerMode ? (
        <p className="text-[11px] leading-relaxed text-faint">
          La contraseña debe tener al menos 8 caracteres, una letra mayúscula y un símbolo.
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-5 flex h-11 items-center justify-center gap-3 rounded-[12px] bg-ink text-[14px] font-semibold text-oncolor ring-1 ring-black/5 transition-transform hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-60"
      >
        {isSubmitting ? "Procesando…" : registerMode ? "Registrarme" : "Iniciar sesión"}
      </button>

      <button
        type="button"
        onClick={() => changeMode(registerMode ? "login" : "register")}
        className="mt-1 w-full text-center text-[12px] font-medium text-mute hover:text-ink"
      >
        {registerMode ? "Ya tengo una cuenta" : "Crear cuenta"}
      </button>
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-1.5 text-[12px] font-medium">
      {label}
      {children}
      {error ? <span className="text-[11px] font-normal text-stop">{error}</span> : null}
    </label>
  );
}

const inputClass =
  "h-11 rounded-[12px] bg-paper px-3 ring-1 ring-black/10 outline-none focus:ring-2 focus:ring-ink";

function validate(values: RegistrationInput, registerMode: boolean): AuthErrors {
  const errors: AuthErrors = {};
  if (registerMode && !values.fullName.trim())
    errors.fullName = "El nombre completo es obligatorio";
  if (!values.email.trim()) errors.email = "El email es obligatorio";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    errors.email = "El email no es válido";
  }
  if (!values.password) errors.password = "La contraseña es obligatoria";
  else if (values.password.length < 8) {
    errors.password = "La contraseña debe tener al menos 8 caracteres";
  } else if (!/[A-ZÁÉÍÓÚÜÑ]/.test(values.password)) {
    errors.password = "La contraseña debe contener una letra mayúscula";
  } else if (!/[^\p{L}\p{N}]/u.test(values.password)) {
    errors.password = "La contraseña debe contener un símbolo";
  }
  return errors;
}

function getErrorStatus(error: unknown): number | undefined {
  if (typeof error !== "object" || error === null) return undefined;
  const value = error as { status?: unknown; statusCode?: unknown };
  return typeof value.status === "number"
    ? value.status
    : typeof value.statusCode === "number"
      ? value.statusCode
      : undefined;
}
