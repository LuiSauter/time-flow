import {
  AUTH_STORAGE_KEY,
  authHeaders,
  checkToken,
  canAccessPrivateRoute,
  clearStoredSession,
  loadStoredSession,
  saveStoredSession,
  type AuthSession,
} from "./auth";

const session: AuthSession = {
  accessToken: "header.eyJleHAiOjQxMDAwMDAwMDB9.signature",
  user: { id: "user-id", fullName: "Diego Ferrer", email: "diego@example.com" },
};

describe("auth session storage", () => {
  beforeEach(() => localStorage.clear());

  it("saves and reloads a valid session", () => {
    saveStoredSession(session);

    expect(localStorage.getItem(AUTH_STORAGE_KEY)).toContain(session.accessToken);
    expect(loadStoredSession()).toEqual(session);
  });

  it("clears an expired session during rehydration", () => {
    const expired: AuthSession = {
      ...session,
      accessToken: "header.eyJleHAiOjF9.signature",
    };
    saveStoredSession(expired);

    expect(loadStoredSession()).toBeNull();
    expect(localStorage.getItem(AUTH_STORAGE_KEY)).toBeNull();
  });

  it("creates an Authorization bearer header", () => {
    expect(authHeaders(session.accessToken)).toEqual({
      Authorization: `Bearer ${session.accessToken}`,
    });
  });

  it("clears the stored session explicitly", () => {
    saveStoredSession(session);
    clearStoredSession();

    expect(loadStoredSession()).toBeNull();
  });

  it("denies private access without a valid stored session", () => {
    expect(canAccessPrivateRoute()).toBe(false);
  });

  it("allows private access with a valid stored session", () => {
    saveStoredSession(session);

    expect(canAccessPrivateRoute()).toBe(true);
  });

  it("checks a stored token with the backend", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        new Response(JSON.stringify({ user: { sub: "user-id" } }), { status: 200 }),
      );

    await expect(checkToken(session.accessToken)).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3000/api/auth/check-token",
      expect.objectContaining({
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.accessToken}`,
        },
      }),
    );
    fetchMock.mockRestore();
  });
});
