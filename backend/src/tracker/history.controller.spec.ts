import { GUARDS_METADATA } from '@nestjs/common/constants';
import { HistoryController } from './history.controller.js';

describe('HistoryController', () => {
  it('protects the history route with authentication', () => {
    const guards = Reflect.getMetadata(GUARDS_METADATA, HistoryController);

    expect(guards).toEqual(expect.arrayContaining([expect.any(Function)]));
  });

  it('passes the authenticated user and query filters to the service', async () => {
    const service = { getHistory: vi.fn().mockResolvedValue({ rows: [], totals: {} }) };
    const controller = new HistoryController(service as never);
    const request = { user: { sub: 'user-id', email: 'user@example.com' } } as any;
    const query = { period: 'custom', startDate: '2026-09-01', endDate: '2026-09-07', onlyWeekdays: true } as any;

    await controller.getHistory(request, query);

    expect(service.getHistory).toHaveBeenCalledWith('user-id', query);
  });
});
