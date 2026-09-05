import { GUARDS_METADATA } from '@nestjs/common/constants';
import { CreateManualEntryDto } from './dto/create-manual-entry.dto.js';
import { ManualEntryController } from './manual-entry.controller.js';

describe('ManualEntryController', () => {
  it('protects manual entry routes with authentication', () => {
    const guards = Reflect.getMetadata(GUARDS_METADATA, ManualEntryController);

    expect(guards).toEqual(expect.arrayContaining([expect.any(Function)]));
  });

  it('uses the authenticated subject and route project', async () => {
    const service = {
      addManualEntry: vi.fn().mockResolvedValue({ status: 'IDLE' }),
    };
    const controller = new ManualEntryController(service as never);
    const request = { user: { sub: 'user-id', email: 'user@example.com' } } as any;
    const input: CreateManualEntryDto = {
      date: '2026-09-05',
      startTime: '15:30',
      endTime: '16:15',
    };

    await controller.addManualEntry(request, 'project-id', input);

    expect(service.addManualEntry).toHaveBeenCalledWith(
      'user-id',
      'project-id',
      input,
    );
  });
});
