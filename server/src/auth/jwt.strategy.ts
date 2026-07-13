import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import type { NsConfigType } from '../config/config.types';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import authConfig from '../config/auth.config';
import { AuthUser } from './decorators/current-user.decorator';

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
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.jwtSecret,
    });
  }

  validate(payload: JwtPayload): AuthUser {
    return { userId: payload.sub, email: payload.email, role: payload.role };
  }
}
