import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: { role: true },
    });
    if (!user || !user.isActive) return null;
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return null;
    return user;
  }

  async login(user: any) {
    const payload = { sub: user.id, email: user.email, role: user.role.name };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_SECRET'),
      expiresIn: this.configService.get('JWT_EXPIRES_IN') || '1d',
    });

    const refreshToken = randomBytes(40).toString('hex');
    const tokenHash = createHash('sha256').update(refreshToken).digest('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role.name,
        employeeCode: user.employeeCode,
        profilePhoto: user.profilePhoto,
      },
    };
  }

  async refreshTokens(refreshToken: string) {
    const tokenHash = createHash('sha256').update(refreshToken).digest('hex');

    const stored = await this.prisma.refreshToken.findFirst({
      where: { tokenHash },
      include: { user: { include: { role: true } } },
    });

    if (!stored || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    if (!stored.user.isActive) {
      throw new UnauthorizedException('User is inactive');
    }

    // Delete-as-guard: deleteMany returns a count instead of throwing when the
    // row is already gone. If two refresh requests race on the same token, only
    // the one that actually removes the row proceeds; the loser gets a clean
    // 401 instead of an unhandled P2025 (record not found) 500.
    const { count } = await this.prisma.refreshToken.deleteMany({
      where: { id: stored.id },
    });
    if (count === 0) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    return this.login(stored.user);
  }
  

  async logout(userId: string, refreshToken?: string) {
    if (refreshToken) {
      const tokenHash = createHash('sha256').update(refreshToken).digest('hex');
      await this.prisma.refreshToken.deleteMany({ where: { tokenHash, userId } });
    } else {
      await this.prisma.refreshToken.deleteMany({ where: { userId } });
    }
    return { message: 'Logged out successfully' };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: true,
        employeeTerritories: {
          include: {
            territory: {
              include: {
                city: { include: { district: { include: { state: true } } } },
              },
            },
          },
        },
      },
    });
    if (!user) throw new BadRequestException('User not found');

    const { passwordHash, ...profile } = user;
    return profile;
  }

  generateWelcomeToken(userId: string, email: string): string {
    return this.jwtService.sign(
      { sub: userId, email, type: 'set-password' },
      {
        secret: this.configService.get('JWT_SECRET'),
        expiresIn: '24h',
      },
    );
  }

  async setPassword(token: string, newPassword: string) {
    let payload: any;
    try {
      payload = this.jwtService.verify(token, {
        secret: this.configService.get('JWT_SECRET'),
      });
    } catch {
      throw new ForbiddenException('Invalid or expired link. Please contact your admin.');
    }

    if (payload.type !== 'set-password') {
      throw new ForbiddenException('Invalid token type');
    }

    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) throw new BadRequestException('User not found');

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({ where: { id: payload.sub }, data: { passwordHash } });

    return { message: 'Password set successfully. You can now log in.' };
  }
}
