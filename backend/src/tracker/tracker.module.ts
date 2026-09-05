import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module.js';
import { ProjectDailyRateOverride } from '../projects/project-daily-rate-override.entity.js';
import { Project } from '../projects/project.entity.js';
import { ProjectRate } from '../projects/project-rate.entity.js';
import { TrackerSegment } from './tracker-segment.entity.js';
import { TrackerController } from './tracker.controller.js';
import { ManualEntryController } from './manual-entry.controller.js';
import { HistoryController } from './history.controller.js';
import { HistoryService } from './history.service.js';
import { TrackerService } from './tracker.service.js';
import { WorkSession } from './work-session.entity.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Project,
      ProjectRate,
      ProjectDailyRateOverride,
      WorkSession,
      TrackerSegment,
    ]),
    AuthModule,
  ],
  controllers: [TrackerController, ManualEntryController, HistoryController],
  providers: [TrackerService, HistoryService],
  exports: [TrackerService],
})
export class TrackerModule {}
