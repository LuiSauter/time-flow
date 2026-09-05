import { DataSource } from 'typeorm';
import type { DataSourceOptions } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import 'dotenv/config';
import { User } from '../users/user.entity.js';
import { Project } from '../projects/project.entity.js';
import { WorkSession } from '../tracker/work-session.entity.js';
import { TrackerSegment } from '../tracker/tracker-segment.entity.js';
import { CreateUsers1760000000000 } from '../migrations/1760000000000-create-users.js';
import { CreateProjects1760000001000 } from '../migrations/1760000001000-create-projects.js';
import { CreateTracker1760000002000 } from '../migrations/1760000002000-create-tracker.js';

const isProd = process.env.APP_PROD === 'true';

export const DataSourceConfig: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USERNAME ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'postgres',
  database: process.env.DB_DATABASE ?? 'postgres',
  entities: [User, Project, WorkSession, TrackerSegment],
  migrations: [
    CreateUsers1760000000000,
    CreateProjects1760000001000,
    CreateTracker1760000002000,
  ],
  migrationsRun: false,
  synchronize: false,
  namingStrategy: new SnakeNamingStrategy(),
  logging: false,
  extra: {
    ssl: isProd ? { rejectUnauthorized: false } : null,
  },
};

export const AppDS = new DataSource(DataSourceConfig);
