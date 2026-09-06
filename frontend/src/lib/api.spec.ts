import { apiRequest, RemoteApiError } from "./api";

describe("authenticated API client", () => {
  afterEach(() => vi.restoreAllMocks());

  it("sends JSON and the bearer token", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));

    await expect(
      apiRequest("/projects", {
        accessToken: "token-123",
        method: "POST",
        body: { name: "Nuxio", timeZone: "America/La_Paz" },
      }),
    ).resolves.toEqual({ ok: true });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3000/api/projects",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ name: "Nuxio", timeZone: "America/La_Paz" }),
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer token-123",
        },
      }),
    );
  });

  it("normalizes backend validation errors into a remote error", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          statusCode: 400,
          code: "BAD_REQUEST",
          message: ["El nombre es obligatorio", "La zona no es válida"],
        }),
        { status: 400 },
      ),
    );

    const result = apiRequest("/projects", { accessToken: "token-123" });

    await expect(result).rejects.toMatchObject({
      statusCode: 400,
      code: "BAD_REQUEST",
      message: "El nombre es obligatorio; La zona no es válida",
    });
    await expect(result).rejects.toBeInstanceOf(RemoteApiError);
  });
});
