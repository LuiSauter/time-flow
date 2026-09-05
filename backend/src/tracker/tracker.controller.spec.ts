import { GUARDS_METADATA } from '@nestjs/common/constants';
import { TrackerController } from './tracker.controller.js';

describe('TrackerController', () => {
  it('protects the snapshot route with authentication', () => {
    const guards = Reflect.getMetadata(GUARDS_METADATA, TrackerController);

    expect(guards).toEqual(expect.arrayContaining([expect.any(Function)]));
  });

  it('passes the authenticated user, project and business scope to the service', async () => {
    const service = {
      getSnapshot: vi.fn().mockResolvedValue({ status: 'IDLE' }),
    };
    const controller = new TrackerController(service as never);
    const request = { user: { sub: 'user-id', email: 'user@example.com' } } as any;

    await controller.getSnapshot(request, 'project-id', 'business');

    expect(service.getSnapshot).toHaveBeenCalledWith(
      'user-id',
      'project-id',
      'business',
    );
  });

  it('starts work for the authenticated user and project', async () => {
    const service = { startWork: vi.fn().mockResolvedValue({ status: 'WORKING' }) };
    const controller = new TrackerController(service as never);
    const request = { user: { sub: 'user-id', email: 'user@example.com' } } as any;

    await controller.startWork(request, 'project-id');

    expect(service.startWork).toHaveBeenCalledWith('user-id', 'project-id');
  });

  it('routes break, resume and finish actions to the authenticated project', async () => {
    const service = {
      startBreak: vi.fn().mockResolvedValue({ status: 'PAUSED' }),
      resumeWork: vi.fn().mockResolvedValue({ status: 'WORKING' }),
      finishDay: vi.fn().mockResolvedValue({ status: 'IDLE' }),
    };
    const controller = new TrackerController(service as never);
    const request = { user: { sub: 'user-id', email: 'user@example.com' } } as any;

    await controller.startBreak(request, 'project-id');
    await controller.resumeWork(request, 'project-id');
    await controller.finishDay(request, 'project-id');

    expect(service.startBreak).toHaveBeenCalledWith('user-id', 'project-id');
    expect(service.resumeWork).toHaveBeenCalledWith('user-id', 'project-id');
    expect(service.finishDay).toHaveBeenCalledWith('user-id', 'project-id');
  });
});
