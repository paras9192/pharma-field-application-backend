/**
 * One-off data backfill: normalize existing rows to match the new DTO-level
 * normalization rules.
 *
 *   users.email          -> lower + trim   (UNIQUE)
 *   users.phone          -> trim           (UNIQUE)
 *   users.employee_code  -> upper + trim   (UNIQUE)
 *   states.code          -> upper + trim   (UNIQUE)
 *   territories.code     -> upper + trim   (UNIQUE)
 *   chemists.email       -> lower + trim
 *   chemists.gst_number  -> upper + trim
 *   doctors.email        -> lower + trim
 *
 * Safety: before touching anything we detect rows that would collapse into a
 * duplicate of a UNIQUE column after normalization. If any are found we abort
 * WITHOUT writing, and print them so they can be resolved by hand.
 *
 * Run:  npx ts-node prisma/scripts/normalize-existing-data.ts
 */
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

type Collision = { table: string; column: string; normalized: string; ids: string[] };

async function findCollisions(): Promise<Collision[]> {
  const collisions: Collision[] = [];

  // email (lower+trim) within users
  const emailDupes = await prisma.$queryRawUnsafe<any[]>(`
    SELECT lower(btrim(email)) AS norm, array_agg(id::text) AS ids
    FROM users GROUP BY lower(btrim(email)) HAVING count(*) > 1`);
  emailDupes.forEach((r) => collisions.push({ table: 'users', column: 'email', normalized: r.norm, ids: r.ids }));

  // phone (trim) within users
  const phoneDupes = await prisma.$queryRawUnsafe<any[]>(`
    SELECT btrim(phone) AS norm, array_agg(id::text) AS ids
    FROM users GROUP BY btrim(phone) HAVING count(*) > 1`);
  phoneDupes.forEach((r) => collisions.push({ table: 'users', column: 'phone', normalized: r.norm, ids: r.ids }));

  // employee_code (upper+trim) within users — ignore NULLs
  const codeDupes = await prisma.$queryRawUnsafe<any[]>(`
    SELECT upper(btrim(employee_code)) AS norm, array_agg(id::text) AS ids
    FROM users WHERE employee_code IS NOT NULL
    GROUP BY upper(btrim(employee_code)) HAVING count(*) > 1`);
  codeDupes.forEach((r) => collisions.push({ table: 'users', column: 'employee_code', normalized: r.norm, ids: r.ids }));

  // states.code (upper+trim)
  const stateDupes = await prisma.$queryRawUnsafe<any[]>(`
    SELECT upper(btrim(code)) AS norm, array_agg(id::text) AS ids
    FROM states GROUP BY upper(btrim(code)) HAVING count(*) > 1`);
  stateDupes.forEach((r) => collisions.push({ table: 'states', column: 'code', normalized: r.norm, ids: r.ids }));

  // territories.code (upper+trim) — ignore NULLs
  const terrDupes = await prisma.$queryRawUnsafe<any[]>(`
    SELECT upper(btrim(code)) AS norm, array_agg(id::text) AS ids
    FROM territories WHERE code IS NOT NULL
    GROUP BY upper(btrim(code)) HAVING count(*) > 1`);
  terrDupes.forEach((r) => collisions.push({ table: 'territories', column: 'code', normalized: r.norm, ids: r.ids }));

  return collisions;
}

async function main() {
  console.log('Checking for normalization collisions on UNIQUE columns...');
  const collisions = await findCollisions();

  if (collisions.length) {
    console.error('\n❌ ABORTED — these rows would violate a UNIQUE constraint after normalization:\n');
    for (const c of collisions) {
      console.error(`  ${c.table}.${c.column} = "${c.normalized}"  →  rows [${c.ids.join(', ')}]`);
    }
    console.error('\nResolve these duplicates manually, then re-run. No data was changed.');
    process.exitCode = 1;
    return;
  }

  console.log('No collisions. Applying normalization in a transaction...\n');

  const result = await prisma.$transaction(async (tx) => {
    const users_email = await tx.$executeRawUnsafe(
      `UPDATE users SET email = lower(btrim(email)) WHERE email <> lower(btrim(email))`);
    const users_phone = await tx.$executeRawUnsafe(
      `UPDATE users SET phone = btrim(phone) WHERE phone <> btrim(phone)`);
    const users_code = await tx.$executeRawUnsafe(
      `UPDATE users SET employee_code = upper(btrim(employee_code)) WHERE employee_code IS NOT NULL AND employee_code <> upper(btrim(employee_code))`);
    const states_code = await tx.$executeRawUnsafe(
      `UPDATE states SET code = upper(btrim(code)) WHERE code <> upper(btrim(code))`);
    const territories_code = await tx.$executeRawUnsafe(
      `UPDATE territories SET code = upper(btrim(code)) WHERE code IS NOT NULL AND code <> upper(btrim(code))`);
    const chemists_email = await tx.$executeRawUnsafe(
      `UPDATE chemists SET email = lower(btrim(email)) WHERE email IS NOT NULL AND email <> lower(btrim(email))`);
    const chemists_gst = await tx.$executeRawUnsafe(
      `UPDATE chemists SET gst_number = upper(btrim(gst_number)) WHERE gst_number IS NOT NULL AND gst_number <> upper(btrim(gst_number))`);
    const doctors_email = await tx.$executeRawUnsafe(
      `UPDATE doctors SET email = lower(btrim(email)) WHERE email IS NOT NULL AND email <> lower(btrim(email))`);

    return { users_email, users_phone, users_code, states_code, territories_code, chemists_email, chemists_gst, doctors_email };
  });

  console.log('✅ Done. Rows updated per column:');
  for (const [k, v] of Object.entries(result)) console.log(`  ${k.padEnd(18)} ${v}`);
}

main()
  .catch((e) => { console.error(e); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
