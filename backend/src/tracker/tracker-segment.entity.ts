import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../config/base.entity.js';
import { WorkSession } from './work-session.entity.js';

@Entity({ name: 'tracker_segments' })
export class TrackerSegment extends BaseEntity {
  @ManyToOne(() => WorkSession, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'work_session_id' })
  workSession: WorkSession;

  @Column({ type: 'varchar' })
  kind: 'work' | 'break';

  @Column({ type: 'varchar' })
  label: string;

  @Column({ name: 'started_at', type: 'timestamp with time zone' })
  startedAt: Date;

  @Column({ name: 'ended_at', type: 'timestamp with time zone', nullable: true })
  endedAt: Date | null;
}
