import { redirect } from "@tanstack/react-router";
import { initializeAuth } from "@/hooks/useAuth";
import { canAccessPrivateRoute } from "./auth";

export async function requirePrivateSession(): Promise<void> {
  if (typeof window !== "undefined") {
    await initializeAuth();
  }
  if (typeof window !== "undefined" && !canAccessPrivateRoute()) {
    throw redirect({ to: "/auth" });
  }
}

export async function requireGuestSession(): Promise<void> {
  if (typeof window !== "undefined") {
    await initializeAuth();
  }
  if (typeof window !== "undefined" && canAccessPrivateRoute()) {
    throw redirect({ to: "/" });
  }
}
