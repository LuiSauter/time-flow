import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, IsNull, Repository } from 'typeorm';
import type { EntityManager } from 'typeorm';
import { AppError, ErrorCode } from '../common/errors/errors.js';
import { Project } from '../projects/project.entity.js';
import { TrackerSegment } from './tracker-segment.entity.js';
import { WorkSession } from './work-session.entity.js';
import { CreateManualEntryDto } from './dto/create-manual-entry.dto.js';

export type TrackerScope = 'all' | 'business';

export type TrackerSnapshot = {
  project: {
    id: string;
    name: string;
    timeZone: string;
    dailyGoalMinutes: number;
  };
  status: 'IDLE' | 'WORKING' | 'PAUSED';
  openSessionId: string | null;
  segments: Array<{
    id: string;
    kind: 'work' | 'break';
    label: string;
    start: string;
    end: string | null;
  }>;
  metrics: TrackerMetrics;
  previousDay: TrackerDaySummary;
};

type TrackerMetrics = {
  activeSeconds: number;
  workSeconds: number;
  breakSeconds: number;
  dailyGoalMinutes: number;
  goalMet: boolean;
};

type TrackerDaySummary = TrackerMetrics & { date: string };

export class TrackerService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Project)
    private readonly projects: Repository<Project>,
    @InjectRepository(WorkSession)
    private readonly sessions: Repository<WorkSession>,
    @InjectRepository(TrackerSegment)
    private readonly segments: Repository<TrackerSegment>,
  ) {}

  async startWork(
    userId: string,
    projectId: string,
    at = new Date(),
  ): Promise<TrackerSnapshot> {
    try {
      await this.dataSource.transaction(async (manager) => {
        const project = await manager.getRepository(Project).findOne({
          where: { id: projectId, user: { id: userId } },
        });
        if (!project) {
          throw new AppError({
            statusCode: 404,
            code: ErrorCode.NOT_FOUND,
            message: 'El proyecto no existe',
          });
        }

        const sessions = manager.getRepository(WorkSession);
        const openSession = await sessions.findOne({
          where: {
            user: { id: userId },
            project: { id: projectId },
            endedAt: IsNull(),
          },
          lock: { mode: 'pessimistic_write' },
        });
        if (openSession) return;

        const createdSession = await sessions.save(
          sessions.create({
            user: { id: userId },
            project: { id: projectId },
            origin: 'realtime',
            label: 'Jornada actual',
            startedAt: at,
            endedAt: null,
          }),
        );
        const trackerSegments = manager.getRepository(TrackerSegment);
        await trackerSegments.save(
          trackerSegments.create({
            workSession: createdSession,
            kind: 'work',
            label: 'Bloque 1',
            startedAt: at,
            endedAt: null,
          }),
        );
      });
    } catch (error) {
      if (!isOpenSessionConflict(error)) throw error;
    }

    return this.getSnapshot(userId, projectId, 'all', at);
  }

  async startBreak(
    userId: string,
    projectId: string,
    at = new Date(),
  ): Promise<TrackerSnapshot> {
    await this.dataSource.transaction(async (manager) => {
      const session = await this.requireOpenSession(manager, userId, projectId);
      const trackerSegments = manager.getRepository(TrackerSegment);
      const openSegment = await this.requireOpenSegment(
        trackerSegments,
        session.id,
        'work',
      );

      openSegment.endedAt = at;
      await trackerSegments.save(openSegment);
      await trackerSegments.save(
        trackerSegments.create({
          workSession: session,
          kind: 'break',
          label: 'Descanso actual',
          startedAt: at,
          endedAt: null,
        }),
      );
    });

    return this.getSnapshot(userId, projectId, 'all', at);
  }

  async resumeWork(
    userId: string,
    projectId: string,
    at = new Date(),
  ): Promise<TrackerSnapshot> {
    await this.dataSource.transaction(async (manager) => {
      const session = await this.requireOpenSession(manager, userId, projectId);
      const trackerSegments = manager.getRepository(TrackerSegment);
      const openSegment = await this.requireOpenSegment(
        trackerSegments,
        session.id,
        'break',
      );

      openSegment.endedAt = at;
      await trackerSegments.save(openSegment);
      await trackerSegments.save(
        trackerSegments.create({
          workSession: session,
          kind: 'work',
          label: 'Trabajo actual',
          startedAt: at,
          endedAt: null,
        }),
      );
    });

    return this.getSnapshot(userId, projectId, 'all', at);
  }

  async finishDay(
    userId: string,
    projectId: string,
    at = new Date(),
  ): Promise<TrackerSnapshot> {
    await this.dataSource.transaction(async (manager) => {
      const session = await this.requireOpenSession(manager, userId, projectId);
      const trackerSegments = manager.getRepository(TrackerSegment);
      const openSegment = await this.requireOpenSegment(
        trackerSegments,
        session.id,
      );

      openSegment.endedAt = at;
      await trackerSegments.save(openSegment);
      session.endedAt = at;
      await manager.getRepository(WorkSession).save(session);
    });

    return this.getSnapshot(userId, projectId, 'all', at);
  }

  async addManualEntry(
    userId: string,
    projectId: string,
    input: CreateManualEntryDto,
    now = new Date(),
  ): Promise<TrackerSnapshot> {
    await this.dataSource.transaction(async (manager) => {
      const project = await manager.getRepository(Project).findOne({
        where: { id: projectId, user: { id: userId } },
      });
      if (!project) {
        throw new AppError({
          statusCode: 404,
          code: ErrorCode.NOT_FOUND,
          message: 'El proyecto no existe',
        });
      }

      const startedAt = localDateTime(input.date, input.startTime, project.timeZone);
      const endedAt = localDateTime(input.date, input.endTime, project.timeZone);
      if (!startedAt || !endedAt || endedAt <= startedAt) {
        throw new AppError({
          statusCode: 400,
          code: ErrorCode.BAD_REQUEST,
          message: 'El rango de horas no es válido',
        });
      }
      if (endedAt > now) {
        throw new AppError({
          statusCode: 400,
          code: ErrorCode.BAD_REQUEST,
          message: 'No se permiten registros futuros',
        });
      }

      const existingSessions = await manager.getRepository(WorkSession).find({
        where: { user: { id: userId }, project: { id: projectId } },
      });
      const overlapsExisting = existingSessions.some((session) => {
        const existingStart = session.startedAt.getTime();
        const existingEnd = session.endedAt?.getTime() ?? now.getTime();
        return (
          startedAt.getTime() < existingEnd && endedAt.getTime() > existingStart
        );
      });
      if (overlapsExisting) {
        throw new AppError({
          statusCode: 409,
          code: ErrorCode.CONFLICT,
          message: 'El registro manual se solapa con una jornada existente',
        });
      }

      const sessions = manager.getRepository(WorkSession);
      const createdSession = await sessions.save(
        sessions.create({
          user: { id: userId },
          project: { id: projectId },
          origin: 'manual',
          label: 'Bloque manual',
          startedAt,
          endedAt,
        }),
      );
      const trackerSegments = manager.getRepository(TrackerSegment);
      await trackerSegments.save(
        trackerSegments.create({
          workSession: createdSession,
          kind: 'work',
          label: 'Bloque manual',
          startedAt,
          endedAt,
        }),
      );
    });

    return this.getSnapshot(userId, projectId, 'all', now);
  }

  private async requireOpenSession(
    manager: EntityManager,
    userId: string,
    projectId: string,
  ) {
    const project = await manager.getRepository(Project).findOne({
      where: { id: projectId, user: { id: userId } },
    });
    if (!project) {
      throw new AppError({
        statusCode: 404,
        code: ErrorCode.NOT_FOUND,
        message: 'El proyecto no existe',
      });
    }

    const session = await manager.getRepository(WorkSession).findOne({
      where: {
        user: { id: userId },
        project: { id: projectId },
        endedAt: IsNull(),
      },
      lock: { mode: 'pessimistic_write' },
    });
    if (!session) {
      throw new AppError({
        statusCode: 409,
        code: ErrorCode.CONFLICT,
        message: 'No hay una jornada activa',
      });
    }
    return session;
  }

  private async requireOpenSegment(
    repository: Repository<TrackerSegment>,
    sessionId: string,
    expectedKind?: 'work' | 'break',
  ) {
    const segment = await repository.findOne({
      where: { workSession: { id: sessionId }, endedAt: IsNull() },
      lock: { mode: 'pessimistic_write' },
    });
    if (!segment || (expectedKind && segment.kind !== expectedKind)) {
      throw new AppError({
        statusCode: 409,
        code: ErrorCode.CONFLICT,
        message: 'La transición no es válida para el estado actual',
      });
    }
    return segment;
  }

  async getSnapshot(
    userId: string,
    projectId: string,
    scope: TrackerScope = 'all',
    now = new Date(),
  ): Promise<TrackerSnapshot> {
    const project = await this.projects.findOne({
      where: { id: projectId, user: { id: userId } },
    });

    if (!project) {
      throw new AppError({
        statusCode: 404,
        code: ErrorCode.NOT_FOUND,
        message: 'El proyecto no existe',
      });
    }

    const sessions = await this.sessions.find({
      where: { user: { id: userId }, project: { id: projectId } },
      order: { startedAt: 'ASC' },
    });
    const segments = sessions.length
      ? await this.segments.find({
          where: {
            workSession: {
              user: { id: userId },
              project: { id: projectId },
            },
          },
          relations: { workSession: true },
          order: { startedAt: 'ASC' },
        })
      : [];

    const today = dateKey(now, project.timeZone);
    const previousDate = previousDay(today, scope);
    const todayBounds = dayBounds(today, project.timeZone);
    const previousBounds = dayBounds(previousDate, project.timeZone);
    const metrics = metricsForDay(
      segments,
      todayBounds,
      now.getTime(),
      project.dailyGoalMinutes,
    );
    const previousMetrics = metricsForDay(
      segments,
      previousBounds,
      now.getTime(),
      project.dailyGoalMinutes,
    );
    const todaySegments = segments
      .filter((segment) => overlaps(segment, todayBounds, now.getTime()))
      .map(toSnapshotSegment);
    const openSession = sessions.find((session) => session.endedAt === null);
    const openSegment = segments.find(
      (segment) => segment.endedAt === null && segment.workSession.id === openSession?.id,
    );

    return {
      project: {
        id: project.id,
        name: project.name,
        timeZone: project.timeZone,
        dailyGoalMinutes: project.dailyGoalMinutes,
      },
      status: openSegment?.kind === 'work'
        ? 'WORKING'
        : openSegment?.kind === 'break'
          ? 'PAUSED'
          : 'IDLE',
      openSessionId: openSession?.id ?? null,
      segments: todaySegments,
      metrics,
      previousDay: { date: previousDate, ...previousMetrics },
    };
  }
}

function metricsForDay(
  segments: TrackerSegment[],
  bounds: { start: number; end: number },
  now: number,
  dailyGoalMinutes: number,
): TrackerMetrics {
  let workSeconds = 0;
  let breakSeconds = 0;

  for (const segment of segments) {
    const seconds = overlapSeconds(segment, bounds, now);
    if (segment.kind === 'work') workSeconds += seconds;
    else breakSeconds += seconds;
  }

  const activeSeconds = Math.max(0, workSeconds - breakSeconds);
  return {
    activeSeconds,
    workSeconds,
    breakSeconds,
    dailyGoalMinutes,
    goalMet: activeSeconds >= dailyGoalMinutes * 60,
  };
}

function overlaps(
  segment: TrackerSegment,
  bounds: { start: number; end: number },
  now: number,
) {
  const start = segment.startedAt.getTime();
  const end = Math.min(segment.endedAt?.getTime() ?? now, now);
  return start < bounds.end && end > bounds.start;
}

function overlapSeconds(
  segment: TrackerSegment,
  bounds: { start: number; end: number },
  now: number,
) {
  if (!overlaps(segment, bounds, now)) return 0;
  const start = Math.max(segment.startedAt.getTime(), bounds.start);
  const end = Math.min(segment.endedAt?.getTime() ?? now, now, bounds.end);
  return Math.max(0, (end - start) / 1000);
}

function toSnapshotSegment(segment: TrackerSegment) {
  return {
    id: segment.id,
    kind: segment.kind,
    label: segment.label,
    start: segment.startedAt.toISOString(),
    end: segment.endedAt?.toISOString() ?? null,
  };
}

function isOpenSessionConflict(error: unknown) {
  if (typeof error !== 'object' || error === null || !('driverError' in error)) {
    return false;
  }
  const driverError = error.driverError;
  return (
    typeof driverError === 'object' &&
    driverError !== null &&
    'constraint' in driverError &&
    driverError.constraint === 'uq_work_sessions_open_per_user_project'
  );
}

function localDateTime(date: string, time: string, timeZone: string) {
  const dateParts = date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const timeParts = time.match(/^(\d{2}):(\d{2})$/);
  if (!dateParts || !timeParts) return null;

  const year = Number(dateParts[1]);
  const month = Number(dateParts[2]);
  const day = Number(dateParts[3]);
  const hour = Number(timeParts[1]);
  const minute = Number(timeParts[2]);
  if (
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > new Date(Date.UTC(year, month, 0)).getUTCDate() ||
    hour > 23 ||
    minute > 59
  ) {
    return null;
  }

  const localAsUtc = Date.UTC(year, month - 1, day, hour, minute);
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
  return new Date(estimate);
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

function previousDay(date: string, scope: TrackerScope) {
  let candidate = shiftDate(date, -1);
  if (scope === 'business') {
    while (!isBusinessDay(candidate)) candidate = shiftDate(candidate, -1);
  }
  return candidate;
}

function isBusinessDay(date: string) {
  const [year, month, day] = date.split('-').map(Number);
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
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
  return { start: zonedMidnight(date, timeZone), end: zonedMidnight(shiftDate(date, 1), timeZone) };
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
