import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppError, ErrorCode } from '../common/errors/errors.js';
import { Project } from './project.entity.js';
import { CreateProjectDto } from './dto/create-project.dto.js';

export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly projects: Repository<Project>,
  ) {}

  findAll(userId: string) {
    return this.projects.find({
      where: { user: { id: userId } },
      order: { createdAt: 'ASC' },
    });
  }

  async create(userId: string, input: CreateProjectDto) {
    const name = input.name.trim();
    if (!name) {
      throw new AppError({
        statusCode: 400,
        code: ErrorCode.BAD_REQUEST,
        message: 'El nombre del proyecto es obligatorio',
      });
    }

    if (!isValidTimeZone(input.timeZone)) {
      throw new AppError({
        statusCode: 400,
        code: ErrorCode.BAD_REQUEST,
        message: 'La zona horaria no es válida',
      });
    }

    const project = this.projects.create({
      user: { id: userId },
      name,
      timeZone: input.timeZone,
      dailyGoalMinutes: 480,
    });

    return this.projects.save(project);
  }
}

function isValidTimeZone(timeZone: string) {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone }).format();
    return true;
  } catch {
    return false;
  }
}
