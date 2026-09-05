import { InjectRepository } from '@nestjs/typeorm';
import { Between, LessThanOrEqual, Repository } from 'typeorm';
import { AppError, ErrorCode } from '../common/errors/errors.js';
import { ProjectDailyRateOverride } from '../projects/project-daily-rate-override.entity.js';
import { Project } from '../projects/project.entity.js';
import { ProjectRate } from '../projects/project-rate.entity.js';
import { TrackerSegment } from './tracker-segment.entity.js';
import { WorkSession } from './work-session.entity.js';
import { HistoryQueryDto, type HistoryPeriod } from './dto/history-query.dto.js';

type HistoryRow = {
  date: string;
  projectId: string;
  projectName: string;
  workSeconds: number;
  breakSeconds: number;
  activeSeconds: number;
  goalMinutes: number;
  goalMet: boolean;
  hourlyRate: number | null;
  rateSource: 'base' | 'dailyOverride' | null;
  amountUsd: number | null;
};

type HistoryResult = {
  rows: HistoryRow[];
  totals: {
    days: number;
    workSeconds: number;
    breakSeconds: number;
    activeSeconds: number;
    amountUsd: number | null;
  };
};

export class HistoryService {
  constructor(
    @InjectRepository(Project)
    private readonly projects: Repository<Project>,
    @InjectRepository(WorkSession)
    private readonly sessions: Repository<WorkSession>,
    @InjectRepository(TrackerSegment)
    private readonly segments: Repository<TrackerSegment>,
    @InjectRepository(ProjectRate)
    private readonly rates: Repository<ProjectRate>,
    @InjectRepository(ProjectDailyRateOverride)
    private readonly dailyRateOverrides: Repository<ProjectDailyRateOverride>,
  ) {}

  async getHistory(
    userId: string,
    query: HistoryQueryDto,
    now = new Date(),
  ): Promise<HistoryResult> {
    const normalized = normalizeQuery(query);
    const projects = await this.projects.find({
      where: { user: { id: userId } },
      order: { createdAt: 'ASC' },
    });
    const selectedProjects = normalized.projectId
      ? projects.filter((project) => project.id === normalized.projectId)
      : projects;

    if (normalized.projectId && selectedProjects.length === 0) {
      throw new AppError({
        statusCode: 404,
        code: ErrorCode.NOT_FOUND,
        message: 'El proyecto no existe',
      });
    }

    const rows = (
      await Promise.all(
        selectedProjects.map((project) =>
          this.rowsForProject(userId, project, normalized, now),
        ),
      )
    )
      .flat()
      .sort((left, right) =>
        right.date.localeCompare(left.date) || left.projectName.localeCompare(right.projectName),
      );

    return {
      rows,
      totals: {
        days: rows.length,
        workSeconds: rows.reduce((total, row) => total + row.workSeconds, 0),
        breakSeconds: rows.reduce((total, row) => total + row.breakSeconds, 0),
        activeSeconds: rows.reduce((total, row) => total + row.activeSeconds, 0),
        amountUsd: sumAmounts(rows),
      },
    };
  }

  private async rowsForProject(
    userId: string,
    project: Project,
    query: NormalizedHistoryQuery,
    now: Date,
  ): Promise<HistoryRow[]> {
    const range = resolveRange(query, project.timeZone, now);
    const sessions = await this.sessions.find({
      where: { user: { id: userId }, project: { id: project.id } },
      order: { startedAt: 'ASC' },
    });
    if (sessions.length === 0) return [];

    const [segments, rates, dailyRateOverrides] = await Promise.all([
      this.segments.find({
        where: {
          workSession: {
            user: { id: userId },
            project: { id: project.id },
          },
        },
        relations: { workSession: true },
        order: { startedAt: 'ASC' },
      }),
      this.rates.find({
        where: {
          project: { id: project.id },
          effectiveFrom: LessThanOrEqual(range.end),
        },
        order: { effectiveFrom: 'ASC' },
      }),
      this.dailyRateOverrides.find({
        where: {
          project: { id: project.id },
          overrideDate: Between(range.start, range.end),
        },
        order: { overrideDate: 'ASC' },
      }),
    ]);
    const rows: HistoryRow[] = [];

    for (let date = range.start; date <= range.end; date = shiftDate(date, 1)) {
      if (query.onlyWeekdays && !isBusinessDay(date)) continue;
      const bounds = dayBounds(date, project.timeZone);
      let workSeconds = 0;
      let breakSeconds = 0;

      for (const segment of segments) {
        const seconds = overlapSeconds(segment, bounds, now.getTime());
        if (segment.kind === 'work') workSeconds += seconds;
        else breakSeconds += seconds;
      }

      if (workSeconds === 0 && breakSeconds === 0) continue;
      const activeSeconds = Math.max(0, workSeconds - breakSeconds);
      const appliedRate = resolveApplicableRate(date, rates, dailyRateOverrides);
      rows.push({
        date,
        projectId: project.id,
        projectName: project.name,
        workSeconds,
        breakSeconds,
        activeSeconds,
        goalMinutes: project.dailyGoalMinutes,
        goalMet: activeSeconds >= project.dailyGoalMinutes * 60,
        hourlyRate: appliedRate?.hourlyRate ?? null,
        rateSource: appliedRate?.source ?? null,
        amountUsd: appliedRate ? amountFor(activeSeconds, appliedRate.hourlyRate) : null,
      });
    }

    return rows;
  }
}

type AppliedRate = {
  hourlyRate: number;
  source: 'base' | 'dailyOverride';
};

function resolveApplicableRate(
  date: string,
  rates: ProjectRate[],
  dailyRateOverrides: ProjectDailyRateOverride[],
): AppliedRate | null {
  const dailyOverride = dailyRateOverrides.find((rate) => rate.overrideDate === date);
  if (dailyOverride) {
    return { hourlyRate: Number(dailyOverride.hourlyRate), source: 'dailyOverride' };
  }

  const baseRate = [...rates]
    .reverse()
    .find((rate) => rate.effectiveFrom <= date);
  return baseRate
    ? { hourlyRate: Number(baseRate.hourlyRate), source: 'base' }
    : null;
}

function amountFor(activeSeconds: number, hourlyRate: number) {
  const rateCents = Math.round(hourlyRate * 100);
  return Math.round((activeSeconds * rateCents) / 3600) / 100;
}

function sumAmounts(rows: HistoryRow[]) {
  const amounts = rows
    .map((row) => row.amountUsd)
    .filter((amount): amount is number => amount !== null);
  if (amounts.length === 0) return null;
  return Math.round(amounts.reduce((total, amount) => total + amount, 0) * 100) / 100;
}

type NormalizedHistoryQuery = {
  period: HistoryPeriod;
  startDate?: string;
  endDate?: string;
  onlyWeekdays: boolean;
  projectId?: string;
};

function normalizeQuery(query: HistoryQueryDto): NormalizedHistoryQuery {
  const period = query.period ?? 'month';
  if (period !== 'week' && period !== 'month' && period !== 'custom') {
    throw invalidQuery('El período no es válido');
  }
  if (query.projectId !== undefined && !query.projectId.trim()) {
    throw invalidQuery('El proyecto no es válido');
  }
  if (period === 'custom') {
    if (!query.startDate || !query.endDate || !isDateKey(query.startDate) || !isDateKey(query.endDate)) {
      throw invalidQuery('El rango de fechas no es válido');
    }
    if (query.startDate > query.endDate) {
      throw invalidQuery('La fecha de inicio debe ser anterior o igual a la fecha de fin');
    }
  }

  return {
    period,
    startDate: query.startDate,
    endDate: query.endDate,
    onlyWeekdays: parseOnlyWeekdays(query.onlyWeekdays),
    projectId: query.projectId,
  };
}

function parseOnlyWeekdays(value: boolean | string | undefined) {
  if (value === undefined || value === true || value === 'true') return true;
  if (value === false || value === 'false') return false;
  throw invalidQuery('El filtro de días hábiles no es válido');
}

function resolveRange(
  query: NormalizedHistoryQuery,
  timeZone: string,
  now: Date,
): { start: string; end: string } {
  if (query.period === 'custom') {
    return { start: query.startDate!, end: query.endDate! };
  }

  const today = dateKey(now, timeZone);
  if (query.period === 'month') {
    const [year, month] = today.split('-') as [string, string];
    const first = `${year}-${month}-01`;
    const last = new Date(Date.UTC(Number(year), Number(month), 0)).getUTCDate();
    return { start: first, end: shiftDate(first, last - 1) };
  }

  const weekday = weekdayOf(today);
  const start = shiftDate(today, weekday === 0 ? -6 : 1 - weekday);
  return { start, end: shiftDate(start, 6) };
}

function invalidQuery(message: string) {
  return new AppError({
    statusCode: 400,
    code: ErrorCode.BAD_REQUEST,
    message,
  });
}

function dateKey(value: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(value);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function weekdayOf(date: string) {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

function isBusinessDay(date: string) {
  const weekday = weekdayOf(date);
  return weekday >= 1 && weekday <= 5;
}

function shiftDate(date: string, amount: number) {
  const [year, month, day] = date.split('-').map(Number);
  const shifted = new Date(Date.UTC(year, month - 1, day + amount));
  return [
    shifted.getUTCFullYear(),
    String(shifted.getUTCMonth() + 1).padStart(2, '0'),
    String(shifted.getUTCDate()).padStart(2, '0'),
  ].join('-');
}

function dayBounds(date: string, timeZone: string) {
  return {
    start: zonedMidnight(date, timeZone),
    end: zonedMidnight(shiftDate(date, 1), timeZone),
  };
}

function zonedMidnight(date: string, timeZone: string) {
  const [year, month, day] = date.split('-').map(Number);
  const localAsUtc = Date.UTC(year, month - 1, day);
  let estimate = localAsUtc;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(new Date(estimate));
    const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
    const renderedAsUtc = Date.UTC(
      Number(values.year),
      Number(values.month) - 1,
      Number(values.day),
      Number(values.hour),
      Number(values.minute),
      Number(values.second),
    );
    estimate = localAsUtc - (renderedAsUtc - estimate);
  }

  return estimate;
}

function overlapSeconds(
  segment: TrackerSegment,
  bounds: { start: number; end: number },
  now: number,
) {
  const segmentStart = segment.startedAt.getTime();
  const segmentEnd = Math.min(segment.endedAt?.getTime() ?? now, now);
  const start = Math.max(segmentStart, bounds.start);
  const end = Math.min(segmentEnd, bounds.end);
  return Math.max(0, (end - start) / 1000);
}

function isDateKey(value: string) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}
