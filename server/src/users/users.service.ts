import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, User, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

type SafeUser = Omit<User, 'passwordHash'>;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  private sanitize(user: User): SafeUser {
    const { passwordHash: _omit, ...safe } = user;
    return safe;
  }

  async create(dto: CreateUserDto): Promise<SafeUser> {
    try {
      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          fullName: dto.fullName,
          role: dto.role,
          status: dto.status ?? UserStatus.ACTIVE,
          passwordHash: await bcrypt.hash(dto.password, 10),
        },
      });
      return this.sanitize(user);
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new ConflictException('Email đã tồn tại');
      }
      throw e;
    }
  }

  async findAll(): Promise<SafeUser[]> {
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return users.map((u) => this.sanitize(u));
  }

  async update(id: string, dto: UpdateUserDto): Promise<SafeUser> {
    await this.getOrThrow(id);
    const data: Prisma.UserUpdateInput = {
      fullName: dto.fullName,
      role: dto.role,
      status: dto.status,
    };
    if (dto.password) {
      data.passwordHash = await bcrypt.hash(dto.password, 10);
    }
    const user = await this.prisma.user.update({ where: { id }, data });
    return this.sanitize(user);
  }

  /** Vô hiệu hóa tài khoản (không xóa cứng để giữ lịch sử reviews). */
  async disable(id: string): Promise<SafeUser> {
    await this.getOrThrow(id);
    const user = await this.prisma.user.update({
      where: { id },
      data: { status: UserStatus.DISABLED },
    });
    return this.sanitize(user);
  }

  private async getOrThrow(id: string): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }
    return user;
  }
}
