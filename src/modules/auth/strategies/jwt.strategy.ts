import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma/prisma.service';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'default-secret',
    });
  }

  // The DB round trip here runs on EVERY authenticated request. With a remote
  // Neon instance that costs ~300ms each time, so cache the lookup briefly.
  // Trade-off: deactivating a user takes up to CACHE_TTL_MS to kick them out.
  private static readonly CACHE_TTL_MS = 60_000;
  private readonly userCache = new Map<string, { user: any; expires: number }>();

  async validate(payload: JwtPayload) {
    const cached = this.userCache.get(payload.sub);
    if (cached && cached.expires > Date.now()) {
      return cached.user;
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: { role: true },
    });
    if (!user || !user.isActive) {
      this.userCache.delete(payload.sub);
      throw new UnauthorizedException('User not found or inactive');
    }

    // Drop expired entries so the map can't grow unbounded over weeks of uptime
    if (this.userCache.size > 500) {
      const now = Date.now();
      for (const [id, entry] of this.userCache) {
        if (entry.expires <= now) this.userCache.delete(id);
      }
    }
    this.userCache.set(payload.sub, { user, expires: Date.now() + JwtStrategy.CACHE_TTL_MS });
    return user;
  }
}
