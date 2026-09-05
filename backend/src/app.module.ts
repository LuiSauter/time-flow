import { Module } from '@nestjs/common';
import { createObserveModule } from '@nestjs/observe';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSourceConfig } from './config/data.source.js';
import { ProvidersModule } from './providers/providers.module.js';
import { AuthModule } from './auth/auth.module.js';
import { ProjectsModule } from './projects/projects.module.js';
import { TrackerModule } from './tracker/tracker.module.js';

export const { ObserveModule, ObserveInstrument } = createObserveModule();

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    TypeOrmModule.forRoot({ ...DataSourceConfig }),

    ProvidersModule,
    AuthModule,
    ProjectsModule,
    TrackerModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
