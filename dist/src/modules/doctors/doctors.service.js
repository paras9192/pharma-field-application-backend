"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DoctorsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const pagination_dto_1 = require("../../common/dto/pagination.dto");
let DoctorsService = class DoctorsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto, addedById) {
        return this.prisma.doctor.create({
            data: { ...dto, addedById },
            include: { territory: true, addedBy: { select: { id: true, name: true } } },
        });
    }
    async findAll(query) {
        const { page = 1, limit = 20, search, territoryId, isActive } = query;
        const { skip, take } = (0, pagination_dto_1.paginate)(page, limit);
        const where = {};
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { specialization: { contains: search, mode: 'insensitive' } },
                { clinicName: { contains: search, mode: 'insensitive' } },
                { hospitalName: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search, mode: 'insensitive' } },
            ];
        }
        if (territoryId)
            where.territoryId = Number(territoryId);
        if (isActive !== undefined)
            where.isActive = isActive === 'true';
        const [data, total] = await Promise.all([
            this.prisma.doctor.findMany({
                where,
                skip,
                take,
                include: {
                    territory: true,
                    addedBy: { select: { id: true, name: true } },
                },
                orderBy: { name: 'asc' },
            }),
            this.prisma.doctor.count({ where }),
        ]);
        return (0, pagination_dto_1.buildPaginatedResponse)(data, total, page, limit);
    }
    async findOne(id) {
        const doctor = await this.prisma.doctor.findUnique({
            where: { id },
            include: {
                territory: { include: { city: { include: { district: { include: { state: true } } } } } },
                addedBy: { select: { id: true, name: true } },
                visits: {
                    orderBy: { visitDate: 'desc' },
                    take: 10,
                    include: { products: true, user: { select: { id: true, name: true } } },
                },
            },
        });
        if (!doctor)
            throw new common_1.NotFoundException('Doctor not found');
        return doctor;
    }
    async update(id, dto) {
        await this.findOne(id);
        return this.prisma.doctor.update({
            where: { id },
            data: dto,
            include: { territory: true },
        });
    }
    async remove(id) {
        await this.findOne(id);
        await this.prisma.doctor.update({ where: { id }, data: { isActive: false } });
        return { message: 'Doctor deactivated successfully' };
    }
};
exports.DoctorsService = DoctorsService;
exports.DoctorsService = DoctorsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DoctorsService);
//# sourceMappingURL=doctors.service.js.map