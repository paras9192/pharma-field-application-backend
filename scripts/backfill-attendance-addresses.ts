/**
 * Re-geocode stored attendance check-in / check-out coordinates so historical
 * rows carry the same full address that new check-ins now get.
 *
 * Rows written before the GeocodingService.format() change hold a shortened
 * address ("Sector 62, Noida, Uttar Pradesh, 201309") or, when geocoding failed
 * at the time, the raw "lat, lng" string the client sent. The coordinates are
 * still on the row, so the address can simply be rebuilt.
 *
 * Usage:
 *   npx ts-node -r tsconfig-paths/register scripts/backfill-attendance-addresses.ts            # dry run
 *   npx ts-node -r tsconfig-paths/register scripts/backfill-attendance-addresses.ts --apply    # write
 *   ... --from 2026-07-01 --to 2026-08-06                                                      # limit range
 *
 * Nothing is written without --apply. Nominatim's usage policy allows roughly
 * one request per second, so this sleeps between calls: a month of records for
 * a dozen reps takes a few minutes. Rows whose geocode fails are left untouched
 * and can be retried by running the script again.
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { GeocodingService } from '../src/common/geocoding/geocoding.service';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// The service only reads APP_NAME off ConfigService, so a stub is enough and
// keeps the address formatting identical to what the running API produces.
const geocoding = new GeocodingService({
  get: (key: string) => process.env[key],
} as any);

const NOMINATIM_DELAY_MS = 1100;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? undefined : process.argv[i + 1];
}

async function main() {
  const apply = process.argv.includes('--apply');
  const from = arg('from');
  const to = arg('to');

  const where: any = {};
  if (from || to) {
    where.date = {};
    if (from) where.date.gte = new Date(from);
    if (to) where.date.lte = new Date(to);
  }

  const rows = await prisma.attendance.findMany({
    where,
    orderBy: { date: 'asc' },
    select: {
      id: true,
      date: true,
      checkInLat: true,
      checkInLng: true,
      checkInAddress: true,
      checkOutLat: true,
      checkOutLng: true,
      checkOutAddress: true,
      user: { select: { name: true } },
    },
  });

  console.log(
    `\n${rows.length} attendance row(s) in range — ${apply ? 'APPLYING changes' : 'dry run, nothing will be written'}\n`,
  );

  let updated = 0;
  let failed = 0;

  for (const row of rows) {
    const data: { checkInAddress?: string; checkOutAddress?: string } = {};

    for (const side of ['checkIn', 'checkOut'] as const) {
      const lat = row[`${side}Lat`];
      const lng = row[`${side}Lng`];
      if (lat === null || lng === null) continue;

      const fresh = await geocoding.reverse(Number(lat), Number(lng));
      await sleep(NOMINATIM_DELAY_MS);

      if (!fresh) {
        failed++;
        continue;
      }
      const current = row[`${side}Address`];
      if (fresh !== current) data[`${side}Address`] = fresh;
    }

    if (!Object.keys(data).length) continue;

    const day = row.date.toISOString().slice(0, 10);
    console.log(`${day}  ${row.user.name}`);
    if (data.checkInAddress) console.log(`   in : ${row.checkInAddress}\n     → ${data.checkInAddress}`);
    if (data.checkOutAddress) console.log(`   out: ${row.checkOutAddress}\n     → ${data.checkOutAddress}`);

    if (apply) await prisma.attendance.update({ where: { id: row.id }, data });
    updated++;
  }

  console.log(
    `\n${apply ? 'Updated' : 'Would update'} ${updated} row(s)` +
      (failed ? `; ${failed} geocode lookup(s) failed and were skipped — rerun to retry.` : '.'),
  );
  if (!apply && updated) console.log('Rerun with --apply to write these changes.\n');
}

main()
  .catch((err) => {
    console.error('\n✗ Fatal error:', err.message ?? err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
