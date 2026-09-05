import { DataSource, DataSourceOptions } from 'typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
ConfigModule.forRoot({ envFilePath: '.env' });
const configService = new ConfigService();

const isProd = configService.get('APP_PROD') === 'true';

export const DataSourceConfig: DataSourceOptions = {
  type: 'postgres',
  host: configService.get('DB_HOST'),
  port: configService.get('DB_PORT'),
  username: configService.get('DB_USERNAME'),
  password: configService.get('DB_PASSWORD'),
  database: configService.get('DB_DATABASE'),
  entities: [join(__dirname, '/../**/**/*.entity{.ts,.js}')],
  migrations: [join(__dirname, '/../migrations/*{.ts,.js}')],
  migrationsRun: false,
  synchronize: false,
  namingStrategy: new SnakeNamingStrategy(),
  logging: false,
  extra: {
    ssl: isProd ? { rejectUnauthorized: false } : null,
  },
};

export const AppDS = new DataSource(DataSourceConfig);
