import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../config/base.entity.js';
import { Project } from '../projects/project.entity.js';
import { User } from '../users/user.entity.js';

@Entity({ name: 'work_sessions' })
export class WorkSession extends BaseEntity {
  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Project, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @Column({ type: 'varchar' })
  origin: 'realtime' | 'manual';

  @Column({ type: 'varchar' })
  label: string;

  @Column({ name: 'started_at', type: 'timestamp with time zone' })
  startedAt: Date;

  @Column({ name: 'ended_at', type: 'timestamp with time zone', nullable: true })
  endedAt: Date | null;
}
