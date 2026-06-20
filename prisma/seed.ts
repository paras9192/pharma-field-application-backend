import { PrismaClient, RoleName } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create roles
  const roles = [
    { name: RoleName.SUPER_ADMIN, description: 'Business owner with full system access' },
    { name: RoleName.ADMIN, description: 'Office manager with administrative access' },
    { name: RoleName.MR, description: 'Medical Representative - field employee' },
    { name: RoleName.SALES_PERSON, description: 'Sales Person - field employee' },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: {},
      create: role,
    });
  }
  console.log('✅ Roles created');

  const superAdminRole = await prisma.role.findUnique({ where: { name: RoleName.SUPER_ADMIN } });

  // Create default Super Admin
  const passwordHash = await bcrypt.hash('Admin@123', 12);
  await prisma.user.upsert({
    where: { email: 'admin@pharmafield.com' },
    update: {},
    create: {
      name: 'Super Admin',
      email: 'admin@pharmafield.com',
      phone: '9999999999',
      passwordHash,
      roleId: superAdminRole!.id,
      employeeCode: 'EMP001',
      isActive: true,
    },
  });
  console.log('✅ Super Admin created — email: admin@pharmafield.com | password: Admin@123');

  console.log('🎉 Seed complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
