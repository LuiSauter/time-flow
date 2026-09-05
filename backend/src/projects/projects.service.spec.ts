import { getRepositoryToken } from '@nestjs/typeorm';
import { Test } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { ErrorCode } from '../common/errors/errors.js';
import { Project } from './project.entity.js';
import { ProjectsService } from './projects.service.js';

describe('ProjectsService', () => {
  let service: ProjectsService;
  let repository: Pick<Repository<Project>, 'find' | 'create' | 'save'>;

  beforeEach(async () => {
    repository = {
      find: vi.fn().mockResolvedValue([]),
      create: vi.fn((data) => data as Project),
      save: vi.fn((project) =>
        Promise.resolve({ id: 'project-id', ...project } as Project),
      ),
    };

    const module = await Test.createTestingModule({
      providers: [
        ProjectsService,
        { provide: getRepositoryToken(Project), useValue: repository },
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
});
