import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module.js';
import { HttpExceptionFilter } from '../src/common/errors/http-exception.filter.js';

describe('Projects and tracker (e2e)', () => {
  let app: INestApplication<App>;
  let userAToken: string;
  let userBToken: string;
  let projectId: string;
  let secondProjectId: string;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe());
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();

    userAToken = await register(app, 'tracker-a');
    userBToken = await register(app, 'tracker-b');

    const projectResponse = await request(app.getHttpServer())
      .post('/api/projects')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ name: `E2E ${Date.now()}`, timeZone: 'America/La_Paz' })
      .expect(201);
    projectId = projectResponse.body.id as string;

    const secondProjectResponse = await request(app.getHttpServer())
      .post('/api/projects')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ name: `E2E second ${Date.now()}`, timeZone: 'America/La_Paz' })
      .expect(201);
    secondProjectId = secondProjectResponse.body.id as string;
  });

  afterAll(async () => {
    await app.close();
  });

  it('isolates project data between authenticated users', async () => {
    await request(app.getHttpServer())
      .get('/api/projects')
      .set('Authorization', `Bearer ${userBToken}`)
      .expect(200)
      .expect([]);

    await request(app.getHttpServer())
      .get(`/api/projects/${projectId}/tracker`)
      .set('Authorization', `Bearer ${userBToken}`)
      .expect(404);
  });

  it('rejects invalid project input with the validation message', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/projects')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ name: '   ', timeZone: 'America/La_Paz' })
      .expect(400);

    expect(response.body.message).toContain('El nombre del proyecto');
  });

  it('keeps one active journey when start requests race', async () => {
    const responses = await Promise.all([
      request(app.getHttpServer())
        .post(`/api/projects/${projectId}/tracker/start`)
        .set('Authorization', `Bearer ${userAToken}`),
      request(app.getHttpServer())
        .post(`/api/projects/${projectId}/tracker/start`)
        .set('Authorization', `Bearer ${userAToken}`),
    ]);

    expect(responses.every((response) => response.status === 201)).toBe(true);
    expect(responses[0]?.body.openSessionId).toBe(
      responses[1]?.body.openSessionId,
    );
  });

  it('rejects overlapping and future manual ranges', async () => {
    const date = dateOffset(-1);
    const entry = { date, startTime: '10:00', endTime: '11:00' };
    const endpoint = `/api/projects/${projectId}/manual-entries`;

    await request(app.getHttpServer())
      .post(endpoint)
      .set('Authorization', `Bearer ${userAToken}`)
      .send(entry)
      .expect(201);

    await request(app.getHttpServer())
      .post(endpoint)
      .set('Authorization', `Bearer ${userAToken}`)
      .send(entry)
      .expect(409);

    const futureResponse = await request(app.getHttpServer())
      .post(endpoint)
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ ...entry, date: dateOffset(2) })
      .expect(400);

    expect(futureResponse.body.message).toContain(
      'No se permiten registros futuros',
    );
  });

  it('persists rates and returns scoped monetary history for multiple projects', async () => {
    await request(app.getHttpServer())
      .post(`/api/projects/${projectId}/tracker/finish`)
      .set('Authorization', `Bearer ${userAToken}`)
      .expect(201);

    const date = dateOffset(0);
    await request(app.getHttpServer())
      .post(`/api/projects/${projectId}/manual-entries`)
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ date, startTime: '10:00', endTime: '11:00' })
      .expect(201);
    await request(app.getHttpServer())
      .post(`/api/projects/${secondProjectId}/manual-entries`)
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ date, startTime: '11:00', endTime: '13:00' })
      .expect(201);

    await request(app.getHttpServer())
      .patch(`/api/projects/${projectId}/rate`)
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ hourlyRate: 10 })
      .expect(200);
    await request(app.getHttpServer())
      .patch(`/api/projects/${secondProjectId}/rate`)
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ hourlyRate: 20 })
      .expect(200);
    await request(app.getHttpServer())
      .put(`/api/projects/${secondProjectId}/rate-overrides/${date}`)
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ hourlyRate: 25 })
      .expect(200);

    const history = await request(app.getHttpServer())
      .get('/api/history')
      .query({
        period: 'custom',
        startDate: date,
        endDate: date,
        onlyWeekdays: false,
      })
      .set('Authorization', `Bearer ${userAToken}`)
      .expect(200);

    expect(history.body.rows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ projectId, hourlyRate: 10, amountUsd: 10 }),
        expect.objectContaining({
          projectId: secondProjectId,
          hourlyRate: 25,
          amountUsd: 50,
        }),
      ]),
    );
    expect(history.body.totals.amountUsd).toBe(60);

    const projects = await request(app.getHttpServer())
      .get('/api/projects')
      .set('Authorization', `Bearer ${userAToken}`)
      .expect(200);
    expect(projects.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: projectId, hourlyRate: 10 }),
        expect.objectContaining({ id: secondProjectId, hourlyRate: 20 }),
      ]),
    );

    await request(app.getHttpServer())
      .get('/api/history')
      .query({
        period: 'custom',
        startDate: date,
        endDate: date,
        onlyWeekdays: false,
        projectId,
      })
      .set('Authorization', `Bearer ${userBToken}`)
      .expect(404);
  });
});

async function register(app: INestApplication<App>, label: string) {
  const response = await request(app.getHttpServer())
    .post('/api/auth/register')
    .send({
      fullName: `Tracker ${label}`,
      email: `${label}-${Date.now()}@example.com`,
      password: 'Abcdefg!',
    })
    .expect(201);
  expect(response.body.accessToken).toEqual(expect.any(String));
  return response.body.accessToken as string;
}

function dateOffset(offset: number) {
  const date = new Date(Date.now() + offset * 86_400_000);
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/La_Paz',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const values = Object.fromEntries(
    parts.map(({ type, value }) => [type, value]),
  );
  return `${values.year}-${values.month}-${values.day}`;
}
