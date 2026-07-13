import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

// Mỗi test gọi nhiều round-trip tới Supabase (ap-northeast-1) — nới timeout.
jest.setTimeout(30000);

/**
 * e2e trên DB Supabase thật (đã migrate + seed).
 * Bao gồm: P0 (health/login/RBAC) + P1 (vòng đời nội dung).
 */
describe('AI Content Platform (e2e)', () => {
  let app: INestApplication<App>;
  let adminToken: string;
  let writerToken: string;
  let productLineId: string;
  let campaignId: string;
  let pieceId: string;

  const http = () => request(app.getHttpServer());
  const auth = (t: string) => ({ Authorization: `Bearer ${t}` });
  const stamp = Date.now();

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    const login = await http()
      .post('/auth/login')
      .send({
        email: process.env.SEED_ADMIN_EMAIL,
        password: process.env.SEED_ADMIN_PASSWORD,
      });
    adminToken = login.body.accessToken;
  });

  afterAll(async () => {
    await app?.close();
  });

  // ── P0 ────────────────────────────────────────────────
  it('GET /health -> 200 (public)', () =>
    http().get('/health').expect(200));

  it('GET /content -> 401 khi thiếu token', () =>
    http().get('/content').expect(401));

  it('login admin trả accessToken', () => {
    expect(adminToken).toBeDefined();
  });

  // ── Chuẩn bị dữ liệu ──────────────────────────────────
  it('admin tạo ProductLine + Campaign', async () => {
    const pl = await http()
      .post('/product-lines')
      .set(auth(adminToken))
      .send({ name: 'P1 Line', slug: `p1-${stamp}` })
      .expect(201);
    productLineId = pl.body.id;

    const c = await http()
      .post('/campaigns')
      .set(auth(adminToken))
      .send({ productLineId, name: 'P1 Campaign' })
      .expect(201);
    campaignId = c.body.id;
  });

  it('admin tạo user WRITER và đăng nhập được', async () => {
    await http()
      .post('/users')
      .set(auth(adminToken))
      .send({
        email: `writer-${stamp}@company.com`,
        fullName: 'Writer QA',
        password: 'Writer@123',
        role: 'WRITER',
      })
      .expect(201);

    const login = await http()
      .post('/auth/login')
      .send({ email: `writer-${stamp}@company.com`, password: 'Writer@123' })
      .expect(201);
    writerToken = login.body.accessToken;
  });

  // ── P1: vòng đời nội dung ─────────────────────────────
  it('tạo bài -> DRAFT + version #1', async () => {
    const res = await http()
      .post('/content')
      .set(auth(adminToken))
      .send({
        campaignId,
        title: 'Bài viết thử',
        contentType: 'BLOG',
        body: 'Nội dung ban đầu.',
      })
      .expect(201);
    pieceId = res.body.id;
    expect(res.body.status).toBe('DRAFT');
    expect(res.body.currentVersion.versionNumber).toBe(1);
    expect(res.body.currentVersion.source).toBe('HUMAN_EDIT');
  });

  it('sửa nội dung -> version #2, giữ lịch sử', async () => {
    await http()
      .post(`/content/${pieceId}/versions`)
      .set(auth(adminToken))
      .send({ body: 'Nội dung đã sửa.' })
      .expect(201);
    const versions = await http()
      .get(`/content/${pieceId}/versions`)
      .set(auth(adminToken))
      .expect(200);
    expect(versions.body).toHaveLength(2);
  });

  it('submit -> IN_REVIEW', async () => {
    const res = await http()
      .post(`/content/${pieceId}/submit`)
      .set(auth(adminToken))
      .expect(201);
    expect(res.body.status).toBe('IN_REVIEW');
  });

  it('WRITER KHÔNG được duyệt -> 403', () =>
    http()
      .post(`/content/${pieceId}/reviews`)
      .set(auth(writerToken))
      .send({ decision: 'APPROVED' })
      .expect(403));

  it('MANAGER/ADMIN duyệt APPROVED -> status APPROVED', async () => {
    const res = await http()
      .post(`/content/${pieceId}/reviews`)
      .set(auth(adminToken))
      .send({ decision: 'APPROVED', comment: 'Ổn' })
      .expect(201);
    expect(res.body.status).toBe('APPROVED');
  });

  it('không được sửa nội dung khi đã rời DRAFT -> 400', () =>
    http()
      .post(`/content/${pieceId}/versions`)
      .set(auth(adminToken))
      .send({ body: 'sửa lén' })
      .expect(400));

  it('request-changes đưa bài mới về DRAFT', async () => {
    const p = await http()
      .post('/content')
      .set(auth(adminToken))
      .send({ campaignId, title: 'Bài 2', contentType: 'SOCIAL', body: 'x' })
      .expect(201);
    await http().post(`/content/${p.body.id}/submit`).set(auth(adminToken)).expect(201);
    const res = await http()
      .post(`/content/${p.body.id}/reviews`)
      .set(auth(adminToken))
      .send({ decision: 'CHANGES_REQUESTED', comment: 'Sửa lại mở bài' })
      .expect(201);
    expect(res.body.status).toBe('DRAFT');
  });
});
