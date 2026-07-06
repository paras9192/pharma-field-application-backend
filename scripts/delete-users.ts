/**
 * Hard-delete one or more users and ALL their associated data.
 *
 * Usage:
 *   npx ts-node -r tsconfig-paths/register scripts/delete-users.ts <id1> [id2] ...
 *
 * What gets deleted for each user:
 *   - Images they uploaded (visit / bill / doctor / chemist images)
 *   - Their visits (→ cascades VisitProduct, VisitImage)
 *   - Their daily reports
 *   - Bills they created (→ cascades BillImage, Payments on those bills, Settlements on those bills)
 *   - Payments they collected (on other users' bills)
 *   - Settlements they created (on other users' bills)
 *   - Orders they created (→ cascades OrderItem)
 *   - The user row itself (→ cascades RefreshToken, EmployeeTerritory, Attendance,
 *                           SalesPersonChemist, Notification, FcmToken)
 *
 * Nullable FK references are nullified rather than deleted to preserve the
 * integrity of records that belong to other users (e.g. a doctor added by
 * this user stays in the DB, just loses the addedBy reference).
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function deleteUser(userId: string): Promise<void> {
  // Confirm the user exists before starting
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: { select: { name: true } } },
  });

  if (!user) {
    console.warn(`  ⚠ User ${userId} not found — skipping`);
    return;
  }

  console.log(`  Deleting: ${user.name} <${user.email}> [${user.role.name}]`);

  await prisma.$transaction(async (tx) => {
    // ── 1. Nullify nullable FK references so those records survive ────────────

    // Other users created by this user — keep them, just clear the reference
    await tx.user.updateMany({
      where: { createdById: userId },
      data: { createdById: null },
    });

    // Doctors / chemists added by this user
    await tx.doctor.updateMany({
      where: { addedById: userId },
      data: { addedById: null },
    });
    await tx.chemist.updateMany({
      where: { addedById: userId },
      data: { addedById: null },
    });

    // Orders delivered by this user (delivered_by is nullable)
    await tx.order.updateMany({
      where: { deliveredById: userId },
      data: { deliveredById: null },
    });

    // SalesPersonChemist rows where this user was the assigner
    await tx.$executeRaw`
      UPDATE sales_person_chemists SET assigned_by = NULL WHERE assigned_by = ${userId}
    `;

    // ── 2. Delete images this user uploaded on ANY record ─────────────────────
    // These must go before their parent records (visits/bills) are deleted,
    // because uploadedById is a NOT NULL FK with no cascade.
    await tx.visitImage.deleteMany({ where: { uploadedById: userId } });
    await tx.billImage.deleteMany({ where: { uploadedById: userId } });
    await tx.doctorImage.deleteMany({ where: { uploadedById: userId } });
    await tx.chemistImage.deleteMany({ where: { uploadedById: userId } });

    // ── 3. Bills created by this user ─────────────────────────────────────────
    // Must clear child records first (Payment/Settlement have no cascade from Bill).
    const userBillIds = (
      await tx.bill.findMany({ where: { createdById: userId }, select: { id: true } })
    ).map((b) => b.id);

    if (userBillIds.length > 0) {
      await tx.billImage.deleteMany({ where: { billId: { in: userBillIds } } });
      await tx.settlement.deleteMany({ where: { billId: { in: userBillIds } } });
      await tx.payment.deleteMany({ where: { billId: { in: userBillIds } } });
      await tx.bill.deleteMany({ where: { id: { in: userBillIds } } });
    }

    // ── 4. Payments / settlements this user created on OTHER users' bills ─────
    await tx.settlement.deleteMany({ where: { createdById: userId } });
    await tx.payment.deleteMany({ where: { collectedById: userId } });

    // ── 5. Orders created by this user ───────────────────────────────────────
    // Bills that reference these orders must have their FK nullified first
    // (Order → Bill has no cascade and Bill.orderId is nullable).
    const userOrderIds = (
      await tx.order.findMany({ where: { createdById: userId }, select: { id: true } })
    ).map((o) => o.id);

    if (userOrderIds.length > 0) {
      await tx.bill.updateMany({
        where: { orderId: { in: userOrderIds } },
        data: { orderId: null },
      });
      // OrderItem cascades from Order, so this is safe now.
      await tx.order.deleteMany({ where: { createdById: userId } });
    }

    // ── 6. Visits (VisitProduct + VisitImage cascade from Visit) ─────────────
    await tx.visit.deleteMany({ where: { userId } });

    // ── 7. Daily reports ──────────────────────────────────────────────────────
    await tx.dailyReport.deleteMany({ where: { userId } });

    // ── 8. Delete the user row ────────────────────────────────────────────────
    // Cascades: RefreshToken, EmployeeTerritory, Attendance,
    //           SalesPersonChemist, Notification, FcmToken
    await tx.user.delete({ where: { id: userId } });
  }, { timeout: 60_000 });

  console.log(`  ✓ Done\n`);
}

async function main() {
  const userIds = process.argv.slice(2);

  if (userIds.length === 0) {
    console.error(
      'Usage: npx ts-node -r tsconfig-paths/register scripts/delete-users.ts <id1> [id2] ...',
    );
    process.exit(1);
  }

  console.log(`\nDeleting ${userIds.length} user(s)...\n`);

  for (const id of userIds) {
    await deleteUser(id);
  }

  console.log('All done.');
}

main()
  .catch((err) => {
    console.error('\n✗ Fatal error:', err.message ?? err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
