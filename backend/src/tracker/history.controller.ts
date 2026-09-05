import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard.js';
import type { AuthenticatedRequest } from '../auth/auth.types.js';
import { HistoryQueryDto } from './dto/history-query.dto.js';
import { HistoryService } from './history.service.js';

@Controller('history')
@UseGuards(AuthGuard)
export class HistoryController {
  constructor(private readonly historyService: HistoryService) {}

  @Get()
  getHistory(
    @Req() request: AuthenticatedRequest,
    @Query() query: HistoryQueryDto,
  ) {
    return this.historyService.getHistory(request.user.sub, query);
  }
}
