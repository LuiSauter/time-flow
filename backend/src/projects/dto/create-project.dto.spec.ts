import { validate } from 'class-validator';
import { CreateProjectDto } from './create-project.dto.js';

async function errorsFor(input: Partial<CreateProjectDto>) {
  return validate(Object.assign(new CreateProjectDto(), input));
}

describe('CreateProjectDto', () => {
  it('accepts a project name and timezone', async () => {
    await expect(
      errorsFor({ name: 'Nuxio', timeZone: 'America/La_Paz' }),
    ).resolves.toHaveLength(0);
  });

  it('rejects an empty or whitespace-only name', async () => {
    const errors = await errorsFor({ name: '   ', timeZone: 'America/La_Paz' });

    expect(errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ property: 'name' }),
      ]),
    );
  });

  it('requires the timezone', async () => {
    const errors = await errorsFor({ name: 'Nuxio' });

    expect(errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ property: 'timeZone' }),
      ]),
    );
  });
});
