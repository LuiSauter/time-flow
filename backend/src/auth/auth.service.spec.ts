import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test } from '@nestjs/testing';
import bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { AppError, ErrorCode } from '../common/errors/errors.js';
import { User } from '../users/user.entity.js';
import { RegisterDto } from './dto/register.dto.js';
import { AuthService } from './auth.service.js';

describe('AuthService registration', () => {
  let service: AuthService;
  let repository: Pick<Repository<User>, 'findOne' | 'create' | 'save'>;
  let jwt: Pick<JwtService, 'signAsync'>;

  beforeEach(async () => {
    repository = {
      findOne: vi.fn(),
      create: vi.fn((data) => data as User),
      save: vi.fn((user) => Promise.resolve({ id: 'user-id', ...user } as User)),
    };
    jwt = { signAsync: vi.fn().mockResolvedValue('signed-token') };

    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: repository },
        {
          provide: ConfigService,
          useValue: {
            get: vi.fn((key: string) => (key === 'HASH_SALT' ? '4' : '1h')),
          },
        },
        { provide: JwtService, useValue: jwt },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  it('creates a user with a hashed password', async () => {
    vi.mocked(repository.findOne).mockResolvedValue(null);
    const input: RegisterDto = {
      fullName: 'Diego Ferrer',
      email: 'diego@example.com',
      password: 'Abcdefg!',
    };

    const user = await service.register(input);

    expect(repository.create).toHaveBeenCalledWith({
      fullName: input.fullName,
      email: input.email,
      passwordHash: expect.any(String),
    });
    expect(user).toMatchObject({
      accessToken: 'signed-token',
      user: {
        id: 'user-id',
        fullName: input.fullName,
        email: input.email,
      },
    });
    const savedUser = vi.mocked(repository.save).mock.results[0]?.value;
    const persistedUser = await savedUser;
    expect(persistedUser.passwordHash).not.toBe(input.password);
    await expect(bcrypt.compare(input.password, persistedUser.passwordHash)).resolves.toBe(true);
  });

  it('rejects an email that already belongs to a user', async () => {
    vi.mocked(repository.findOne).mockResolvedValue({ id: 'existing-id' } as User);

    await expect(
      service.register({
        fullName: 'Diego Ferrer',
        email: 'diego@example.com',
        password: 'Abcdefg!',
      }),
    ).rejects.toMatchObject({
      status: 409,
      code: ErrorCode.CONFLICT,
    } satisfies Partial<AppError>);

    expect(repository.create).not.toHaveBeenCalled();
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('authenticates valid credentials and returns a bearer token', async () => {
    const password = 'Abcdefg!';
    const passwordHash = await bcrypt.hash(password, 4);
    vi.mocked(repository.findOne).mockResolvedValue({
      id: 'user-id',
      fullName: 'Diego Ferrer',
      email: 'diego@example.com',
      passwordHash,
    } as User);

    const result = await service.login({ email: 'diego@example.com', password });

    expect(jwt.signAsync).toHaveBeenCalledWith(
      { sub: 'user-id', email: 'diego@example.com' },
      { expiresIn: '1h' },
    );
    expect(result).toEqual({
      accessToken: 'signed-token',
      user: {
        id: 'user-id',
        fullName: 'Diego Ferrer',
        email: 'diego@example.com',
      },
    });
  });

  it.each([
    ['unknown email', null, 'Abcdefg!'],
    ['wrong password', { id: 'user-id', passwordHash: '$2b$04$invalid' }, 'Wrong123!'],
  ])('rejects login with a generic error for %s', async (_label, user, password) => {
    vi.mocked(repository.findOne).mockResolvedValue(user as User | null);

    await expect(
      service.login({ email: 'diego@example.com', password }),
    ).rejects.toMatchObject({ status: 401, code: ErrorCode.UNAUTHORIZED });
    expect(jwt.signAsync).not.toHaveBeenCalled();
  });
});
