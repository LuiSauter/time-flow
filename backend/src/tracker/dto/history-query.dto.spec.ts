import { validate } from 'class-validator';
import { HistoryQueryDto } from './history-query.dto.js';

async function errorsFor(input: Partial<HistoryQueryDto>) {
  return validate(Object.assign(new HistoryQueryDto(), input));
}

describe('HistoryQueryDto', () => {
  it('accepts the supported periods and optional filters', async () => {
    await expect(errorsFor({ period: 'week', onlyWeekdays: true })).resolves.toHaveLength(0);
    await expect(
      errorsFor({
        period: 'custom',
        startDate: '2026-09-01',
        endDate: '2026-09-07',
        onlyWeekdays: false,
        projectId: 'project-id',
      }),
    ).resolves.toHaveLength(0);
  });

  it('rejects unsupported periods and invalid weekday filters', async () => {
    await expect(errorsFor({ period: 'quarter' as never })).resolves.toEqual(
      expect.arrayContaining([expect.objectContaining({ property: 'period' })]),
    );
    await expect(errorsFor({ onlyWeekdays: 'invalid' as never })).resolves.toEqual(
      expect.arrayContaining([expect.objectContaining({ property: 'onlyWeekdays' })]),
    );
  });
});
