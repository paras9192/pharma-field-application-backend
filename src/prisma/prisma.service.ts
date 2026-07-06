import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
    super({
      adapter,
      // Never expose raw GPS coordinates in API responses — the frontend shows
      // human-readable addresses (checkInAddress / locationAddress / address)
      // instead. Applied globally so coordinates can't leak from any query.
      // Writes are unaffected; explicit `select` (e.g. backfill scripts) still
      // overrides this.
      omit: {
        attendance: {
          checkInLat: true,
          checkInLng: true,
          checkOutLat: true,
          checkOutLng: true,
        },
        visit: { lat: true, lng: true },
        doctor: { latitude: true, longitude: true },
        chemist: { latitude: true, longitude: true },
      },
    });
  }

  // Neon's free tier suspends the compute after ~5 min of inactivity, making
  // the next query pay a 3-4s cold start. Ping every 4 min to keep it awake —
  // but only during field-rep working hours (IST), because keeping the compute
  // up 24/7 would consume nearly all of the free plan's ~191 compute-hours/month.
  private keepAlive?: NodeJS.Timeout;

  private static readonly WORK_START_IST = 6; // 6:00 IST
  private static readonly WORK_END_IST = 23; // 23:00 IST

  async onModuleInit() {
    await this.$connect();
    this.keepAlive = setInterval(() => {
      const istHour = Number(
        new Intl.DateTimeFormat('en-US', { hour: 'numeric', hour12: false, timeZone: 'Asia/Kolkata' })
          .format(new Date()),
      );
      if (istHour < PrismaService.WORK_START_IST || istHour >= PrismaService.WORK_END_IST) return;
      this.$queryRaw`SELECT 1`.catch(() => {});
    }, 4 * 60 * 1000);
    this.keepAlive.unref();
  }

  async onModuleDestroy() {
    if (this.keepAlive) clearInterval(this.keepAlive);
    await this.$disconnect();
  }
}
