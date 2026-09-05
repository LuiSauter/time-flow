import { getRepositoryToken } from '@nestjs/typeorm';
import { Test } from '@nestjs/testing';
import { DataSource, Repository } from 'typeorm';
import { ErrorCode } from '../common/errors/errors.js';
import { Project } from '../projects/project.entity.js';
import { TrackerSegment } from './tracker-segment.entity.js';
import { TrackerService } from './tracker.service.js';
import { WorkSession } from './work-session.entity.js';

const now = new Date('2026-09-07T15:00:00.000Z');
const project = {
  id: 'project-id',
  name: 'Nuxio',
  timeZone: 'America/La_Paz',
  dailyGoalMinutes: 480,
} as Project;

function session(
  id: string,
  startedAt: string,
  endedAt: string | null,
): WorkSession {
  return {
    id,
    startedAt: new Date(startedAt),
    endedAt: endedAt ? new Date(endedAt) : null,
  } as WorkSession;
}

function segment(
  id: string,
  workSessionId: string,
  kind: 'work' | 'break',
  startedAt: string,
  endedAt: string | null,
  label: string,
): TrackerSegment {
  return {
    id,
    workSession: { id: workSessionId } as WorkSession,
    kind,
    label,
    startedAt: new Date(startedAt),
    endedAt: endedAt ? new Date(endedAt) : null,
  } as TrackerSegment;
}

describe('TrackerService snapshot', () => {
  let service: TrackerService;
  let projects: Pick<Repository<Project>, 'findOne'>;
  let sessions: Pick<Repository<WorkSession>, 'find'>;
  let segments: Pick<Repository<TrackerSegment>, 'find'>;
  let dataSource: Pick<DataSource, 'transaction'>;

  beforeEach(async () => {
    projects = { findOne: vi.fn().mockResolvedValue(project) };
    sessions = {
      find: vi.fn().mockResolvedValue([
        session('session-today', '2026-09-07T14:00:00.000Z', null),
        session('session-friday', '2026-09-04T13:00:00.000Z', '2026-09-04T22:00:00.000Z'),
      ]),
    };
    segments = {
      find: vi.fn().mockResolvedValue([
        segment(
          'work-open',
          'session-today',
          'work',
          '2026-09-07T14:00:00.000Z',
          null,
          'Bloque 1',
        ),
        segment(
          'break-today',
          'session-today',
          'break',
          '2026-09-07T16:00:00.000Z',
          '2026-09-07T16:30:00.000Z',
          'Descanso 1',
        ),
        segment(
          'work-friday',
          'session-friday',
          'work',
          '2026-09-04T13:00:00.000Z',
          '2026-09-04T17:00:00.000Z',
          'Bloque viernes',
        ),
        segment(
          'break-friday',
          'session-friday',
          'break',
          '2026-09-04T17:00:00.000Z',
          '2026-09-04T18:00:00.000Z',
          'Descanso viernes',
        ),
        segment(
          'work-friday-2',
          'session-friday',
          'work',
          '2026-09-04T18:00:00.000Z',
          '2026-09-04T22:00:00.000Z',
          'Bloque viernes 2',
        ),
      ]),
    };
    const transactionProjectRepository = {
      findOne: vi.fn().mockResolvedValue(project),
    };
    const transactionSessionRepository = {
      findOne: vi.fn().mockResolvedValue(null),
      create: vi.fn((data) => data as WorkSession),
      save: vi.fn((value) => Promise.resolve({ id: 'created-session', ...value } as WorkSession)),
    };
    const transactionSegmentRepository = {
      create: vi.fn((data) => data as TrackerSegment),
      save: vi.fn((value) => Promise.resolve({ id: 'created-segment', ...value } as TrackerSegment)),
    };
    const manager = {
      getRepository: vi.fn((entity) =>
        entity === Project
          ? transactionProjectRepository
          : entity === WorkSession
            ? transactionSessionRepository
            : transactionSegmentRepository,
      ),
    };
    dataSource = {
      transaction: vi.fn(async (callback) => callback(manager as never)),
    };

    const module = await Test.createTestingModule({
      providers: [
        TrackerService,
        { provide: getRepositoryToken(Project), useValue: projects },
        { provide: getRepositoryToken(WorkSession), useValue: sessions },
        { provide: getRepositoryToken(TrackerSegment), useValue: segments },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    service = module.get(TrackerService);
  });

  it('returns the current state, today segments and active metrics', async () => {
    const snapshot = await service.getSnapshot('user-id', 'project-id', 'all', now);

    expect(snapshot.status).toBe('WORKING');
    expect(snapshot.segments.map(({ id }) => id)).toEqual(['work-open', 'break-today']);
    expect(snapshot.metrics).toMatchObject({
      activeSeconds: 3600,
      workSeconds: 3600,
      breakSeconds: 0,
      dailyGoalMinutes: 480,
    });
    expect(snapshot.previousDay).toMatchObject({
      date: '2026-09-06',
      activeSeconds: 0,
      goalMet: false,
    });
  });

  it('uses the previous business day for the business scope', async () => {
    const snapshot = await service.getSnapshot('user-id', 'project-id', 'business', now);

    expect(snapshot.previousDay).toMatchObject({
      date: '2026-09-04',
      activeSeconds: 25200,
      breakSeconds: 3600,
      goalMet: false,
    });
  });

  it('rejects a project that is not owned by the user', async () => {
    vi.mocked(projects.findOne).mockResolvedValue(null);

    await expect(
      service.getSnapshot('user-id', 'other-project', 'all', now),
    ).rejects.toMatchObject({ status: 404, code: ErrorCode.NOT_FOUND });
    expect(sessions.find).not.toHaveBeenCalled();
  });

  it('opens a realtime journey and its first work segment transactionally', async () => {
    const snapshot = await service.startWork(
      'user-id',
      'project-id',
      new Date('2026-09-07T15:00:00.000Z'),
    );

    expect(dataSource.transaction).toHaveBeenCalledOnce();
    expect(snapshot.status).toBe('WORKING');
    expect(snapshot.openSessionId).toBe('session-today');
  });

  it('does not create another journey when one is already open', async () => {
    const transactionSessionRepository = {
      findOne: vi.fn().mockResolvedValue(session('existing', '2026-09-07T14:00:00.000Z', null)),
      create: vi.fn(),
      save: vi.fn(),
    };
    vi.mocked(dataSource.transaction).mockImplementationOnce(async (callback) =>
      callback({
        getRepository: vi.fn((entity) =>
          entity === Project
            ? { findOne: vi.fn().mockResolvedValue(project) }
            : entity === WorkSession
              ? transactionSessionRepository
              : { create: vi.fn(), save: vi.fn() },
        ),
      } as never),
    );

    await service.startWork('user-id', 'project-id', now);

    expect(transactionSessionRepository.create).not.toHaveBeenCalled();
    expect(transactionSessionRepository.save).not.toHaveBeenCalled();
  });

  it('returns the existing snapshot when the database rejects a concurrent open journey', async () => {
    vi.mocked(dataSource.transaction).mockRejectedValueOnce({
      driverError: { constraint: 'uq_work_sessions_open_per_user_project' },
    });

    const snapshot = await service.startWork('user-id', 'project-id', now);

    expect(snapshot.status).toBe('WORKING');
  });
});
