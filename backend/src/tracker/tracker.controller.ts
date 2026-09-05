import { Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard.js';
import type { AuthenticatedRequest } from '../auth/auth.types.js';
import { TrackerService, type TrackerScope } from './tracker.service.js';

@Controller('projects/:projectId/tracker')
@UseGuards(AuthGuard)
export class TrackerController {
  constructor(private readonly trackerService: TrackerService) {}

  @Get()
  getSnapshot(
    @Req() request: AuthenticatedRequest,
    @Param('projectId') projectId: string,
    @Query('previousDayScope') scope?: TrackerScope,
  ) {
    return this.trackerService.getSnapshot(
      request.user.sub,
      projectId,
      scope === 'business' ? 'business' : 'all',
    );
  }

  @Post('start')
  startWork(
    @Req() request: AuthenticatedRequest,
    @Param('projectId') projectId: string,
  ) {
    return this.trackerService.startWork(request.user.sub, projectId);
  }

  @Post('break')
  startBreak(
    @Req() request: AuthenticatedRequest,
    @Param('projectId') projectId: string,
  ) {
    return this.trackerService.startBreak(request.user.sub, projectId);
  }

  @Post('resume')
  resumeWork(
    @Req() request: AuthenticatedRequest,
    @Param('projectId') projectId: string,
  ) {
    return this.trackerService.resumeWork(request.user.sub, projectId);
  }

  @Post('finish')
  finishDay(
    @Req() request: AuthenticatedRequest,
    @Param('projectId') projectId: string,
  ) {
    return this.trackerService.finishDay(request.user.sub, projectId);
  }

}
