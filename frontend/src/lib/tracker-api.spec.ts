import {
  addManualEntry,
  createProject,
  finishTracker,
  getProjects,
  getTracker,
  pauseTracker,
  resumeTracker,
  startTracker,
} from "./tracker";

describe("tracker API contracts", () => {
  afterEach(() => vi.restoreAllMocks());

  it("calls project and tracker endpoints with their typed inputs", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = String(input);
      return new Response(JSON.stringify(url.endsWith("/projects") ? [] : { status: "IDLE" }), {
        status: 200,
      });
    });

    await getProjects("token");
    await createProject("token", { name: "Nuxio", timeZone: "America/La_Paz" });
    await getTracker("token", "project-1", "business");
    await startTracker("token", "project-1");
    await pauseTracker("token", "project-1");
    await resumeTracker("token", "project-1");
    await finishTracker("token", "project-1");
    await addManualEntry("token", "project-1", {
      date: "2026-09-04",
      startTime: "09:00",
      endTime: "10:00",
    });

    expect(fetchMock.mock.calls.map(([input]) => String(input))).toEqual([
      "http://localhost:3000/api/projects",
      "http://localhost:3000/api/projects",
      "http://localhost:3000/api/projects/project-1/tracker?previousDayScope=business",
      "http://localhost:3000/api/projects/project-1/tracker/start",
      "http://localhost:3000/api/projects/project-1/tracker/break",
      "http://localhost:3000/api/projects/project-1/tracker/resume",
      "http://localhost:3000/api/projects/project-1/tracker/finish",
      "http://localhost:3000/api/projects/project-1/manual-entries",
    ]);
    expect(fetchMock.mock.calls[7]?.[1]).toEqual(
      expect.objectContaining({
        body: JSON.stringify({ date: "2026-09-04", startTime: "09:00", endTime: "10:00" }),
      }),
    );
    expect(fetchMock.mock.calls[1]?.[1]).toEqual(
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ name: "Nuxio", timeZone: "America/La_Paz" }),
      }),
    );
  });
});
