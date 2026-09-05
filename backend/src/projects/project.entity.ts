import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../config/base.entity.js';
import { User } from '../users/user.entity.js';

@Entity({ name: 'projects' })
export class Project extends BaseEntity {
  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ name: 'time_zone', type: 'varchar' })
  timeZone: string;

  @Column({
    name: 'daily_goal_minutes',
    type: 'integer',
    default: 480,
  })
  dailyGoalMinutes: number;
}
