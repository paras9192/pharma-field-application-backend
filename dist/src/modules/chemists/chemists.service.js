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
exports.ChemistsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const pagination_dto_1 = require("../../common/dto/pagination.dto");
const role_enum_1 = require("../../common/enums/role.enum");
const CHEMIST_INCLUDE = {
    territory: true,
    addedBy: { select: { id: true, name: true } },
    salesPersons: { select: { user: { select: { id: true, name: true } } }, take: 1 },
    images: {
        select: { id: true, url: true, filename: true, createdAt: true,
            uploadedBy: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'asc' },
    },
};
let ChemistsService = class ChemistsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getAssignedChemistIds(userId) {
        const rows = await this.prisma.salesPersonChemist.findMany({
            where: { userId },
            select: { chemistId: true },
        });
        return rows.map((r) => r.chemistId);
    }
    withAssignedSalesPerson(chemist) {
        const { salesPersons, ...rest } = chemist;
        return {
            ...rest,
            assignedSalesPerson: salesPersons?.[0]?.user ?? null,
        };
    }
    async create(dto, addedById) {
        const { latitude, longitude, locationCapturedAt, ...rest } = dto;
        return this.prisma.chemist.create({
            data: {
                ...rest,
                addedById,
                latitude: latitude ?? undefined,
                longitude: longitude ?? undefined,
                locationCapturedAt: locationCapturedAt ? new Date(locationCapturedAt) : undefined,
            },
            include: CHEMIST_INCLUDE,
        });
    }
    async findAll(query, currentUser) {
        const { page = 1, limit = 20, search, territoryId, isActive } = query;
        const { skip, take } = (0, pagination_dto_1.paginate)(page, limit);
        const where = {};
        if (currentUser?.role?.name === role_enum_1.Role.SALES_PERSON) {
            const assignedIds = await this.getAssignedChemistIds(currentUser.id);
            where.id = { in: assignedIds };
        }
        if (search) {
            where.OR = [
                { shopName: { contains: search, mode: 'insensitive' } },
                { ownerName: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search, mode: 'insensitive' } },
                { gstNumber: { contains: search, mode: 'insensitive' } },
            ];
        }
        if (territoryId)
            where.territoryId = Number(territoryId);
        if (isActive !== undefined)
            where.isActive = isActive === 'true';
        const [data, total] = await Promise.all([
            this.prisma.chemist.findMany({
                where,
                skip,
                take,
                include: CHEMIST_INCLUDE,
                orderBy: { shopName: 'asc' },
            }),
            this.prisma.chemist.count({ where }),
        ]);
        return (0, pagination_dto_1.buildPaginatedResponse)(data.map((c) => this.withAssignedSalesPerson(c)), total, page, limit);
    }
    async findOne(id) {
        const chemist = await this.prisma.chemist.findUnique({
            where: { id },
            include: {
                territory: { include: { city: { include: { district: { include: { state: true } } } } } },
                addedBy: { select: { id: true, name: true } },
                salesPersons: { select: { user: { select: { id: true, name: true } } }, take: 1 },
                images: {
                    select: { id: true, url: true, filename: true, createdAt: true,
                        uploadedBy: { select: { id: true, name: true } } },
                    orderBy: { createdAt: 'asc' },
                },
                visits: {
                    orderBy: { visitDate: 'desc' },
                    take: 10,
                    include: { products: true, user: { select: { id: true, name: true } } },
                },
            },
        });
        if (!chemist)
            throw new common_1.NotFoundException('Chemist not found');
        return this.withAssignedSalesPerson(chemist);
    }
    async update(id, dto, currentUser) {
        const chemist = await this.prisma.chemist.findUnique({
            where: { id },
            select: { addedById: true },
        });
        if (!chemist)
            throw new common_1.NotFoundException('Chemist not found');
        if (currentUser.role.name === role_enum_1.Role.MR || currentUser.role.name === role_enum_1.Role.SALES_PERSON) {
            if (chemist.addedById !== currentUser.id) {
                throw new common_1.ForbiddenException('You can only edit chemists you created');
            }
        }
        return this.prisma.chemist.update({
            where: { id },
            data: dto,
            include: CHEMIST_INCLUDE,
        });
    }
    async remove(id) {
        await this.findOne(id);
        await this.prisma.chemist.update({ where: { id }, data: { isActive: false } });
        return { message: 'Chemist deactivated successfully' };
    }
    async uploadImages(id, files, currentUser) {
        const chemist = await this.prisma.chemist.findUnique({ where: { id } });
        if (!chemist)
            throw new common_1.NotFoundException('Chemist not found');
        await this.prisma.chemistImage.createMany({
            data: files.map((f) => ({
                chemistId: id,
                url: f.path,
                filename: f.filename,
                uploadedById: currentUser.id,
            })),
        });
        return this.findOne(id);
    }
    async deleteImage(chemistId, imageId, currentUser) {
        const image = await this.prisma.chemistImage.findFirst({ where: { id: imageId, chemistId } });
        if (!image)
            throw new common_1.NotFoundException('Image not found on this chemist');
        if (currentUser.role.name === role_enum_1.Role.MR || currentUser.role.name === role_enum_1.Role.SALES_PERSON) {
            if (image.uploadedById !== currentUser.id) {
                throw new common_1.ForbiddenException('You can only delete images you uploaded');
            }
        }
        await this.prisma.chemistImage.delete({ where: { id: imageId } });
        return { message: 'Image deleted' };
    }
};
exports.ChemistsService = ChemistsService;
exports.ChemistsService = ChemistsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ChemistsService);
//# sourceMappingURL=chemists.service.js.map