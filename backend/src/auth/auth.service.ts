import { ConfigService } from '@nestjs/config';
import { JwtService, type JwtSignOptions } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { AppError, ErrorCode } from '../common/errors/errors.js';
import { User } from '../users/user.entity.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';

export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
    private readonly config: ConfigService,
    private readonly jwt: JwtService,
  ) {}

  async register(input: RegisterDto) {
    const existingUser = await this.users.findOne({
      where: { email: input.email },
    });

    if (existingUser) {
      throw new AppError({
        statusCode: 409,
        code: ErrorCode.CONFLICT,
        message: 'El email ya está registrado',
      });
    }

    const saltRounds = Number(this.config.get<string | number>('HASH_SALT') ?? 10);
    const passwordHash = await bcrypt.hash(input.password, saltRounds);
    const user = this.users.create({
      fullName: input.fullName,
      email: input.email,
      passwordHash,
    });

    const savedUser = await this.users.save(user);
    return this.createSession(savedUser);
  }

  async login(input: LoginDto) {
    const user = await this.users.findOne({
      where: { email: input.email },
    });
    const passwordMatches = user
      ? await bcrypt.compare(input.password, user.passwordHash)
      : false;

    if (!user || !passwordMatches) {
      throw new AppError({
        statusCode: 401,
        code: ErrorCode.UNAUTHORIZED,
        message: 'El email o la contraseña no son válidos',
      });
    }

    return this.createSession(user);
  }

  private async createSession(user: User) {
    const expiresIn = this.config.get<string>('JWT_EXPIRES_IN') ?? '1h';
    const accessToken = await this.jwt.signAsync(
      { sub: user.id, email: user.email },
      { expiresIn: expiresIn as JwtSignOptions['expiresIn'] },
    );

    return {
      accessToken,
      user: { id: user.id, fullName: user.fullName, email: user.email },
    };
  }
}
