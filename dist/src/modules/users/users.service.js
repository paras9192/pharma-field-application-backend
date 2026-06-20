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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
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
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const bcrypt = __importStar(require("bcryptjs"));
const prisma_service_1 = require("../../prisma/prisma.service");
const pagination_dto_1 = require("../../common/dto/pagination.dto");
const USER_SELECT = {
    id: true,
    name: true,
    email: true,
    phone: true,
    employeeCode: true,
    profilePhoto: true,
    dateOfJoining: true,
    isActive: true,
    createdAt: true,
    updatedAt: true,
    role: { select: { id: true, name: true } },
    createdBy: { select: { id: true, name: true } },
};
let UsersService = class UsersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto, createdById) {
        const [roleRecord, existingEmail, existingPhone] = await Promise.all([
            this.prisma.role.findUnique({ where: { name: dto.role } }),
            this.prisma.user.findUnique({ where: { email: dto.email } }),
            this.prisma.user.findUnique({ where: { phone: dto.phone } }),
        ]);
        if (!roleRecord)
            throw new common_1.BadRequestException(`Role ${dto.role} not found`);
        if (existingEmail)
            throw new common_1.ConflictException('Email already in use');
        if (existingPhone)
            throw new common_1.ConflictException('Phone already in use');
        if (dto.employeeCode) {
            const existing = await this.prisma.user.findUnique({
                where: { employeeCode: dto.employeeCode },
            });
            if (existing)
                throw new common_1.ConflictException('Employee code already in use');
        }
        const passwordHash = await bcrypt.hash(dto.password, 10);
        const user = await this.prisma.user.create({
            data: {
                name: dto.name,
                email: dto.email,
                phone: dto.phone,
                passwordHash,
                roleId: roleRecord.id,
                employeeCode: dto.employeeCode,
                dateOfJoining: dto.dateOfJoining ? new Date(dto.dateOfJoining) : undefined,
                createdById,
            },
            select: USER_SELECT,
        });
        return user;
    }
    async findAll(query) {
        const { page = 1, limit = 20, search, role, isActive } = query;
        const { skip, take } = (0, pagination_dto_1.paginate)(page, limit);
        const where = {};
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search, mode: 'insensitive' } },
                { employeeCode: { contains: search, mode: 'insensitive' } },
            ];
        }
        if (role) {
            where.role = { name: role };
        }
        if (isActive !== undefined) {
            where.isActive = isActive === 'true';
        }
        const [data, total] = await Promise.all([
            this.prisma.user.findMany({ where, skip, take, select: USER_SELECT, orderBy: { createdAt: 'desc' } }),
            this.prisma.user.count({ where }),
        ]);
        return (0, pagination_dto_1.buildPaginatedResponse)(data, total, page, limit);
    }
    async findOne(id) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            select: {
                ...USER_SELECT,
                employeeTerritories: {
                    include: {
                        territory: {
                            include: {
                                city: { include: { district: { include: { state: true } } } },
                            },
                        },
                    },
                },
            },
        });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        return user;
    }
    async update(id, dto) {
        await this.findOne(id);
        if (dto.phone) {
            const existing = await this.prisma.user.findFirst({
                where: { phone: dto.phone, NOT: { id } },
            });
            if (existing)
                throw new common_1.ConflictException('Phone already in use');
        }
        if (dto.employeeCode) {
            const existing = await this.prisma.user.findFirst({
                where: { employeeCode: dto.employeeCode, NOT: { id } },
            });
            if (existing)
                throw new common_1.ConflictException('Employee code already in use');
        }
        return this.prisma.user.update({
            where: { id },
            data: {
                ...dto,
                dateOfJoining: dto.dateOfJoining ? new Date(dto.dateOfJoining) : undefined,
            },
            select: USER_SELECT,
        });
    }
    async toggleActive(id) {
        const user = await this.findOne(id);
        return this.prisma.user.update({
            where: { id },
            data: { isActive: !user.isActive },
            select: USER_SELECT,
        });
    }
    async changePassword(userId, dto) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        const valid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
        if (!valid)
            throw new common_1.BadRequestException('Current password is incorrect');
        const passwordHash = await bcrypt.hash(dto.newPassword, 10);
        await this.prisma.user.update({ where: { id: userId }, data: { passwordHash } });
        return { message: 'Password changed successfully' };
    }
    async adminResetPassword(userId, newPassword) {
        await this.findOne(userId);
        const passwordHash = await bcrypt.hash(newPassword, 10);
        await this.prisma.user.update({ where: { id: userId }, data: { passwordHash } });
        return { message: 'Password reset successfully' };
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsersService);
//# sourceMappingURL=users.service.js.map