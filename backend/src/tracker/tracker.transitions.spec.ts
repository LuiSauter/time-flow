import { DataSource } from 'typeorm';
import { Project } from '../projects/project.entity.js';
import { TrackerSegment } from './tracker-segment.entity.js';
import { TrackerService } from './tracker.service.js';
import { WorkSession } from './work-session.entity.js';

const project = { id: 'project-id', timeZone: 'America/La_Paz' } as Project;
const at = new Date('2026-09-07T16:00:00.000Z');

function createService(state: {
  session?: WorkSession;
  segment?: TrackerSegment;
}) {
  const projectRepository = {
    findOne: vi.fn().mockResolvedValue(project),
  };
  const sessionRepository = {
    findOne: vi.fn().mockResolvedValue(state.session ?? null),
    save: vi.fn((value) => Promise.resolve(value)),
  };
  const segmentRepository = {
    findOne: vi.fn().mockResolvedValue(state.segment ?? null),
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
  const sessions = { find: vi.fn().mockResolvedValue([]) };
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

describe('TrackerService transitions', () => {
  it('closes work and opens a break', async () => {
    const session = { id: 'session-id', endedAt: null } as WorkSession;
    const work = {
      id: 'work-id',
      kind: 'work',
      workSession: session,
      endedAt: null,
    } as TrackerSegment;
    const { service, sessionRepository, segmentRepository } = createService({
      session,
      segment: work,
    });

    await service.startBreak('user-id', 'project-id', at);

    expect(segmentRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'work-id', endedAt: at }),
    );
    expect(segmentRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        workSession: session,
        kind: 'break',
        endedAt: null,
        startedAt: at,
      }),
    );
    expect(sessionRepository.save).not.toHaveBeenCalled();
  });

  it('closes a break and opens work when resuming', async () => {
    const session = { id: 'session-id', endedAt: null } as WorkSession;
    const pause = {
      id: 'break-id',
      kind: 'break',
      workSession: session,
      endedAt: null,
    } as TrackerSegment;
    const { service, segmentRepository } = createService({
      session,
      segment: pause,
    });

    await service.resumeWork('user-id', 'project-id', at);

    expect(segmentRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'break-id', endedAt: at }),
    );
    expect(segmentRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        workSession: session,
        kind: 'work',
        endedAt: null,
        startedAt: at,
      }),
    );
  });

  it.each(['work', 'break'] as const)('finishes a journey from %s', async (kind) => {
    const session = { id: 'session-id', endedAt: null } as WorkSession;
    const openSegment = {
      id: `${kind}-id`,
      kind,
      workSession: session,
      endedAt: null,
    } as TrackerSegment;
    const { service, sessionRepository, segmentRepository } = createService({
      session,
      segment: openSegment,
    });

    await service.finishDay('user-id', 'project-id', at);

    expect(segmentRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ endedAt: at }),
    );
    expect(sessionRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'session-id', endedAt: at }),
    );
  });

  it('rejects a transition when there is no active journey', async () => {
    const { service } = createService({});

    await expect(
      service.startBreak('user-id', 'project-id', at),
    ).rejects.toMatchObject({ status: 409 });
  });
});
