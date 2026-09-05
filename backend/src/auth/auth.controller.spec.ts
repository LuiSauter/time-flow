import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';

describe('AuthController', () => {
  it('delegates registration and returns the authenticated session', async () => {
    const session = {
      accessToken: 'token',
      user: { id: 'user-id', fullName: 'Diego Ferrer', email: 'diego@example.com' },
    };
    const service = {
      register: vi.fn().mockResolvedValue(session),
      login: vi.fn(),
    };
    const controller = new AuthController(service as unknown as AuthService);

    await expect(
      controller.register({
        fullName: 'Diego Ferrer',
        email: 'diego@example.com',
        password: 'Abcdefg!',
      }),
    ).resolves.toEqual(session);
    expect(service.register).toHaveBeenCalledWith({
      fullName: 'Diego Ferrer',
      email: 'diego@example.com',
      password: 'Abcdefg!',
    });
  });

  it('delegates login credentials to the service', async () => {
    const session = { accessToken: 'token', user: { id: 'user-id' } };
    const service = {
      register: vi.fn(),
      login: vi.fn().mockResolvedValue(session),
    };
    const controller = new AuthController(service as unknown as AuthService);

    await expect(
      controller.login({ email: 'diego@example.com', password: 'Abcdefg!' }),
    ).resolves.toEqual(session);
  });

  it('returns the verified token identity from check-token', () => {
    const service = { register: vi.fn(), login: vi.fn() };
    const controller = new AuthController(service as unknown as AuthService);
    const user = { sub: 'user-id', email: 'diego@example.com' };
    expect(controller.checkToken({ user })).toEqual({ user });
  });
});
