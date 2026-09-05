import { GUARDS_METADATA } from '@nestjs/common/constants';
import { CreateProjectDto } from './dto/create-project.dto.js';
import { SetHourlyRateDto } from './dto/set-hourly-rate.dto.js';
import { ProjectsController } from './projects.controller.js';

describe('ProjectsController', () => {
  it('protects project routes with the authentication guard', () => {
    const guards = Reflect.getMetadata(GUARDS_METADATA, ProjectsController);

    expect(guards).toEqual(expect.arrayContaining([expect.any(Function)]));
  });

  it('uses the authenticated subject when listing and creating projects', async () => {
    const service = {
      findAll: vi.fn().mockResolvedValue([]),
      create: vi.fn().mockResolvedValue({ id: 'project-id' }),
      setRate: vi.fn().mockResolvedValue({ projectId: 'project-id' }),
      setDailyRateOverride: vi.fn().mockResolvedValue({ projectId: 'project-id' }),
    };
    const controller = new ProjectsController(service as never);
    const request = { user: { sub: 'user-id', email: 'user@example.com' } } as any;
    const input: CreateProjectDto = {
      name: 'Nuxio',
      timeZone: 'America/La_Paz',
    };

    await controller.findAll(request);
    await controller.create(request, input);

    expect(service.findAll).toHaveBeenCalledWith('user-id');
    expect(service.create).toHaveBeenCalledWith('user-id', input);
  });

  it('routes base and daily override rates through the authenticated subject', async () => {
    const service = {
      setRate: vi.fn().mockResolvedValue({ projectId: 'project-id' }),
      setDailyRateOverride: vi.fn().mockResolvedValue({ projectId: 'project-id' }),
    };
    const controller = new ProjectsController(service as never);
    const request = { user: { sub: 'user-id', email: 'user@example.com' } } as any;
    const input: SetHourlyRateDto = { hourlyRate: 7 };

    await controller.setRate(request, 'project-id', input);
    await controller.setDailyRateOverride(request, 'project-id', '2026-09-05', input);

    expect(service.setRate).toHaveBeenCalledWith('user-id', 'project-id', input);
    expect(service.setDailyRateOverride).toHaveBeenCalledWith(
      'user-id',
      'project-id',
      '2026-09-05',
      input,
    );
  });
});
