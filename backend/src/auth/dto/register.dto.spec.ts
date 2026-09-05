import { validate } from 'class-validator';
import { RegisterDto } from './register.dto.js';

async function errorsFor(input: Partial<RegisterDto>) {
  const dto = Object.assign(new RegisterDto(), input);
  return validate(dto);
}

describe('RegisterDto', () => {
  it('accepts a valid registration', async () => {
    await expect(
      errorsFor({
        fullName: 'Diego Ferrer',
        email: 'diego@example.com',
        password: 'Abcdefg!',
      }),
    ).resolves.toHaveLength(0);
  });

  it('requires all registration fields and rejects whitespace-only names', async () => {
    const errors = await errorsFor({ fullName: '   ' });

    expect(errors.map(({ property }) => property)).toEqual(
      expect.arrayContaining(['fullName', 'email', 'password']),
    );
  });

  it('rejects invalid email addresses', async () => {
    const errors = await errorsFor({
      fullName: 'Diego Ferrer',
      email: 'invalid-email',
      password: 'Abcdefg!',
    });

    expect(errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ property: 'email' }),
      ]),
    );
  });

  it.each([
    ['too short', 'Abcdef!'],
    ['without uppercase', 'abcdefg!'],
    ['without symbol', 'Abcdefgh'],
  ])('rejects a password %s', async (_label, password) => {
    const errors = await errorsFor({
      fullName: 'Diego Ferrer',
      email: 'diego@example.com',
      password,
    });

    expect(errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ property: 'password' }),
      ]),
    );
  });
});
