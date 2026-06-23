import 'dotenv/config';
import { PrismaClient, RoleName, VisitType, VisitStatus } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcryptjs';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter } as any);

const hash = (p: string) => bcrypt.hash(p, 10);

// Helper — days from today
const daysFromNow = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(0, 0, 0, 0);
  return d;
};

const daysAgo = (n: number) => daysFromNow(-n);

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

  const [superAdminRole, adminRole, mrRole, salesPersonRole] = await Promise.all([
    prisma.role.findUnique({ where: { name: RoleName.SUPER_ADMIN } }),
    prisma.role.findUnique({ where: { name: RoleName.ADMIN } }),
    prisma.role.findUnique({ where: { name: RoleName.MR } }),
    prisma.role.findUnique({ where: { name: RoleName.SALES_PERSON } }),
  ]);

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

  // Sales Persons
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

  // Medical Representatives
  const mr1 = await prisma.user.upsert({
    where: { email: 'amit.desai@pharmafield.com' },
    update: {},
    create: {
      name: 'Amit Desai',
      email: 'amit.desai@pharmafield.com',
      phone: '9666666601',
      passwordHash: await hash('MR@12345'),
      roleId: mrRole!.id,
      employeeCode: 'MR001',
      isActive: true,
      createdById: adminUser.id,
    },
  });

  const mr2 = await prisma.user.upsert({
    where: { email: 'sunita.nair@pharmafield.com' },
    update: {},
    create: {
      name: 'Sunita Nair',
      email: 'sunita.nair@pharmafield.com',
      phone: '9666666602',
      passwordHash: await hash('MR@12345'),
      roleId: mrRole!.id,
      employeeCode: 'MR002',
      isActive: true,
      createdById: adminUser.id,
    },
  });

  console.log('✅ Users created (1 SuperAdmin, 1 Admin, 2 SalesPersons, 2 MRs)');

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
    { shopName: 'Shree Medical Store', ownerName: 'Suresh Patil',   phone: '9800001001', gstNumber: 'GST001MH', address: '12, FC Road, Kothrud, Pune',         territoryId: territory1.id },
    { shopName: 'Bharat Pharma',       ownerName: 'Mahesh Joshi',   phone: '9800001002', gstNumber: 'GST002MH', address: '45, Paud Road, Kothrud, Pune',        territoryId: territory1.id },
    { shopName: 'City Medical Hall',   ownerName: 'Deepak Verma',   phone: '9800001003', gstNumber: 'GST003MH', address: '8, Hadapsar Main Road, Pune',         territoryId: territory2.id },
    { shopName: 'Om Sai Drug House',   ownerName: 'Santosh Rane',   phone: '9800001004', gstNumber: 'GST004MH', address: '22, Magarpatta Road, Hadapsar, Pune', territoryId: territory2.id },
    { shopName: 'Wellness Pharmacy',   ownerName: 'Anita Kulkarni', phone: '9800001005', gstNumber: 'GST005MH', address: '5, Karve Road, Kothrud, Pune',        territoryId: territory1.id },
  ];

  const chemists: any[] = [];
  for (const c of chemistsData) {
    const existing = await prisma.chemist.findFirst({ where: { phone: c.phone } });
    chemists.push(existing ?? await prisma.chemist.create({ data: { ...c, addedById: adminUser.id } }));
  }
  const [c1, c2, c3, c4, c5] = chemists;
  console.log('✅ 5 Chemists created');

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
  console.log('✅ Chemist assignments done (SP1→c1,c2,c5 | SP2→c3,c4)');

  // ─── Doctors ─────────────────────────────────────────────────────────────────
  const doctorsData = [
    { name: 'Dr. Anjali Mehta',    specialization: 'General Physician',  clinicName: 'Mehta Clinic',        phone: '9500001001', address: 'Shop 3, FC Road, Kothrud',          territoryId: territory1.id, addedById: mr1.id },
    { name: 'Dr. Suresh Nair',     specialization: 'Cardiologist',       hospitalName: 'Pune Heart Center', phone: '9500001002', address: '18, Model Colony, Pune',            territoryId: territory1.id, addedById: mr1.id },
    { name: 'Dr. Priya Joshi',     specialization: 'Gynaecologist',      clinicName: 'Joshi Maternity',     phone: '9500001003', address: '7, Karve Road, Kothrud',            territoryId: territory1.id, addedById: mr1.id },
    { name: 'Dr. Ramesh Kulkarni', specialization: 'Diabetologist',      clinicName: 'Diabetes Care Clinic',phone: '9500001004', address: '12, Magarpatta Road, Hadapsar',     territoryId: territory2.id, addedById: mr2.id },
    { name: 'Dr. Kavita Singh',    specialization: 'Paediatrician',      clinicName: 'Kidz Health Clinic',  phone: '9500001005', address: '34, Hadapsar Main Road, Pune',      territoryId: territory2.id, addedById: mr2.id },
    { name: 'Dr. Arun Patil',      specialization: 'ENT Specialist',     clinicName: 'Patil ENT Centre',    phone: '9500001006', address: '9, Bibwewadi Road, Hadapsar',       territoryId: territory2.id, addedById: mr2.id },
  ];

  const doctors: any[] = [];
  for (const d of doctorsData) {
    const existing = await prisma.doctor.findFirst({ where: { phone: d.phone } });
    doctors.push(existing ?? await prisma.doctor.create({ data: d }));
  }
  const [doc1, doc2, doc3, doc4, doc5, doc6] = doctors;
  console.log('✅ 6 Doctors created (3 per MR)');

  // ─── Orders ──────────────────────────────────────────────────────────────────
  const makeNum = (n: number) => `ORD-20260601-${String(n).padStart(4, '0')}`;

  const orderDefs: any[] = [
    {
      orderNumber: makeNum(1), chemistId: c1.id, createdById: sp1.id,
      status: 'DELIVERED', totalAmount: 15000,
      deliveredById: sp1.id, deliveredAt: daysAgo(18),
      items: [
        { productName: 'Amoxicillin 500mg (Box/10)',  quantity: 20, rate: 250 },
        { productName: 'Paracetamol 650mg (Box/10)',  quantity: 50, rate: 100 },
        { productName: 'Cough Syrup 200ml',           quantity: 30, rate: 200 },
      ],
    },
    {
      orderNumber: makeNum(2), chemistId: c2.id, createdById: sp1.id,
      status: 'DELIVERED', totalAmount: 8500,
      deliveredById: sp1.id, deliveredAt: daysAgo(15),
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
      deliveredById: sp2.id, deliveredAt: daysAgo(16),
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
          orderDate: daysAgo(22),
          expectedDelivery: daysAgo(12),
          items: { create: items.map((i: any) => ({ ...i, amount: i.quantity * i.rate })) },
        },
      }),
    );
  }
  const [o1, o2, , o4] = orders;
  console.log('✅ 5 Orders created');

  // ─── Bills ───────────────────────────────────────────────────────────────────
  const billDefs = [
    { billNumber: 'BILL-2026-0001', chemistId: c1.id, orderId: o1.id,  totalAmount: 15000, dueDate: daysFromNow(12), createdById: sp1.id },
    { billNumber: 'BILL-2026-0002', chemistId: c2.id, orderId: o2.id,  totalAmount: 8500,  dueDate: daysFromNow(15), createdById: sp1.id },
    { billNumber: 'BILL-2026-0003', chemistId: c3.id, orderId: o4.id,  totalAmount: 12000, dueDate: daysFromNow(14), createdById: sp2.id },
    { billNumber: 'BILL-2026-0004', chemistId: c5.id, orderId: null,   totalAmount: 3500,  dueDate: daysFromNow(17), createdById: sp1.id },
    { billNumber: 'BILL-2026-0005', chemistId: c4.id, orderId: null,   totalAmount: 9200,  dueDate: daysAgo(5),      createdById: sp2.id }, // OVERDUE
    { billNumber: 'BILL-2026-0006', chemistId: c2.id, orderId: null,   totalAmount: 4800,  dueDate: daysFromNow(3),  createdById: sp1.id }, // DUE SOON
  ];

  const bills: any[] = [];
  for (const b of billDefs) {
    const existing = await prisma.bill.findUnique({ where: { billNumber: b.billNumber } });
    if (existing) { bills.push(existing); continue; }
    bills.push(
      await prisma.bill.create({ data: { ...b, paidAmount: 0, dueAmount: b.totalAmount, status: 'UNPAID' } }),
    );
  }
  const [bill1, bill2, bill3, bill4, bill5, bill6] = bills;
  console.log('✅ 6 Bills created (1 overdue, 1 due-soon, 4 upcoming)');

  // ─── Payments ────────────────────────────────────────────────────────────────
  // Bill 1: two part payments → PARTIAL
  for (const p of [
    { amount: 6000, paymentMode: 'CASH', collectedAt: daysAgo(13), notes: 'First instalment - cash' },
    { amount: 4000, paymentMode: 'UPI',  collectedAt: daysAgo(8),  referenceNumber: 'UPI202600001', notes: 'Second instalment - UPI' },
  ] as any[]) {
    const exists = await prisma.payment.findFirst({ where: { billId: bill1.id, amount: p.amount } });
    if (!exists) await prisma.payment.create({ data: { billId: bill1.id, collectedById: sp1.id, ...p } });
  }
  await prisma.bill.update({ where: { id: bill1.id }, data: { paidAmount: 10000, dueAmount: 5000, status: 'PARTIAL' } });

  // Bill 2: full payment by cheque → PAID
  const b2exists = await prisma.payment.findFirst({ where: { billId: bill2.id } });
  if (!b2exists) {
    await prisma.payment.create({
      data: { billId: bill2.id, amount: 8500, paymentMode: 'CHEQUE', referenceNumber: 'CHQ-45821', collectedById: sp1.id, collectedAt: daysAgo(11), notes: 'Full payment by cheque' },
    });
  }
  await prisma.bill.update({ where: { id: bill2.id }, data: { paidAmount: 8500, dueAmount: 0, status: 'PAID' } });

  // Bill 4: partial cash → PARTIAL
  const b4exists = await prisma.payment.findFirst({ where: { billId: bill4.id } });
  if (!b4exists) {
    await prisma.payment.create({
      data: { billId: bill4.id, amount: 2000, paymentMode: 'CASH', collectedById: sp1.id, collectedAt: daysAgo(9), notes: 'Partial cash collection' },
    });
  }
  await prisma.bill.update({ where: { id: bill4.id }, data: { paidAmount: 2000, dueAmount: 1500, status: 'PARTIAL' } });

  console.log('✅ Payments recorded');

  // ─── Settlements ─────────────────────────────────────────────────────────────
  const settlExists = await prisma.settlement.findFirst({ where: { billId: bill3.id } });
  if (!settlExists) {
    await prisma.settlement.create({
      data: { billId: bill3.id, type: 'GOODS_RETURN', amount: 1500, reason: 'Returned 10 boxes Ciprofloxacin — wrong batch supplied', createdById: sp2.id },
    });
  }
  await prisma.bill.update({ where: { id: bill3.id }, data: { dueAmount: 10500, status: 'UNPAID' } });
  console.log('✅ Settlement applied on Bill 3');

  // ─── Visits (MR1 — Amit Desai) ───────────────────────────────────────────────
  const visitDefs = [
    // Past visits
    {
      userId: mr1.id, visitType: VisitType.DOCTOR, doctorId: doc1.id, territoryId: territory1.id,
      visitDate: daysAgo(10), visitTime: daysAgo(10),
      purpose: 'Product detailing — Amoxicillin & Paracetamol range',
      notes: 'Doctor showed interest in new antibiotic range. Will prescribe trial.',
      followUpDate: daysFromNow(5), followUpNotes: 'Bring samples for new batch',
      followUpDone: false, status: VisitStatus.COMPLETED,
      products: [
        { productName: 'Amoxicillin 500mg', details: 'New packaging demo', quantity: '5 strips' },
        { productName: 'Paracetamol 650mg', details: 'Explained extended release', quantity: '3 strips' },
      ],
    },
    {
      userId: mr1.id, visitType: VisitType.DOCTOR, doctorId: doc2.id, territoryId: territory1.id,
      visitDate: daysAgo(8), visitTime: daysAgo(8),
      purpose: 'Introduction visit — Cardiac product line',
      notes: 'Specialist interested in Atorvastatin 20mg. Wants comparative study data.',
      followUpDate: daysFromNow(7), followUpNotes: 'Bring clinical trial report',
      followUpDone: false, status: VisitStatus.COMPLETED,
      products: [
        { productName: 'Atorvastatin 20mg', details: 'Clinical benefits explained', quantity: '2 boxes' },
      ],
    },
    {
      userId: mr1.id, visitType: VisitType.DOCTOR, doctorId: doc3.id, territoryId: territory1.id,
      visitDate: daysAgo(5), visitTime: daysAgo(5),
      purpose: 'Routine visit — Gynaecology range',
      notes: 'Good reception. Doctor agreed to prescribe Vitamin D3 and Calcium supplements.',
      followUpDate: null, followUpNotes: null,
      followUpDone: false, status: VisitStatus.COMPLETED,
      products: [
        { productName: 'Vitamin D3 Sachets', details: 'Monthly pack introduced', quantity: '10 sachets' },
        { productName: 'Calcium+D3 Tablets', details: 'Pregnancy support range', quantity: '2 bottles' },
      ],
    },
    {
      userId: mr1.id, visitType: VisitType.CHEMIST, chemistId: c1.id, territoryId: territory1.id,
      visitDate: daysAgo(3), visitTime: daysAgo(3),
      purpose: 'Stock check and relationship visit',
      notes: 'Chemist running low on Paracetamol 650mg. Informed SP to prioritise order.',
      followUpDate: null, followUpNotes: null,
      followUpDone: false, status: VisitStatus.COMPLETED,
      products: [
        { productName: 'Paracetamol 650mg', details: 'Reorder requested', quantity: '50 boxes' },
      ],
    },
    // Today's visit
    {
      userId: mr1.id, visitType: VisitType.DOCTOR, doctorId: doc1.id, territoryId: territory1.id,
      visitDate: daysFromNow(0), visitTime: daysFromNow(0),
      purpose: 'Follow-up — Sample delivery for Amoxicillin new batch',
      notes: '',
      followUpDate: null, followUpNotes: null,
      followUpDone: false, status: VisitStatus.PENDING,
      products: [],
    },
    // Upcoming visits
    {
      userId: mr1.id, visitType: VisitType.DOCTOR, doctorId: doc2.id, territoryId: territory1.id,
      visitDate: daysFromNow(2), visitTime: daysFromNow(2),
      purpose: 'Deliver clinical trial report for Atorvastatin',
      notes: '',
      followUpDate: null, followUpNotes: null,
      followUpDone: false, status: VisitStatus.PENDING,
      products: [],
    },

    // MR2 visits (Sunita Nair)
    {
      userId: mr2.id, visitType: VisitType.DOCTOR, doctorId: doc4.id, territoryId: territory2.id,
      visitDate: daysAgo(9), visitTime: daysAgo(9),
      purpose: 'Diabetes management product detailing',
      notes: 'Doctor very interested in Metformin SR. Will prescribe for new patients.',
      followUpDate: daysFromNow(3), followUpNotes: 'Bring patient leaflets',
      followUpDone: false, status: VisitStatus.COMPLETED,
      products: [
        { productName: 'Metformin 500mg SR', details: 'Sustained release explained', quantity: '10 strips' },
        { productName: 'Glimepiride 1mg',    details: 'Add-on therapy explained',   quantity: '5 strips' },
      ],
    },
    {
      userId: mr2.id, visitType: VisitType.DOCTOR, doctorId: doc5.id, territoryId: territory2.id,
      visitDate: daysAgo(6), visitTime: daysAgo(6),
      purpose: 'Paediatric range introduction',
      notes: 'Doctor asked for flavoured syrups. Will coordinate with product team.',
      followUpDate: daysFromNow(10), followUpNotes: 'Check flavoured syrup availability',
      followUpDone: false, status: VisitStatus.COMPLETED,
      products: [
        { productName: 'Amoxicillin Dry Syrup', details: 'Paediatric dose discussed', quantity: '5 bottles' },
        { productName: 'Cetirizine Syrup',      details: 'Allergy management',        quantity: '4 bottles' },
      ],
    },
    {
      userId: mr2.id, visitType: VisitType.DOCTOR, doctorId: doc6.id, territoryId: territory2.id,
      visitDate: daysAgo(4), visitTime: daysAgo(4),
      purpose: 'ENT product detailing',
      notes: 'Introduced Ciprofloxacin ear drops. Doctor will consider for post-surgery patients.',
      followUpDate: null, followUpNotes: null,
      followUpDone: false, status: VisitStatus.COMPLETED,
      products: [
        { productName: 'Ciprofloxacin Ear Drops', details: 'Post-op infection prevention', quantity: '6 units' },
      ],
    },
    {
      userId: mr2.id, visitType: VisitType.CHEMIST, chemistId: c3.id, territoryId: territory2.id,
      visitDate: daysAgo(2), visitTime: daysAgo(2),
      purpose: 'Stock awareness and display check',
      notes: 'Ensured our products are on front shelf. Chemist happy with current supply.',
      followUpDate: null, followUpNotes: null,
      followUpDone: false, status: VisitStatus.COMPLETED,
      products: [],
    },
    {
      userId: mr2.id, visitType: VisitType.DOCTOR, doctorId: doc4.id, territoryId: territory2.id,
      visitDate: daysFromNow(1), visitTime: daysFromNow(1),
      purpose: 'Bring patient leaflets for Metformin SR',
      notes: '',
      followUpDate: null, followUpNotes: null,
      followUpDone: false, status: VisitStatus.PENDING,
      products: [],
    },
  ];

  for (const v of visitDefs) {
    const { products, ...rest } = v;
    const existing = await prisma.visit.findFirst({
      where: { userId: rest.userId, visitDate: rest.visitDate, visitType: rest.visitType,
                doctorId: rest.doctorId ?? undefined, chemistId: rest.chemistId ?? undefined },
    });
    if (!existing) {
      await prisma.visit.create({
        data: {
          ...rest,
          doctorId: rest.doctorId ?? null,
          chemistId: rest.chemistId ?? null,
          products: products.length ? { create: products } : undefined,
        },
      });
    }
  }
  console.log('✅ Visits created (6 for MR1, 5 for MR2)');

  // ─── Attendance ───────────────────────────────────────────────────────────────
  const attendanceUsers = [mr1.id, mr2.id, sp1.id, sp2.id];
  for (const uid of attendanceUsers) {
    for (let i = 7; i >= 1; i--) {
      const date = daysAgo(i);
      date.setHours(0, 0, 0, 0);
      const checkIn = new Date(date);
      checkIn.setHours(9, 15, 0, 0);
      const checkOut = new Date(date);
      checkOut.setHours(18, 30, 0, 0);
      const existing = await prisma.attendance.findUnique({ where: { userId_date: { userId: uid, date } } });
      if (!existing) {
        await prisma.attendance.create({
          data: { userId: uid, date, checkInTime: checkIn, checkOutTime: checkOut, workingHours: 9.25, status: 'PRESENT' },
        });
      }
    }
  }
  console.log('✅ Attendance records created (7 days × 4 field users)');

  // ─── Print summary ────────────────────────────────────────────────────────────
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎉  Seed complete!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n  LOGIN CREDENTIALS');
  console.log('  ─────────────────────────────────────────────────────────────────');
  console.log('  Role          Email                           Password');
  console.log('  ─────────────────────────────────────────────────────────────────');
  console.log('  SUPER_ADMIN   admin@pharmafield.com           Admin@123');
  console.log('  ADMIN         manager@pharmafield.com         Admin@123');
  console.log('  SALES_PERSON  raj.kumar@pharmafield.com       Sales@123');
  console.log('  SALES_PERSON  priya.sharma@pharmafield.com    Sales@123');
  console.log('  MR            amit.desai@pharmafield.com      MR@12345');
  console.log('  MR            sunita.nair@pharmafield.com     MR@12345');
  console.log('  ─────────────────────────────────────────────────────────────────');
  console.log('\n  BILL STATE');
  console.log('  BILL-2026-0001  Shree Medical   ₹15,000  PARTIAL  (₹10k paid, ₹5k due)');
  console.log('  BILL-2026-0002  Bharat Pharma   ₹8,500   PAID     (full cheque)');
  console.log('  BILL-2026-0003  City Medical    ₹12,000  UNPAID   (₹1.5k goods return)');
  console.log('  BILL-2026-0004  Wellness Pharm  ₹3,500   PARTIAL  (₹2k paid, ₹1.5k due)');
  console.log('  BILL-2026-0005  Om Sai Drug     ₹9,200   UNPAID   ⚠ OVERDUE (5 days)');
  console.log('  BILL-2026-0006  Bharat Pharma   ₹4,800   UNPAID   ⚠ DUE IN 3 DAYS');
  console.log('\n  MR VISITS');
  console.log('  Amit Desai  → 4 completed, 1 today (PLANNED), 1 upcoming');
  console.log('  Sunita Nair → 4 completed, 1 upcoming, follow-ups pending');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main()
  .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
