import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard.js';
import type { AuthenticatedRequest } from '../auth/auth.types.js';
import { CreateProjectDto } from './dto/create-project.dto.js';
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
}
