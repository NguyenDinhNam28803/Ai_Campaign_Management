import { PrismaClient, Role, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const orgName = process.env.SEED_ORG_NAME ?? 'My Company';
  const adminEmail = process.env.SEED_ADMIN_EMAIL;
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    throw new Error(
      'Thiếu SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD trong .env',
    );
  }

  // 1) Organization singleton — chỉ tạo nếu chưa có.
  const existingOrg = await prisma.organization.findFirst();
  if (existingOrg) {
    console.log(`Organization đã tồn tại: ${existingOrg.name}`);
  } else {
    const org = await prisma.organization.create({
      data: { name: orgName, billingPeriodStart: new Date() },
    });
    console.log(`Đã tạo Organization: ${org.name}`);
  }

  // 2) Admin đầu tiên — idempotent theo email.
  const passwordHash = await bcrypt.hash(adminPassword, 10);
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      fullName: 'System Admin',
      passwordHash,
      role: Role.ADMIN,
      status: UserStatus.ACTIVE,
    },
  });
  console.log(`Admin sẵn sàng: ${admin.email} (role=${admin.role})`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
