import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../config/base.entity.js';
import { Project } from './project.entity.js';

@Entity({ name: 'project_daily_rate_overrides' })
export class ProjectDailyRateOverride extends BaseEntity {
  @ManyToOne(() => Project, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @Column({
    name: 'hourly_rate',
    type: 'numeric',
    precision: 12,
    scale: 2,
  })
  hourlyRate: string;

  @Column({ name: 'override_date', type: 'date' })
  overrideDate: string;
}
