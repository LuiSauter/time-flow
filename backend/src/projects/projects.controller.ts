import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard.js';
import type { AuthenticatedRequest } from '../auth/auth.types.js';
import { CreateProjectDto } from './dto/create-project.dto.js';
import { SetHourlyRateDto } from './dto/set-hourly-rate.dto.js';
import { ProjectsService } from './projects.service.js';

@Controller('projects')
@UseGuards(AuthGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  findAll(@Req() request: AuthenticatedRequest) {
    return this.projectsService.findAll(request.user.sub);
  }

  @Post()
  create(
    @Req() request: AuthenticatedRequest,
    @Body() input: CreateProjectDto,
  ) {
    return this.projectsService.create(request.user.sub, input);
  }

  @Patch(':projectId/rate')
  setRate(
    @Req() request: AuthenticatedRequest,
    @Param('projectId') projectId: string,
    @Body() input: SetHourlyRateDto,
  ) {
    return this.projectsService.setRate(request.user.sub, projectId, input);
  }

  @Put(':projectId/rate-overrides/:date')
  setDailyRateOverride(
    @Req() request: AuthenticatedRequest,
    @Param('projectId') projectId: string,
    @Param('date') date: string,
    @Body() input: SetHourlyRateDto,
  ) {
    return this.projectsService.setDailyRateOverride(
      request.user.sub,
      projectId,
      date,
      input,
    );
  }
}
