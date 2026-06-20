"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const client_1 = require("@prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
const bcrypt = __importStar(require("bcryptjs"));
const adapter = new adapter_pg_1.PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new client_1.PrismaClient({ adapter });
async function main() {
    console.log('🌱 Seeding database...');
    const roles = [
        { name: client_1.RoleName.SUPER_ADMIN, description: 'Business owner with full system access' },
        { name: client_1.RoleName.ADMIN, description: 'Office manager with administrative access' },
        { name: client_1.RoleName.MR, description: 'Medical Representative - field employee' },
        { name: client_1.RoleName.SALES_PERSON, description: 'Sales Person - field employee' },
    ];
    for (const role of roles) {
        await prisma.role.upsert({
            where: { name: role.name },
            update: {},
            create: role,
        });
    }
    console.log('✅ Roles created');
    const superAdminRole = await prisma.role.findUnique({ where: { name: client_1.RoleName.SUPER_ADMIN } });
    const passwordHash = await bcrypt.hash('Admin@123', 12);
    await prisma.user.upsert({
        where: { email: 'admin@pharmafield.com' },
        update: {},
        create: {
            name: 'Super Admin',
            email: 'admin@pharmafield.com',
            phone: '9999999999',
            passwordHash,
            roleId: superAdminRole.id,
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
//# sourceMappingURL=seed.js.map