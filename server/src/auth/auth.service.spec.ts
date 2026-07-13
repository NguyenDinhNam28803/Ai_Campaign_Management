import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Role, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: { user: { findUnique: jest.Mock } };
  let jwt: { signAsync: jest.Mock };

  const buildUser = async (overrides = {}) => ({
    id: 'u1',
    email: 'admin@company.com',
    passwordHash: await bcrypt.hash('secret123', 10),
    fullName: 'Admin',
    avatarUrl: null,
    role: Role.ADMIN,
    status: UserStatus.ACTIVE,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  beforeEach(() => {
    prisma = { user: { findUnique: jest.fn() } };
    jwt = { signAsync: jest.fn().mockResolvedValue('signed.jwt.token') };
    service = new AuthService(
      prisma as unknown as PrismaService,
      jwt as unknown as JwtService,
    );
  });

  it('validateUser trả user (không kèm passwordHash) khi mật khẩu đúng', async () => {
    prisma.user.findUnique.mockResolvedValue(await buildUser());
    const result = await service.validateUser('admin@company.com', 'secret123');
    expect(result.email).toBe('admin@company.com');
    expect((result as Record<string, unknown>).passwordHash).toBeUndefined();
  });

  it('validateUser ném Unauthorized khi sai mật khẩu', async () => {
    prisma.user.findUnique.mockResolvedValue(await buildUser());
    await expect(
      service.validateUser('admin@company.com', 'wrong-password'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('validateUser ném Unauthorized khi tài khoản DISABLED', async () => {
    prisma.user.findUnique.mockResolvedValue(
      await buildUser({ status: UserStatus.DISABLED }),
    );
    await expect(
      service.validateUser('admin@company.com', 'secret123'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('login trả accessToken với payload đúng shape', async () => {
    const user = await buildUser();
    const { passwordHash: _omit, ...safe } = user;
    const result = await service.login(safe);
    expect(result.accessToken).toBe('signed.jwt.token');
    expect(jwt.signAsync).toHaveBeenCalledWith({
      sub: 'u1',
      email: 'admin@company.com',
      role: Role.ADMIN,
    });
  });
});
