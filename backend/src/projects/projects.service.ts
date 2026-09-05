import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, Repository } from 'typeorm';
import { AppError, ErrorCode } from '../common/errors/errors.js';
import { ProjectDailyRateOverride } from './project-daily-rate-override.entity.js';
import { Project } from './project.entity.js';
import { ProjectRate } from './project-rate.entity.js';
import { CreateProjectDto } from './dto/create-project.dto.js';
import { SetHourlyRateDto } from './dto/set-hourly-rate.dto.js';

export type ProjectSummary = Project & { hourlyRate: number | null };

export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly projects: Repository<Project>,
    @InjectRepository(ProjectRate)
    private readonly rates: Repository<ProjectRate>,
    @InjectRepository(ProjectDailyRateOverride)
    private readonly dailyRateOverrides: Repository<ProjectDailyRateOverride>,
  ) {}

  async findAll(userId: string, now = new Date()): Promise<ProjectSummary[]> {
    const projects = await this.projects.find({
      where: { user: { id: userId } },
      order: { createdAt: 'ASC' },
    });

    return Promise.all(
      projects.map(async (project) => ({
        ...project,
        hourlyRate: await this.currentRate(project, now),
      })),
    );
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

    const saved = await this.projects.save(project);
    return { ...saved, hourlyRate: null };
  }

  async setRate(
    userId: string,
    projectId: string,
    input: SetHourlyRateDto,
    now = new Date(),
  ) {
    assertHourlyRate(input.hourlyRate);
    const project = await this.requireOwnedProject(userId, projectId);
    const effectiveFrom = dateKey(now, project.timeZone);
    const hourlyRate = formatHourlyRate(input.hourlyRate);
    const existing = await this.rates.findOne({
      where: { project: { id: projectId }, effectiveFrom },
    });

    if (existing) {
      existing.hourlyRate = hourlyRate;
      await this.rates.save(existing);
    } else {
      await this.rates.save(
        this.rates.create({
          project: { id: projectId },
          hourlyRate,
          effectiveFrom,
        }),
      );
    }

    return { projectId, hourlyRate: input.hourlyRate, effectiveFrom };
  }

  async setDailyRateOverride(
    userId: string,
    projectId: string,
    overrideDate: string,
    input: SetHourlyRateDto,
  ) {
    assertHourlyRate(input.hourlyRate);
    if (!isDateKey(overrideDate)) {
      throw invalidRateInput('La fecha de la excepción no es válida');
    }
    await this.requireOwnedProject(userId, projectId);
    const hourlyRate = formatHourlyRate(input.hourlyRate);
    const existing = await this.dailyRateOverrides.findOne({
      where: { project: { id: projectId }, overrideDate },
    });

    if (existing) {
      existing.hourlyRate = hourlyRate;
      await this.dailyRateOverrides.save(existing);
    } else {
      await this.dailyRateOverrides.save(
        this.dailyRateOverrides.create({
          project: { id: projectId },
          hourlyRate,
          overrideDate,
        }),
      );
    }

    return { projectId, hourlyRate: input.hourlyRate, overrideDate };
  }

  private async currentRate(project: Project, now: Date) {
    const rate = await this.rates.findOne({
      where: {
        project: { id: project.id },
        effectiveFrom: LessThanOrEqual(dateKey(now, project.timeZone)),
      },
      order: { effectiveFrom: 'DESC' },
    });
    return rate ? Number(rate.hourlyRate) : null;
  }

  private async requireOwnedProject(userId: string, projectId: string) {
    const project = await this.projects.findOne({
      where: { id: projectId, user: { id: userId } },
    });
    if (!project) {
      throw new AppError({
        statusCode: 404,
        code: ErrorCode.NOT_FOUND,
        message: 'El proyecto no existe',
      });
    }
    return project;
  }
}

function assertHourlyRate(value: unknown): asserts value is number {
  if (
    typeof value !== 'number' ||
    !Number.isFinite(value) ||
    value < 0 ||
    Math.round(value * 100) !== value * 100
  ) {
    throw invalidRateInput();
  }
}

function invalidRateInput(message = 'La tarifa debe ser un importe válido no negativo y con dos decimales') {
  return new AppError({
    statusCode: 400,
    code: ErrorCode.BAD_REQUEST,
    message,
  });
}

function formatHourlyRate(value: number) {
  return value.toFixed(2);
}

function dateKey(value: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(value);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function isDateKey(value: string) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function isValidTimeZone(timeZone: string) {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone }).format();
    return true;
  } catch {
    return false;
  }
}
