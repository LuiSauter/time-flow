import { DataSource } from 'typeorm';
import { ErrorCode } from '../common/errors/errors.js';
import { Project } from '../projects/project.entity.js';
import { CreateManualEntryDto } from './dto/create-manual-entry.dto.js';
import { TrackerService } from './tracker.service.js';
import { WorkSession } from './work-session.entity.js';

const project = {
  id: 'project-id',
  name: 'Nuxio',
  timeZone: 'America/La_Paz',
  dailyGoalMinutes: 480,
} as Project;
const now = new Date('2026-09-06T02:00:00.000Z');
const input: CreateManualEntryDto = {
  date: '2026-09-05',
  startTime: '15:30',
  endTime: '16:15',
};

function createService(existingSessions: WorkSession[] = []) {
  const projectRepository = { findOne: vi.fn().mockResolvedValue(project) };
  const sessionRepository = {
    find: vi.fn().mockResolvedValue(existingSessions),
    create: vi.fn((value) => value),
    save: vi.fn((value) => Promise.resolve({ id: 'manual-session', ...value })),
  };
  const segmentRepository = {
    create: vi.fn((value) => value),
    save: vi.fn((value) => Promise.resolve(value)),
  };
  const manager = {
    getRepository: vi.fn((entity) =>
      entity === Project
        ? projectRepository
        : entity === WorkSession
          ? sessionRepository
          : segmentRepository,
    ),
  };
  const dataSource = {
    transaction: vi.fn(async (callback) => callback(manager as never)),
  } as unknown as DataSource;
  const projects = { findOne: vi.fn().mockResolvedValue(project) };
  const sessions = { find: vi.fn().mockResolvedValue(existingSessions) };
  const segments = { find: vi.fn().mockResolvedValue([]) };
  const service = new TrackerService(
    dataSource,
    projects as never,
    sessions as never,
    segments as never,
  );
  vi.spyOn(service, 'getSnapshot').mockResolvedValue({ status: 'IDLE' } as never);

  return { service, sessionRepository, segmentRepository };
}

describe('TrackerService manual entries', () => {
  it('persists a closed manual work session and segment', async () => {
    const { service, sessionRepository, segmentRepository } = createService();

    await service.addManualEntry('user-id', 'project-id', input, now);

    expect(sessionRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        origin: 'manual',
        startedAt: new Date('2026-09-05T19:30:00.000Z'),
        endedAt: new Date('2026-09-05T20:15:00.000Z'),
      }),
    );
    expect(segmentRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'work', endedAt: new Date('2026-09-05T20:15:00.000Z') }),
    );
  });

  it('rejects an invalid range', async () => {
    const { service } = createService();

    await expect(
      service.addManualEntry(
        'user-id',
        'project-id',
        { ...input, endTime: '15:30' },
        now,
      ),
    ).rejects.toMatchObject({ status: 400, code: ErrorCode.BAD_REQUEST });
  });

  it('rejects a future manual end', async () => {
    const { service } = createService();

    await expect(
      service.addManualEntry(
        'user-id',
        'project-id',
        { ...input, date: '2026-09-06' },
        now,
      ),
    ).rejects.toMatchObject({ status: 400, code: ErrorCode.BAD_REQUEST });
  });

  it.each([
    ['partial', new Date('2026-09-05T19:00:00.000Z'), new Date('2026-09-05T19:45:00.000Z')],
    ['total', new Date('2026-09-05T19:30:00.000Z'), new Date('2026-09-05T20:15:00.000Z')],
  ])('rejects a %s overlap with an existing session', async (_label, startedAt, endedAt) => {
    const { service } = createService([{ startedAt, endedAt } as WorkSession]);

    await expect(
      service.addManualEntry('user-id', 'project-id', input, now),
    ).rejects.toMatchObject({ status: 409, code: ErrorCode.CONFLICT });
  });
});
