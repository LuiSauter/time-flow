import { Body, Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard.js';
import type { AuthenticatedRequest } from '../auth/auth.types.js';
import { CreateManualEntryDto } from './dto/create-manual-entry.dto.js';
import { TrackerService } from './tracker.service.js';

@Controller('projects/:projectId')
@UseGuards(AuthGuard)
export class ManualEntryController {
  constructor(private readonly trackerService: TrackerService) {}

  @Post('manual-entries')
  addManualEntry(
    @Req() request: AuthenticatedRequest,
    @Param('projectId') projectId: string,
    @Body() input: CreateManualEntryDto,
  ) {
    return this.trackerService.addManualEntry(request.user.sub, projectId, input);
  }
}
