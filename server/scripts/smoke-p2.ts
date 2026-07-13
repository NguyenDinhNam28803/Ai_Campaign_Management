/**
 * Smoke test P2 (chạy thật, tốn ~$0.001 token gpt-4o-mini).
 * Boot app in-process (worker BullMQ chạy kèm) → generate → poll → kiểm kết quả.
 * Chạy: npx ts-node scripts/smoke-p2.ts
 */
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';

const BASE = 'http://localhost:3399';

async function main() {
  const app = await NestFactory.create(AppModule, { logger: ['error', 'warn'] });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.listen(3399);

  const j = async (path: string, opts: any = {}, token?: string) => {
    const res = await fetch(BASE + path, {
      ...opts,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(opts.headers ?? {}),
      },
    });
    const body = await res.json().catch(() => ({}));
    return { status: res.status, body };
  };

  try {
    const stamp = Date.now();

    const login = await j('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: process.env.SEED_ADMIN_EMAIL,
        password: process.env.SEED_ADMIN_PASSWORD,
      }),
    });
    const token = login.body.accessToken;
    if (!token) throw new Error('Login thất bại: ' + JSON.stringify(login.body));
    console.log('✓ login admin');

    // Set ngân sách AI để pre-check cho qua.
    await j('/organization', {
      method: 'PATCH',
      body: JSON.stringify({ monthlyAiBudgetUsd: 100 }),
    }, token);
    const orgBefore = (await j('/organization', {}, token)).body;
    console.log(`✓ set budget=100, spend hiện tại=${orgBefore.aiSpendPeriodUsd}`);

    const pl = await j('/product-lines', {
      method: 'POST',
      body: JSON.stringify({ name: 'Smoke Line', slug: `smoke-${stamp}` }),
    }, token);
    const camp = await j('/campaigns', {
      method: 'POST',
      body: JSON.stringify({ productLineId: pl.body.id, name: 'Smoke Campaign' }),
    }, token);
    const piece = await j('/content', {
      method: 'POST',
      body: JSON.stringify({
        campaignId: camp.body.id,
        title: 'Lợi ích của cà phê buổi sáng',
        contentType: 'BLOG',
        body: 'Viết một đoạn ngắn giới thiệu.',
      }),
    }, token);
    console.log(`✓ tạo piece ${piece.body.id}`);

    const gen = await j(`/content/${piece.body.id}/generate`, { method: 'POST' }, token);
    if (gen.status !== 202) throw new Error('generate không trả 202: ' + JSON.stringify(gen.body));
    const genId = gen.body.generationId;
    console.log(`✓ enqueue generation ${genId} (status ${gen.body.status})`);

    // Poll tới DONE/FAILED.
    let final: any;
    for (let i = 0; i < 40; i++) {
      await new Promise((r) => setTimeout(r, 2000));
      final = (await j(`/generations/${genId}`, {}, token)).body;
      process.stdout.write(`  … ${final.status}\r`);
      if (final.status === 'DONE' || final.status === 'FAILED') break;
    }
    console.log('');

    if (final.status !== 'DONE') {
      throw new Error(`Generation không DONE: ${final.status} — ${final.error ?? ''}`);
    }
    console.log(
      `✓ DONE — model=${final.model} in=${final.inputTokens} out=${final.outputTokens} cost=$${final.costUsd}`,
    );

    const versions = (await j(`/content/${piece.body.id}/versions`, {}, token)).body;
    const aiVer = versions.find((v: any) => v.source === 'AI_DRAFT');
    if (!aiVer) throw new Error('Không thấy version AI_DRAFT');
    console.log(`✓ version AI_DRAFT #${aiVer.versionNumber} (${aiVer.body.length} ký tự)`);

    const orgAfter = (await j('/organization', {}, token)).body;
    console.log(
      `✓ org spend: ${orgBefore.aiSpendPeriodUsd} → ${orgAfter.aiSpendPeriodUsd} (đã cộng cost)`,
    );

    console.log('\n=== SMOKE P2 PASS ===');
    console.log('\n--- Trích 300 ký tự đầu bài AI sinh ---\n' + aiVer.body.slice(0, 300));
    await app.close();
    process.exit(0);
  } catch (e) {
    console.error('\n✗ SMOKE FAIL:', e);
    await app.close();
    process.exit(1);
  }
}

main();
