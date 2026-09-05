import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../config/base.entity.js';

@Entity({ name: 'users' })
export class User extends BaseEntity {
  @Column({ name: 'full_name', type: 'varchar' })
  fullName: string;

  @Index({ unique: true })
  @Column({ type: 'varchar' })
  email: string;

  @Column({ name: 'password_hash', type: 'varchar' })
  passwordHash: string;
}
