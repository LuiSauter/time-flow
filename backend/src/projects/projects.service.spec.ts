import { getRepositoryToken } from '@nestjs/typeorm';
import { Test } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { ErrorCode } from '../common/errors/errors.js';
import { ProjectDailyRateOverride } from './project-daily-rate-override.entity.js';
import { Project } from './project.entity.js';
import { ProjectRate } from './project-rate.entity.js';
import { ProjectsService } from './projects.service.js';

describe('ProjectsService', () => {
  let service: ProjectsService;
  let repository: Pick<Repository<Project>, 'find' | 'findOne' | 'create' | 'save'>;
  let rates: Pick<Repository<ProjectRate>, 'findOne' | 'create' | 'save'>;
  let overrides: Pick<Repository<ProjectDailyRateOverride>, 'findOne' | 'create' | 'save'>;

  beforeEach(async () => {
    repository = {
      find: vi.fn().mockResolvedValue([]),
      findOne: vi.fn().mockResolvedValue({
        id: 'project-id',
        timeZone: 'America/La_Paz',
      } as Project),
      create: vi.fn((data) => data as Project),
      save: vi.fn((project) =>
        Promise.resolve({ id: 'project-id', ...project } as Project),
      ),
    };
    rates = {
      findOne: vi.fn().mockResolvedValue(null),
      create: vi.fn((data) => data as ProjectRate),
      save: vi.fn((rate) => Promise.resolve(rate as ProjectRate)),
    };
    overrides = {
      findOne: vi.fn().mockResolvedValue(null),
      create: vi.fn((data) => data as ProjectDailyRateOverride),
      save: vi.fn((override) => Promise.resolve(override as ProjectDailyRateOverride)),
    };

    const module = await Test.createTestingModule({
      providers: [
        ProjectsService,
        { provide: getRepositoryToken(Project), useValue: repository },
        { provide: getRepositoryToken(ProjectRate), useValue: rates },
        { provide: getRepositoryToken(ProjectDailyRateOverride), useValue: overrides },
      ],
    }).compile();

    service = module.get(ProjectsService);
  });

  it('lists only projects belonging to the authenticated user', async () => {
    await service.findAll('user-id');

    expect(repository.find).toHaveBeenCalledWith({
      where: { user: { id: 'user-id' } },
      order: { createdAt: 'ASC' },
    });
  });

  it('creates a project with the authenticated owner and fixed daily goal', async () => {
    const result = await service.create('user-id', {
      name: '  Nuxio  ',
      timeZone: 'America/La_Paz',
    });

    expect(repository.create).toHaveBeenCalledWith({
      user: { id: 'user-id' },
      name: 'Nuxio',
      timeZone: 'America/La_Paz',
      dailyGoalMinutes: 480,
    });
    expect(result).toMatchObject({
      id: 'project-id',
      name: 'Nuxio',
      timeZone: 'America/La_Paz',
      dailyGoalMinutes: 480,
    });
  });

  it('rejects a timezone that is not an IANA timezone', async () => {
    await expect(
      service.create('user-id', { name: 'Nuxio', timeZone: 'Not/A_Timezone' }),
    ).rejects.toMatchObject({ status: 400, code: ErrorCode.BAD_REQUEST });

    expect(repository.create).not.toHaveBeenCalled();
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('includes the current project rate when listing owned projects', async () => {
    const ownedProject = {
      id: 'project-id',
      name: 'Nuxio',
      timeZone: 'America/La_Paz',
      dailyGoalMinutes: 480,
    } as Project;
    vi.mocked(repository.find).mockResolvedValue([ownedProject]);
    vi.mocked(rates.findOne).mockResolvedValue({ hourlyRate: '5.00' } as ProjectRate);

    const result = await service.findAll('user-id');

    expect(result).toEqual([
      expect.objectContaining({ id: 'project-id', hourlyRate: 5 }),
    ]);
    expect(rates.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          project: { id: 'project-id' },
          effectiveFrom: expect.anything(),
        }),
        order: { effectiveFrom: 'DESC' },
      }),
    );
  });

  it('creates a base rate effective on the project local date', async () => {
    const result = await service.setRate(
      'user-id',
      'project-id',
      { hourlyRate: 5 },
      new Date('2026-09-05T06:00:00.000Z'),
    );

    expect(rates.create).toHaveBeenCalledWith({
      project: { id: 'project-id' },
      hourlyRate: '5.00',
      effectiveFrom: '2026-09-05',
    });
    expect(rates.save).toHaveBeenCalled();
    expect(result).toEqual({
      projectId: 'project-id',
      hourlyRate: 5,
      effectiveFrom: '2026-09-05',
    });
  });

  it('replaces a base rate already effective on the same day', async () => {
    const existing = {
      id: 'rate-id',
      hourlyRate: '5.00',
      effectiveFrom: '2026-09-05',
    } as ProjectRate;
    vi.mocked(rates.findOne).mockResolvedValue(existing);

    await service.setRate(
      'user-id',
      'project-id',
      { hourlyRate: 7 },
      new Date('2026-09-05T18:00:00.000Z'),
    );

    expect(existing.hourlyRate).toBe('7.00');
    expect(rates.create).not.toHaveBeenCalled();
    expect(rates.save).toHaveBeenCalledWith(existing);
  });

  it('creates and updates a daily rate override only for an owned project', async () => {
    const result = await service.setDailyRateOverride(
      'user-id',
      'project-id',
      '2026-09-04',
      { hourlyRate: 7.25 },
    );

    expect(overrides.create).toHaveBeenCalledWith({
      project: { id: 'project-id' },
      hourlyRate: '7.25',
      overrideDate: '2026-09-04',
    });
    expect(result).toEqual({
      projectId: 'project-id',
      hourlyRate: 7.25,
      overrideDate: '2026-09-04',
    });

    const existing = {
      id: 'override-id',
      hourlyRate: '7.25',
      overrideDate: '2026-09-04',
    } as ProjectDailyRateOverride;
    vi.mocked(overrides.findOne).mockResolvedValue(existing);

    await service.setDailyRateOverride(
      'user-id',
      'project-id',
      '2026-09-04',
      { hourlyRate: 8 },
    );

    expect(existing.hourlyRate).toBe('8.00');
    expect(overrides.save).toHaveBeenCalledWith(existing);
  });

  it('rejects invalid rates before accessing persistence', async () => {
    await expect(
      service.setRate('user-id', 'project-id', { hourlyRate: -1 } as never),
    ).rejects.toMatchObject({ status: 400, code: ErrorCode.BAD_REQUEST });
    await expect(
      service.setDailyRateOverride(
        'user-id',
        'project-id',
        '2026-09-04',
        { hourlyRate: 7.256 } as never,
      ),
    ).rejects.toMatchObject({ status: 400, code: ErrorCode.BAD_REQUEST });
    expect(repository.find).not.toHaveBeenCalled();
    expect(rates.findOne).not.toHaveBeenCalled();
    expect(overrides.findOne).not.toHaveBeenCalled();
  });

  it('rejects tariff mutations for a project outside the authenticated owner', async () => {
    vi.mocked(repository.findOne).mockResolvedValue(null);

    await expect(
      service.setRate('user-id', 'other-project', { hourlyRate: 5 }),
    ).rejects.toMatchObject({ status: 404, code: ErrorCode.NOT_FOUND });
    await expect(
      service.setDailyRateOverride(
        'user-id',
        'other-project',
        '2026-09-04',
        { hourlyRate: 5 },
      ),
    ).rejects.toMatchObject({ status: 404, code: ErrorCode.NOT_FOUND });
    expect(rates.save).not.toHaveBeenCalled();
    expect(overrides.save).not.toHaveBeenCalled();
  });
});
