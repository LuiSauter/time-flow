import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module.js';
import { Project } from '../projects/project.entity.js';
import { TrackerSegment } from './tracker-segment.entity.js';
import { TrackerController } from './tracker.controller.js';
import { ManualEntryController } from './manual-entry.controller.js';
import { TrackerService } from './tracker.service.js';
import { WorkSession } from './work-session.entity.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Project, WorkSession, TrackerSegment]),
    AuthModule,
  ],
  controllers: [TrackerController, ManualEntryController],
  providers: [TrackerService],
  exports: [TrackerService],
})
export class TrackerModule {}
