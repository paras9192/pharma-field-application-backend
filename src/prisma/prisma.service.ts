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

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
