import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

/**
 * Happy path e2e: health / login / RBAC.
 * Yêu cầu DB thật (Supabase) đã migrate + seed. Nếu chưa cấu hình DATABASE_URL
 * hợp lệ, app không boot được và suite sẽ fail — chạy sau bước migrate/seed.
 */
describe('AI Content Platform (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
  });

  it('GET /health -> 200 (public, không cần token)', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect((res) => {
        expect(res.body.status).toBe('ok');
      });
  });

  it('GET /product-lines -> 401 khi thiếu token', () => {
    return request(app.getHttpServer()).get('/product-lines').expect(401);
  });

  it('POST /auth/login với admin seed -> 201 + accessToken', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: process.env.SEED_ADMIN_EMAIL,
        password: process.env.SEED_ADMIN_PASSWORD,
      })
      .expect(201);
    expect(res.body.accessToken).toBeDefined();
  });

  it('POST /product-lines -> 201 với token ADMIN', async () => {
    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: process.env.SEED_ADMIN_EMAIL,
        password: process.env.SEED_ADMIN_PASSWORD,
      });
    const token = login.body.accessToken;
    await request(app.getHttpServer())
      .post('/product-lines')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'E2E Line', slug: `e2e-${Date.now()}` })
      .expect(201);
  });
});
