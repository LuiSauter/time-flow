import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppController } from './../src/app.controller.js';
import { AppService } from './../src/app.service.js';
import { AuthGuard } from './../src/auth/auth.guard.js';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [JwtModule.register({ secret: 'test-secret' })],
      controllers: [AppController],
      providers: [AppService, AuthGuard],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET) rejects requests without authentication', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(401);
  });

  it('/ (GET) accepts a valid bearer token', async () => {
    const jwt = app.get(JwtService);
    const token = await jwt.signAsync({ sub: 'user-id' });

    return request(app.getHttpServer())
      .get('/')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect('Hello World!');
  });

  afterEach(async () => {
    await app.close();
  });
});
