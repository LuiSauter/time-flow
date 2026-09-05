import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../config/base.entity.js';
import { Project } from './project.entity.js';

@Entity({ name: 'project_rates' })
export class ProjectRate extends BaseEntity {
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

  @Column({ name: 'effective_from', type: 'date' })
  effectiveFrom: string;
}
