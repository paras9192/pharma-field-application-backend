import 'dotenv/config';
import { PrismaClient, RoleName } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcryptjs';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  console.log('🌱 Seeding database...');

  // ─── Roles ───────────────────────────────────────────────────────────────────
  const roleData = [
    { name: RoleName.SUPER_ADMIN, description: 'Business owner with full system access' },
    { name: RoleName.ADMIN,       description: 'Office manager with administrative access' },
    { name: RoleName.MR,          description: 'Medical Representative - field employee' },
    { name: RoleName.SALES_PERSON,description: 'Sales Person - field employee' },
  ];
  for (const r of roleData) {
    await prisma.role.upsert({ where: { name: r.name }, update: {}, create: r });
  }
  console.log('✅ Roles created');

  const [superAdminRole, adminRole, salesPersonRole] = await Promise.all([
    prisma.role.findUnique({ where: { name: RoleName.SUPER_ADMIN } }),
    prisma.role.findUnique({ where: { name: RoleName.ADMIN } }),
    prisma.role.findUnique({ where: { name: RoleName.SALES_PERSON } }),
  ]);

  const hash = (p: string) => bcrypt.hash(p, 10);

  // ─── Users ───────────────────────────────────────────────────────────────────
  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@pharmafield.com' },
    update: {},
    create: {
      name: 'Super Admin',
      email: 'admin@pharmafield.com',
      phone: '9999999999',
      passwordHash: await hash('Admin@123'),
      roleId: superAdminRole!.id,
      employeeCode: 'EMP001',
      isActive: true,
    },
  });

  const adminUser = await prisma.user.upsert({
    where: { email: 'manager@pharmafield.com' },
    update: {},
    create: {
      name: 'Ravi Mehta',
      email: 'manager@pharmafield.com',
      phone: '9888888801',
      passwordHash: await hash('Admin@123'),
      roleId: adminRole!.id,
      employeeCode: 'EMP002',
      isActive: true,
      createdById: superAdmin.id,
    },
  });

  const sp1 = await prisma.user.upsert({
    where: { email: 'raj.kumar@pharmafield.com' },
    update: {},
    create: {
      name: 'Raj Kumar',
      email: 'raj.kumar@pharmafield.com',
      phone: '9777777701',
      passwordHash: await hash('Sales@123'),
      roleId: salesPersonRole!.id,
      employeeCode: 'SP001',
      isActive: true,
      createdById: adminUser.id,
    },
  });

  const sp2 = await prisma.user.upsert({
    where: { email: 'priya.sharma@pharmafield.com' },
    update: {},
    create: {
      name: 'Priya Sharma',
      email: 'priya.sharma@pharmafield.com',
      phone: '9777777702',
      passwordHash: await hash('Sales@123'),
      roleId: salesPersonRole!.id,
      employeeCode: 'SP002',
      isActive: true,
      createdById: adminUser.id,
    },
  });
  console.log('✅ Users created');

  // ─── Territory Hierarchy ─────────────────────────────────────────────────────
  const state = await prisma.state.upsert({
    where: { code: 'MH' },
    update: {},
    create: { name: 'Maharashtra', code: 'MH' },
  });

  const district = await prisma.district.upsert({
    where: { name_stateId: { name: 'Pune', stateId: state.id } },
    update: {},
    create: { name: 'Pune', stateId: state.id },
  });

  const city = await prisma.city.upsert({
    where: { name_districtId: { name: 'Pune City', districtId: district.id } },
    update: {},
    create: { name: 'Pune City', districtId: district.id },
  });

  const territory1 = await prisma.territory.upsert({
    where: { code: 'TER-KOTHRUD' },
    update: {},
    create: { name: 'Kothrud', code: 'TER-KOTHRUD', cityId: city.id },
  });

  const territory2 = await prisma.territory.upsert({
    where: { code: 'TER-HADAPSAR' },
    update: {},
    create: { name: 'Hadapsar', code: 'TER-HADAPSAR', cityId: city.id },
  });
  console.log('✅ Territories created (Kothrud, Hadapsar — Pune, Maharashtra)');

  // ─── Chemists (Parties) ──────────────────────────────────────────────────────
  const chemistsData = [
    { shopName: 'Shree Medical Store', ownerName: 'Suresh Patil',   phone: '9800001001', gstNumber: 'GST001MH', address: '12, FC Road, Kothrud, Pune',          territoryId: territory1.id },
    { shopName: 'Bharat Pharma',       ownerName: 'Mahesh Joshi',   phone: '9800001002', gstNumber: 'GST002MH', address: '45, Paud Road, Kothrud, Pune',         territoryId: territory1.id },
    { shopName: 'City Medical Hall',   ownerName: 'Deepak Verma',   phone: '9800001003', gstNumber: 'GST003MH', address: '8, Hadapsar Main Road, Pune',          territoryId: territory2.id },
    { shopName: 'Om Sai Drug House',   ownerName: 'Santosh Rane',   phone: '9800001004', gstNumber: 'GST004MH', address: '22, Magarpatta Road, Hadapsar, Pune',  territoryId: territory2.id },
    { shopName: 'Wellness Pharmacy',   ownerName: 'Anita Kulkarni', phone: '9800001005', gstNumber: 'GST005MH', address: '5, Karve Road, Kothrud, Pune',         territoryId: territory1.id },
  ];

  const chemists: any[] = [];
  for (const c of chemistsData) {
    const existing = await prisma.chemist.findFirst({ where: { phone: c.phone } });
    chemists.push(
      existing ?? await prisma.chemist.create({ data: { ...c, addedById: adminUser.id } }),
    );
  }
  const [c1, c2, c3, c4, c5] = chemists;
  console.log('✅ 5 Chemists (parties) created');

  // ─── Assign Chemists to Sales Persons ────────────────────────────────────────
  const assignments = [
    { userId: sp1.id, chemistId: c1.id },
    { userId: sp1.id, chemistId: c2.id },
    { userId: sp1.id, chemistId: c5.id },
    { userId: sp2.id, chemistId: c3.id },
    { userId: sp2.id, chemistId: c4.id },
  ];
  for (const a of assignments) {
    await prisma.salesPersonChemist.upsert({
      where: { userId_chemistId: { userId: a.userId, chemistId: a.chemistId } },
      update: {},
      create: { ...a, assignedById: adminUser.id },
    });
  }
  console.log('✅ Chemist assignments done');
  console.log('   Raj Kumar    → Shree Medical Store, Bharat Pharma, Wellness Pharmacy');
  console.log('   Priya Sharma → City Medical Hall, Om Sai Drug House');

  // ─── Orders ──────────────────────────────────────────────────────────────────
  const makeNum = (n: number) => `ORD-20260601-${String(n).padStart(4, '0')}`;

  const orderDefs: any[] = [
    {
      orderNumber: makeNum(1), chemistId: c1.id, createdById: sp1.id,
      status: 'DELIVERED', totalAmount: 15000,
      deliveredById: sp1.id, deliveredAt: new Date('2026-06-05'),
      items: [
        { productName: 'Amoxicillin 500mg (Box/10)',  quantity: 20, rate: 250 },
        { productName: 'Paracetamol 650mg (Box/10)',  quantity: 50, rate: 100 },
        { productName: 'Cough Syrup 200ml',           quantity: 30, rate: 200 },
      ],
    },
    {
      orderNumber: makeNum(2), chemistId: c2.id, createdById: sp1.id,
      status: 'DELIVERED', totalAmount: 8500,
      deliveredById: sp1.id, deliveredAt: new Date('2026-06-08'),
      items: [
        { productName: 'Metformin 500mg (Box/10)',    quantity: 30, rate: 150 },
        { productName: 'Atorvastatin 10mg (Box/10)',  quantity: 20, rate: 200 },
        { productName: 'Vitamin D3 Sachets',          quantity: 50, rate: 70  },
      ],
    },
    {
      orderNumber: makeNum(3), chemistId: c5.id, createdById: sp1.id,
      status: 'DISPATCHED', totalAmount: 5200,
      deliveredById: null, deliveredAt: null,
      items: [
        { productName: 'Azithromycin 500mg (Strip)',  quantity: 40, rate: 80  },
        { productName: 'Pantoprazole 40mg (Box/10)',  quantity: 30, rate: 120 },
      ],
    },
    {
      orderNumber: makeNum(4), chemistId: c3.id, createdById: sp2.id,
      status: 'DELIVERED', totalAmount: 12000,
      deliveredById: sp2.id, deliveredAt: new Date('2026-06-07'),
      items: [
        { productName: 'Ciprofloxacin 500mg (Box/10)', quantity: 25, rate: 180 },
        { productName: 'Ibuprofen 400mg (Box/10)',      quantity: 40, rate: 90  },
        { productName: 'Multivitamin Tablets (Bottle)', quantity: 20, rate: 225 },
      ],
    },
    {
      orderNumber: makeNum(5), chemistId: c4.id, createdById: sp2.id,
      status: 'PENDING', totalAmount: 7800,
      deliveredById: null, deliveredAt: null,
      items: [
        { productName: 'Cetirizine 10mg (Box/10)',     quantity: 50, rate: 60  },
        { productName: 'Omeprazole 20mg (Box/10)',     quantity: 40, rate: 105 },
        { productName: 'Calcium+D3 Tablets (Bottle)', quantity: 20, rate: 150 },
      ],
    },
  ];

  const orders: any[] = [];
  for (const o of orderDefs) {
    const existing = await prisma.order.findUnique({ where: { orderNumber: o.orderNumber } });
    if (existing) { orders.push(existing); continue; }
    const { items, ...rest } = o;
    orders.push(
      await prisma.order.create({
        data: {
          ...rest,
          orderDate: new Date('2026-06-01'),
          expectedDelivery: new Date('2026-06-10'),
          items: { create: items.map((i: any) => ({ ...i, amount: i.quantity * i.rate })) },
        },
      }),
    );
  }
  const [o1, o2, , o4] = orders;
  console.log('✅ 5 Orders created (2 delivered SP1, 1 dispatched SP1, 1 delivered SP2, 1 pending SP2)');

  // ─── Bills ───────────────────────────────────────────────────────────────────
  const billDefs = [
    { billNumber: 'BILL-20260605-0001', chemistId: c1.id, orderId: o1.id,  totalAmount: 15000, dueDate: new Date('2026-07-05'), createdById: sp1.id },
    { billNumber: 'BILL-20260608-0002', chemistId: c2.id, orderId: o2.id,  totalAmount: 8500,  dueDate: new Date('2026-07-08'), createdById: sp1.id },
    { billNumber: 'BILL-20260607-0003', chemistId: c3.id, orderId: o4.id,  totalAmount: 12000, dueDate: new Date('2026-07-07'), createdById: sp2.id },
    { billNumber: 'BILL-20260610-0004', chemistId: c5.id, orderId: null,   totalAmount: 3500,  dueDate: new Date('2026-07-10'), createdById: sp1.id },
  ];

  const bills: any[] = [];
  for (const b of billDefs) {
    const existing = await prisma.bill.findUnique({ where: { billNumber: b.billNumber } });
    if (existing) { bills.push(existing); continue; }
    bills.push(
      await prisma.bill.create({ data: { ...b, paidAmount: 0, dueAmount: b.totalAmount, status: 'UNPAID' } }),
    );
  }
  const [bill1, bill2, bill3, bill4] = bills;
  console.log('✅ 4 Bills created');

  // ─── Payments ────────────────────────────────────────────────────────────────
  // Bill 1: two part payments ₹6000 cash + ₹4000 UPI → PARTIAL, ₹5000 remaining
  for (const p of [
    { amount: 6000, paymentMode: 'CASH', collectedAt: new Date('2026-06-10'), notes: 'First instalment - cash' },
    { amount: 4000, paymentMode: 'UPI',  collectedAt: new Date('2026-06-15'), referenceNumber: 'UPI20260615123', notes: 'Second instalment - UPI' },
  ] as any[]) {
    const exists = await prisma.payment.findFirst({ where: { billId: bill1.id, amount: p.amount } });
    if (!exists) await prisma.payment.create({ data: { billId: bill1.id, collectedById: sp1.id, ...p } });
  }
  await prisma.bill.update({ where: { id: bill1.id }, data: { paidAmount: 10000, dueAmount: 5000, status: 'PARTIAL' } });

  // Bill 2: full payment by cheque → PAID
  const b2exists = await prisma.payment.findFirst({ where: { billId: bill2.id } });
  if (!b2exists) {
    await prisma.payment.create({
      data: { billId: bill2.id, amount: 8500, paymentMode: 'CHEQUE', referenceNumber: 'CHQ-45821', collectedById: sp1.id, collectedAt: new Date('2026-06-12'), notes: 'Full payment by cheque' },
    });
  }
  await prisma.bill.update({ where: { id: bill2.id }, data: { paidAmount: 8500, dueAmount: 0, status: 'PAID' } });

  // Bill 4: partial cash ₹2000 → PARTIAL, ₹1500 remaining
  const b4exists = await prisma.payment.findFirst({ where: { billId: bill4.id } });
  if (!b4exists) {
    await prisma.payment.create({
      data: { billId: bill4.id, amount: 2000, paymentMode: 'CASH', collectedById: sp1.id, collectedAt: new Date('2026-06-14'), notes: 'Partial cash collection' },
    });
  }
  await prisma.bill.update({ where: { id: bill4.id }, data: { paidAmount: 2000, dueAmount: 1500, status: 'PARTIAL' } });

  console.log('✅ Payments recorded');

  // ─── Settlements ─────────────────────────────────────────────────────────────
  // Bill 3: ₹1500 goods return (wrong batch) → due reduces to ₹10,500
  const settlExists = await prisma.settlement.findFirst({ where: { billId: bill3.id } });
  if (!settlExists) {
    await prisma.settlement.create({
      data: { billId: bill3.id, type: 'GOODS_RETURN', amount: 1500, reason: 'Returned 10 boxes Ciprofloxacin — wrong batch supplied', createdById: sp2.id },
    });
  }
  await prisma.bill.update({ where: { id: bill3.id }, data: { dueAmount: 10500, status: 'UNPAID' } });

  console.log('✅ Goods return settlement applied on Bill 3');

  // ─── Done ─────────────────────────────────────────────────────────────────────
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎉  Seed complete!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n  Logins');
  console.log('  SUPER_ADMIN  admin@pharmafield.com         Admin@123');
  console.log('  ADMIN        manager@pharmafield.com       Admin@123');
  console.log('  SALES SP1    raj.kumar@pharmafield.com    Sales@123');
  console.log('  SALES SP2    priya.sharma@pharmafield.com Sales@123');
  console.log('\n  SP1 parties  → Shree Medical Store · Bharat Pharma · Wellness Pharmacy');
  console.log('  SP2 parties  → City Medical Hall · Om Sai Drug House');
  console.log('\n  Bill state');
  console.log('  BILL-01  Shree Medical   ₹15,000  PARTIAL  (₹10k paid cash+UPI, ₹5k due)');
  console.log('  BILL-02  Bharat Pharma   ₹8,500   PAID     (full cheque)');
  console.log('  BILL-03  City Medical    ₹12,000  UNPAID   (₹1.5k goods return → ₹10,500 due)');
  console.log('  BILL-04  Wellness Pharm  ₹3,500   PARTIAL  (₹2k cash, ₹1.5k due)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main()
  .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
