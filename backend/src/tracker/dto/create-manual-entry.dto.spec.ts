import { validate } from 'class-validator';
import { CreateManualEntryDto } from './create-manual-entry.dto.js';

async function errorsFor(input: Partial<CreateManualEntryDto>) {
  return validate(Object.assign(new CreateManualEntryDto(), input));
}

describe('CreateManualEntryDto', () => {
  it('accepts a complete manual range', async () => {
    await expect(
      errorsFor({ date: '2026-09-05', startTime: '15:30', endTime: '16:15' }),
    ).resolves.toHaveLength(0);
  });

  it('requires date, start time and end time', async () => {
    const errors = await errorsFor({});

    expect(errors.map(({ property }) => property)).toEqual(
      expect.arrayContaining(['date', 'startTime', 'endTime']),
    );
  });

  it('rejects malformed date and time values', async () => {
    const errors = await errorsFor({
      date: '05/09/2026',
      startTime: '3:30 p.m.',
      endTime: '16:15',
    });

    expect(errors.map(({ property }) => property)).toEqual(
      expect.arrayContaining(['date', 'startTime']),
    );
  });
});
