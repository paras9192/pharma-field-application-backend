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
exports.VisitsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const pagination_dto_1 = require("../../common/dto/pagination.dto");
const role_enum_1 = require("../../common/enums/role.enum");
const mail_service_1 = require("../../mail/mail.service");
const VISIT_INCLUDE = {
    user: { select: { id: true, name: true, employeeCode: true } },
    doctor: { select: { id: true, name: true, specialization: true, email: true, clinicName: true } },
    chemist: { select: { id: true, shopName: true, ownerName: true } },
    territory: { select: { id: true, name: true } },
    products: true,
    images: {
        select: { id: true, url: true, filename: true, createdAt: true,
            uploadedBy: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'asc' },
    },
};
let VisitsService = class VisitsService {
    prisma;
    mail;
    constructor(prisma, mail) {
        this.prisma = prisma;
        this.mail = mail;
    }
    async create(userId, dto) {
        if (dto.visitType === 'DOCTOR' && !dto.doctorId) {
            throw new common_1.BadRequestException('doctorId is required for doctor visits');
        }
        if (dto.visitType === 'CHEMIST' && !dto.chemistId) {
            throw new common_1.BadRequestException('chemistId is required for chemist visits');
        }
        const { products, visitDate, followUpDate, lat, lng, territoryId, locationCapturedAt, ...rest } = dto;
        const visit = await this.prisma.visit.create({
            data: {
                ...rest,
                userId,
                visitDate: new Date(visitDate),
                visitTime: new Date(),
                followUpDate: followUpDate ? new Date(followUpDate) : undefined,
                lat: lat ?? undefined,
                lng: lng ?? undefined,
                territoryId: territoryId ?? undefined,
                locationCapturedAt: locationCapturedAt ? new Date(locationCapturedAt) : undefined,
                products: products?.length ? { create: products } : undefined,
            },
            include: VISIT_INCLUDE,
        });
        this.mail.notifyVisit(visit);
        if (visit.visitType === 'DOCTOR') {
            this.mail.notifyDoctor(visit);
        }
        return visit;
    }
    async findAll(query, currentUser) {
        const { page = 1, limit = 20, search, visitType, from, to, territoryId, followUpPending } = query;
        const { skip, take } = (0, pagination_dto_1.paginate)(page, limit);
        const where = {};
        if (currentUser.role.name === role_enum_1.Role.MR || currentUser.role.name === role_enum_1.Role.SALES_PERSON) {
            where.userId = currentUser.id;
        }
        else if (query.userId) {
            where.userId = query.userId;
        }
        if (visitType)
            where.visitType = visitType;
        if (territoryId)
            where.territoryId = Number(territoryId);
        if (from || to) {
            where.visitDate = {};
            if (from)
                where.visitDate.gte = new Date(from.split('T')[0] + 'T00:00:00.000Z');
            if (to)
                where.visitDate.lte = new Date(to.split('T')[0] + 'T00:00:00.000Z');
        }
        if (followUpPending === 'true') {
            where.followUpDate = { lte: new Date() };
            where.followUpDone = false;
        }
        if (search) {
            where.OR = [
                { doctor: { name: { contains: search, mode: 'insensitive' } } },
                { chemist: { shopName: { contains: search, mode: 'insensitive' } } },
                { notes: { contains: search, mode: 'insensitive' } },
                { purpose: { contains: search, mode: 'insensitive' } },
            ];
        }
        const [data, total] = await Promise.all([
            this.prisma.visit.findMany({
                where,
                skip,
                take,
                include: VISIT_INCLUDE,
                orderBy: { visitDate: 'desc' },
            }),
            this.prisma.visit.count({ where }),
        ]);
        return (0, pagination_dto_1.buildPaginatedResponse)(data, total, page, limit);
    }
    async findOne(id, currentUser) {
        const visit = await this.prisma.visit.findUnique({
            where: { id },
            include: VISIT_INCLUDE,
        });
        if (!visit)
            throw new common_1.NotFoundException('Visit not found');
        if ((currentUser.role.name === role_enum_1.Role.MR || currentUser.role.name === role_enum_1.Role.SALES_PERSON) &&
            visit.userId !== currentUser.id) {
            throw new common_1.ForbiddenException('Access denied');
        }
        return visit;
    }
    async update(id, dto, currentUser) {
        const visit = await this.findOne(id, currentUser);
        if ((currentUser.role.name === role_enum_1.Role.MR || currentUser.role.name === role_enum_1.Role.SALES_PERSON) &&
            visit.userId !== currentUser.id) {
            throw new common_1.ForbiddenException('Cannot update another user\'s visit');
        }
        const { products, followUpDate, ...rest } = dto;
        if (products !== undefined) {
            await this.prisma.visitProduct.deleteMany({ where: { visitId: id } });
        }
        return this.prisma.visit.update({
            where: { id },
            data: {
                ...rest,
                followUpDate: followUpDate ? new Date(followUpDate) : undefined,
                products: products !== undefined ? { create: products } : undefined,
            },
            include: VISIT_INCLUDE,
        });
    }
    async getPendingFollowUps(currentUser) {
        const where = {
            followUpDate: { lte: new Date() },
            followUpDone: false,
        };
        if (currentUser.role.name === role_enum_1.Role.MR || currentUser.role.name === role_enum_1.Role.SALES_PERSON) {
            where.userId = currentUser.id;
        }
        return this.prisma.visit.findMany({
            where,
            include: VISIT_INCLUDE,
            orderBy: { followUpDate: 'asc' },
        });
    }
    async markFollowUpDone(id, currentUser) {
        await this.findOne(id, currentUser);
        return this.prisma.visit.update({
            where: { id },
            data: { followUpDone: true },
            include: VISIT_INCLUDE,
        });
    }
    async uploadImages(id, files, currentUser) {
        await this.findOne(id, currentUser);
        await this.prisma.visitImage.createMany({
            data: files.map((f) => ({
                visitId: id,
                url: f.path,
                filename: f.filename,
                uploadedById: currentUser.id,
            })),
        });
        return this.prisma.visit.findUnique({ where: { id }, include: VISIT_INCLUDE });
    }
    async deleteImage(visitId, imageId, currentUser) {
        await this.findOne(visitId, currentUser);
        const image = await this.prisma.visitImage.findFirst({ where: { id: imageId, visitId } });
        if (!image)
            throw new common_1.NotFoundException('Image not found on this visit');
        if (currentUser.role.name === role_enum_1.Role.MR || currentUser.role.name === role_enum_1.Role.SALES_PERSON) {
            if (image.uploadedById !== currentUser.id) {
                throw new common_1.ForbiddenException('You can only delete images you uploaded');
            }
        }
        await this.prisma.visitImage.delete({ where: { id: imageId } });
        return { message: 'Image deleted' };
    }
};
exports.VisitsService = VisitsService;
exports.VisitsService = VisitsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        mail_service_1.MailService])
], VisitsService);
//# sourceMappingURL=visits.service.js.map