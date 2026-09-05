import { Project } from '../projects/project.entity.js';
import { ProjectDailyRateOverride } from '../projects/project-daily-rate-override.entity.js';
import { ProjectRate } from '../projects/project-rate.entity.js';
import { TrackerSegment } from './tracker-segment.entity.js';
import { WorkSession } from './work-session.entity.js';
import { HistoryService } from './history.service.js';

const now = new Date('2026-09-07T15:00:00.000Z');
const laPazProject = {
  id: 'project-la-paz',
  name: 'Nuxio',
  timeZone: 'America/La_Paz',
  dailyGoalMinutes: 480,
} as Project;
const madridProject = {
  id: 'project-madrid',
  name: 'Focus',
  timeZone: 'Europe/Madrid',
  dailyGoalMinutes: 360,
} as Project;

function session(id: string): WorkSession {
  return { id } as WorkSession;
}

function segment(
  id: string,
  sessionId: string,
  kind: 'work' | 'break',
  startedAt: string,
  endedAt: string | null,
): TrackerSegment {
  return {
    id,
    workSession: { id: sessionId } as WorkSession,
    kind,
    label: id,
    startedAt: new Date(startedAt),
    endedAt: endedAt ? new Date(endedAt) : null,
  } as TrackerSegment;
}

function rate(
  id: string,
  projectId: string,
  hourlyRate: string,
  effectiveFrom: string,
): ProjectRate {
  return { id, project: { id: projectId } as Project, hourlyRate, effectiveFrom } as ProjectRate;
}

function override(
  id: string,
  projectId: string,
  hourlyRate: string,
  overrideDate: string,
): ProjectDailyRateOverride {
  return { id, project: { id: projectId } as Project, hourlyRate, overrideDate } as ProjectDailyRateOverride;
}

function createService(
  projectsData: Project[] = [laPazProject],
  sessionsData: WorkSession[] = [session('session-1')],
  segmentsData: TrackerSegment[] = [],
  ratesData: ProjectRate[] = [],
  overridesData: ProjectDailyRateOverride[] = [],
) {
  const projects = {
    find: vi.fn().mockResolvedValue(projectsData),
  };
  const sessions = {
    find: vi.fn().mockResolvedValue(sessionsData),
  };
  const segments = {
    find: vi.fn().mockResolvedValue(segmentsData),
  };
  const rates = {
    find: vi.fn().mockResolvedValue(ratesData),
  };
  const overrides = {
    find: vi.fn().mockResolvedValue(overridesData),
  };
  return {
    service: new HistoryService(
      projects as never,
      sessions as never,
      segments as never,
      rates as never,
      overrides as never,
    ),
    projects,
    sessions,
    segments,
    rates,
    overrides,
  };
}

describe('HistoryService', () => {
  it('aggregates work and breaks for an inclusive custom range', async () => {
    const { service } = createService(
      [laPazProject],
      [session('session-1')],
      [
        segment('work-1', 'session-1', 'work', '2026-09-01T14:00:00.000Z', '2026-09-01T18:00:00.000Z'),
        segment('break-1', 'session-1', 'break', '2026-09-01T18:00:00.000Z', '2026-09-01T18:30:00.000Z'),
        segment('work-2', 'session-1', 'work', '2026-09-01T18:30:00.000Z', '2026-09-01T20:00:00.000Z'),
      ],
      [rate('rate-1', laPazProject.id, '5.00', '2026-08-01')],
    );

    const result = await service.getHistory('user-id', {
      period: 'custom',
      startDate: '2026-09-01',
      endDate: '2026-09-01',
      onlyWeekdays: false,
    }, now);

    expect(result.rows).toEqual([
      expect.objectContaining({
        date: '2026-09-01',
        projectId: 'project-la-paz',
        projectName: 'Nuxio',
        workSeconds: 19_800,
        breakSeconds: 1_800,
        activeSeconds: 18_000,
        goalMinutes: 480,
        goalMet: false,
        hourlyRate: 5,
        rateSource: 'base',
        amountUsd: 25,
      }),
    ]);
    expect(result.totals).toEqual({
      days: 1,
      workSeconds: 19_800,
      breakSeconds: 1_800,
      activeSeconds: 18_000,
      amountUsd: 25,
    });
  });

  it('splits a segment that crosses local midnight into both days', async () => {
    const { service } = createService(
      [laPazProject],
      [session('session-1')],
      [segment('overnight', 'session-1', 'work', '2026-09-02T03:00:00.000Z', '2026-09-02T05:00:00.000Z')],
    );

    const result = await service.getHistory('user-id', {
      period: 'custom',
      startDate: '2026-09-01',
      endDate: '2026-09-02',
      onlyWeekdays: false,
    }, now);

    expect(result.rows.map((row) => [row.date, row.workSeconds])).toEqual([
      ['2026-09-02', 3_600],
      ['2026-09-01', 3_600],
    ]);
  });

  it('keeps historical base rates by date and calculates the monetary total', async () => {
    const { service } = createService(
      [laPazProject],
      [session('session-rates')],
      [
        segment('rate-day-1', 'session-rates', 'work', '2026-09-01T14:00:00.000Z', '2026-09-01T15:00:00.000Z'),
        segment('rate-day-2', 'session-rates', 'work', '2026-09-02T14:00:00.000Z', '2026-09-02T15:00:00.000Z'),
      ],
      [
        rate('rate-old', laPazProject.id, '5.00', '2026-08-01'),
        rate('rate-new', laPazProject.id, '7.00', '2026-09-02'),
      ],
    );

    const result = await service.getHistory('user-id', {
      period: 'custom',
      startDate: '2026-09-01',
      endDate: '2026-09-02',
      onlyWeekdays: false,
    }, now);

    expect(result.rows.map((row) => [row.date, row.hourlyRate, row.amountUsd])).toEqual([
      ['2026-09-02', 7, 7],
      ['2026-09-01', 5, 5],
    ]);
    expect(result.totals.amountUsd).toBe(12);
  });

  it('gives a daily override priority over the base rate', async () => {
    const { service } = createService(
      [laPazProject],
      [session('session-override')],
      [segment('override-day', 'session-override', 'work', '2026-09-01T14:00:00.000Z', '2026-09-01T15:00:00.000Z')],
      [rate('rate-base', laPazProject.id, '5.00', '2026-08-01')],
      [override('override-1', laPazProject.id, '7.25', '2026-09-01')],
    );

    const result = await service.getHistory('user-id', {
      period: 'custom',
      startDate: '2026-09-01',
      endDate: '2026-09-01',
      onlyWeekdays: false,
    }, now);

    expect(result.rows[0]).toEqual(
      expect.objectContaining({ hourlyRate: 7.25, rateSource: 'dailyOverride', amountUsd: 7.25 }),
    );
  });

  it('keeps zero distinct from an unconfigured rate and rounds to cents', async () => {
    const { service } = createService(
      [laPazProject],
      [session('session-zero')],
      [segment('zero-day', 'session-zero', 'work', '2026-09-01T14:00:00.000Z', '2026-09-01T14:01:00.000Z')],
      [rate('rate-zero', laPazProject.id, '0.00', '2026-08-01')],
    );

    const result = await service.getHistory('user-id', {
      period: 'custom',
      startDate: '2026-09-01',
      endDate: '2026-09-01',
      onlyWeekdays: false,
    }, now);

    expect(result.rows[0]).toEqual(
      expect.objectContaining({ hourlyRate: 0, rateSource: 'base', amountUsd: 0 }),
    );
    expect(result.totals.amountUsd).toBe(0);
  });

  it('rounds fractional hourly amounts to two cents', async () => {
    const { service } = createService(
      [laPazProject],
      [session('session-rounding')],
      [segment('rounding-day', 'session-rounding', 'work', '2026-09-01T14:00:00.000Z', '2026-09-01T14:01:00.000Z')],
      [rate('rate-rounding', laPazProject.id, '7.25', '2026-08-01')],
    );

    const result = await service.getHistory('user-id', {
      period: 'custom',
      startDate: '2026-09-01',
      endDate: '2026-09-01',
      onlyWeekdays: false,
    }, now);

    expect(result.rows[0]?.amountUsd).toBe(0.12);
    expect(result.totals.amountUsd).toBe(0.12);
  });

  it('excludes an unconfigured project from the monetary total', async () => {
    const { service, segments, rates } = createService(
      [laPazProject, madridProject],
      [session('la-session'), session('madrid-session')],
      [],
      [rate('rate-la-paz', laPazProject.id, '5.00', '2026-08-01')],
    );
    vi.mocked(segments.find).mockImplementation(async (options: any) => {
      const projectId = options.where.workSession.project.id;
      return [
        segment(
          `${projectId}-day`,
          `${projectId === laPazProject.id ? 'la' : 'madrid'}-session`,
          'work',
          '2026-09-01T14:00:00.000Z',
          '2026-09-01T15:00:00.000Z',
        ),
      ];
    });
    vi.mocked(rates.find).mockImplementation(async (options: any) => {
      const projectId = options.where.project.id;
      return projectId === laPazProject.id
        ? [rate('rate-la-paz', laPazProject.id, '5.00', '2026-08-01')]
        : [];
    });

    const result = await service.getHistory('user-id', {
      period: 'custom',
      startDate: '2026-09-01',
      endDate: '2026-09-01',
      onlyWeekdays: false,
    }, now);

    expect(result.rows.map((row) => [row.projectId, row.amountUsd])).toEqual([
      [madridProject.id, null],
      [laPazProject.id, 5],
    ]);
    expect(result.totals.amountUsd).toBe(5);
  });

  it('applies the current week and month calendar boundaries', async () => {
    const weekData = createService(
      [laPazProject],
      [session('session-week')],
      [
        segment('week-start', 'session-week', 'work', '2026-09-07T14:00:00.000Z', '2026-09-07T15:00:00.000Z'),
        segment('week-outside', 'session-week', 'work', '2026-09-06T14:00:00.000Z', '2026-09-06T15:00:00.000Z'),
      ],
    );
    const week = await weekData.service.getHistory('user-id', {
      period: 'week',
      onlyWeekdays: false,
    }, now);

    expect(week.rows.map((row) => row.date)).toEqual(['2026-09-07']);

    const monthData = createService(
      [laPazProject],
      [session('session-month')],
      [
        segment('month-start', 'session-month', 'work', '2026-09-01T14:00:00.000Z', '2026-09-01T15:00:00.000Z'),
        segment('month-outside', 'session-month', 'work', '2026-08-31T14:00:00.000Z', '2026-08-31T15:00:00.000Z'),
      ],
    );
    const month = await monthData.service.getHistory('user-id', {
      period: 'month',
      onlyWeekdays: false,
    }, new Date('2026-09-30T15:00:00.000Z'));

    expect(month.rows.map((row) => row.date)).toEqual(['2026-09-01']);
  });

  it('filters weekends and includes all days when disabled', async () => {
    const { service } = createService(
      [laPazProject],
      [session('session-days')],
      [
        segment('friday', 'session-days', 'work', '2026-09-04T14:00:00.000Z', '2026-09-04T15:00:00.000Z'),
        segment('saturday', 'session-days', 'work', '2026-09-05T14:00:00.000Z', '2026-09-05T15:00:00.000Z'),
        segment('sunday', 'session-days', 'work', '2026-09-06T14:00:00.000Z', '2026-09-06T15:00:00.000Z'),
      ],
    );

    const businessDays = await service.getHistory('user-id', {
      period: 'custom',
      startDate: '2026-09-04',
      endDate: '2026-09-06',
      onlyWeekdays: true,
    }, now);
    const allDays = await service.getHistory('user-id', {
      period: 'custom',
      startDate: '2026-09-04',
      endDate: '2026-09-06',
      onlyWeekdays: false,
    }, now);

    expect(businessDays.rows.map((row) => row.date)).toEqual(['2026-09-04']);
    expect(allDays.rows.map((row) => row.date)).toEqual([
      '2026-09-06',
      '2026-09-05',
      '2026-09-04',
    ]);
  });

  it('uses each project timezone for current calendar periods', async () => {
    const { service, segments } = createService(
      [laPazProject, madridProject],
      [session('la-session'), session('madrid-session')],
    );
    vi.mocked(segments.find).mockImplementation(async (options: any) => {
      const projectId = options.where.workSession.project.id;
      return projectId === laPazProject.id
        ? [segment('la-sunday', 'la-session', 'work', '2026-09-06T04:00:00.000Z', '2026-09-06T05:00:00.000Z')]
        : [segment('madrid-monday', 'madrid-session', 'work', '2026-09-06T23:00:00.000Z', '2026-09-07T00:00:00.000Z')];
    });

    const result = await service.getHistory(
      'user-id',
      { period: 'week', onlyWeekdays: false },
      new Date('2026-09-07T00:30:00.000Z'),
    );

    expect(result.rows.map((row) => [row.projectId, row.date])).toEqual([
      ['project-madrid', '2026-09-07'],
      ['project-la-paz', '2026-09-06'],
    ]);
  });

  it('returns an empty result for a period without records', async () => {
    const { service } = createService([laPazProject], [], []);

    await expect(
      service.getHistory('user-id', {
        period: 'custom',
        startDate: '2026-09-01',
        endDate: '2026-09-01',
        onlyWeekdays: false,
      }, now),
    ).resolves.toEqual({
      rows: [],
      totals: {
        days: 0,
        workSeconds: 0,
        breakSeconds: 0,
        activeSeconds: 0,
        amountUsd: null,
      },
    });
  });

  it('rejects invalid ranges and projects outside the owner', async () => {
    const { service, projects, sessions } = createService([laPazProject]);

    await expect(
      service.getHistory('user-id', {
        period: 'custom',
        startDate: '2026-09-02',
        endDate: '2026-09-01',
        onlyWeekdays: false,
      }, now),
    ).rejects.toMatchObject({ status: 400 });
    await expect(
      service.getHistory('user-id', {
        period: 'custom',
        startDate: '2026-02-30',
        endDate: '2026-03-01',
        onlyWeekdays: false,
      }, now),
    ).rejects.toMatchObject({ status: 400 });

    vi.mocked(projects.find).mockResolvedValue([]);
    await expect(
      service.getHistory('user-id', {
        period: 'month',
        projectId: 'other-project',
        onlyWeekdays: false,
      }, now),
    ).rejects.toMatchObject({ status: 404 });
    expect(sessions.find).not.toHaveBeenCalled();
  });
});
