import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import type { NsConfigType } from '../config/config.types';
import { PassportStrategy } from '@nestjs/passport';
import type { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import authConfig from '../config/auth.config';
import { ACCESS_TOKEN_COOKIE } from './auth.constants';
import { AuthUser } from './decorators/current-user.decorator';

/** Lấy JWT từ httpOnly cookie (web) — ưu tiên; hoặc Bearer header (API/agent). */
const fromCookie = (req: Request): string | null =>
  (req?.cookies?.[ACCESS_TOKEN_COOKIE] as string | undefined) ?? null;

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @Inject(authConfig.KEY)
    config: NsConfigType<typeof authConfig>,
  ) {
    if (!config.jwtSecret) {
      throw new UnauthorizedException('JWT_SECRET chưa cấu hình');
    }
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        fromCookie,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: config.jwtSecret,
    });
  }

  validate(payload: JwtPayload): AuthUser {
    return { userId: payload.sub, email: payload.email, role: payload.role };
  }
}
