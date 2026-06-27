/**
 * One-off backfill: replace coordinate-string / missing attendance addresses
 * with human-readable addresses reverse-geocoded from the stored lat/lng.
 *
 * Targets rows where the address is NULL or looks like "lat, lng".
 * Throttled to ~1 request/sec to respect the Nominatim usage policy.
 *
 * Run:  npx ts-node prisma/scripts/backfill-attendance-address.ts
 */
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const COORDS_RE = /^-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?$/;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function needsGeocode(address: string | null): boolean {
  return !address || COORDS_RE.test(address.trim());
}

async function reverse(lat: number, lng: number): Promise<string | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'PharmaField attendance geocoder', 'Accept-Language': 'en' },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const data: any = await res.json();
    const a = data?.address;
    if (a) {
      const parts = [a.suburb || a.neighbourhood || a.road, a.city || a.town || a.village || a.county, a.state, a.postcode].filter(Boolean);
      if (parts.length) return parts.join(', ');
    }
    return data?.display_name ?? null;
  } catch {
    return null;
  }
}

async function main() {
  const rows = await prisma.attendance.findMany({
    select: { id: true, checkInLat: true, checkInLng: true, checkInAddress: true, checkOutLat: true, checkOutLng: true, checkOutAddress: true },
    orderBy: { date: 'desc' },
  });

  let updated = 0;
  let skipped = 0;

  for (const r of rows) {
    const data: { checkInAddress?: string; checkOutAddress?: string } = {};

    if (r.checkInLat != null && r.checkInLng != null && needsGeocode(r.checkInAddress)) {
      const addr = await reverse(Number(r.checkInLat), Number(r.checkInLng));
      await sleep(1100);
      if (addr) data.checkInAddress = addr;
    }

    if (r.checkOutLat != null && r.checkOutLng != null && needsGeocode(r.checkOutAddress)) {
      const addr = await reverse(Number(r.checkOutLat), Number(r.checkOutLng));
      await sleep(1100);
      if (addr) data.checkOutAddress = addr;
    }

    if (Object.keys(data).length) {
      await prisma.attendance.update({ where: { id: r.id }, data });
      updated++;
      console.log(`  ✓ ${r.id}  in="${data.checkInAddress ?? r.checkInAddress ?? '—'}"  out="${data.checkOutAddress ?? r.checkOutAddress ?? '—'}"`);
    } else {
      skipped++;
    }
  }

  console.log(`\n✅ Done. Updated ${updated} record(s), skipped ${skipped} (already readable or no coords).`);
}

main()
  .catch((e) => { console.error(e); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
