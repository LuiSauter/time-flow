import { validate } from 'class-validator';
import { SetHourlyRateDto } from './set-hourly-rate.dto.js';

async function errorsFor(hourlyRate: unknown) {
  return validate(Object.assign(new SetHourlyRateDto(), { hourlyRate }));
}

describe('SetHourlyRateDto', () => {
  it('accepts positive and zero rates with two decimals', async () => {
    await expect(errorsFor(5)).resolves.toHaveLength(0);
    await expect(errorsFor(0)).resolves.toHaveLength(0);
    await expect(errorsFor(7.25)).resolves.toHaveLength(0);
  });

  it('rejects non-numeric, negative and over-precise rates', async () => {
    await expect(errorsFor('5')).resolves.toEqual(
      expect.arrayContaining([expect.objectContaining({ property: 'hourlyRate' })]),
    );
    await expect(errorsFor(-1)).resolves.toEqual(
      expect.arrayContaining([expect.objectContaining({ property: 'hourlyRate' })]),
    );
    await expect(errorsFor(7.256)).resolves.toEqual(
      expect.arrayContaining([expect.objectContaining({ property: 'hourlyRate' })]),
    );
  });
});
