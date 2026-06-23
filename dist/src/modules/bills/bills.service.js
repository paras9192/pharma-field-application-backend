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
exports.BillsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const pagination_dto_1 = require("../../common/dto/pagination.dto");
const role_enum_1 = require("../../common/enums/role.enum");
const chemists_service_1 = require("../chemists/chemists.service");
function assertNotMR(currentUser) {
    if (currentUser?.role?.name === role_enum_1.Role.MR) {
        throw new common_1.UnauthorizedException('MR users do not have access to bills');
    }
}
const BILL_INCLUDE = {
    chemist: { select: { id: true, shopName: true, ownerName: true, phone: true } },
    order: { select: { id: true, orderNumber: true, status: true } },
    createdBy: { select: { id: true, name: true, employeeCode: true } },
    payments: {
        select: { id: true, amount: true, paymentMode: true, referenceNumber: true, collectedAt: true, notes: true },
        orderBy: { collectedAt: 'desc' },
    },
    settlements: {
        select: { id: true, type: true, amount: true, reason: true, createdAt: true,
            createdBy: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
    },
    images: {
        select: { id: true, url: true, filename: true, createdAt: true,
            uploadedBy: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'asc' },
    },
};
let BillsService = class BillsService {
    prisma;
    chemistsService;
    constructor(prisma, chemistsService) {
        this.prisma = prisma;
        this.chemistsService = chemistsService;
    }
    generateBillNumber() {
        const now = new Date();
        const ts = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
        const rand = Math.floor(1000 + Math.random() * 9000);
        return `BILL-${ts}-${rand}`;
    }
    async create(userId, dto, currentUser) {
        assertNotMR(currentUser);
        if (currentUser?.role?.name === role_enum_1.Role.SALES_PERSON) {
            throw new common_1.ForbiddenException('Sales Person cannot create bills');
        }
        const chemist = await this.prisma.chemist.findUnique({ where: { id: dto.chemistId } });
        if (!chemist)
            throw new common_1.NotFoundException('Chemist not found');
        if (dto.orderId) {
            const order = await this.prisma.order.findUnique({ where: { id: dto.orderId } });
            if (!order)
                throw new common_1.NotFoundException('Order not found');
        }
        return this.prisma.bill.create({
            data: {
                billNumber: this.generateBillNumber(),
                chemistId: dto.chemistId,
                orderId: dto.orderId,
                totalAmount: dto.totalAmount,
                dueAmount: dto.totalAmount,
                dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
                notes: dto.notes,
                createdById: userId,
            },
            include: BILL_INCLUDE,
        });
    }
    async findAll(query, currentUser) {
        const { page = 1, limit = 20, search, status, from, to } = query;
        const { skip, take } = (0, pagination_dto_1.paginate)(page, limit);
        const where = {};
        if (currentUser.role.name === role_enum_1.Role.SALES_PERSON) {
            const assignedIds = await this.chemistsService.getAssignedChemistIds(currentUser.id);
            where.chemistId = { in: assignedIds };
        }
        if (query.chemistId)
            where.chemistId = query.chemistId;
        if (status)
            where.status = status;
        if (from || to) {
            where.createdAt = {};
            if (from)
                where.createdAt.gte = new Date(from);
            if (to)
                where.createdAt.lte = new Date(to);
        }
        if (search) {
            where.OR = [
                { billNumber: { contains: search, mode: 'insensitive' } },
                { chemist: { shopName: { contains: search, mode: 'insensitive' } } },
            ];
        }
        const [data, total] = await Promise.all([
            this.prisma.bill.findMany({ where, skip, take, include: BILL_INCLUDE, orderBy: { createdAt: 'desc' } }),
            this.prisma.bill.count({ where }),
        ]);
        return (0, pagination_dto_1.buildPaginatedResponse)(data, total, page, limit);
    }
    async findOne(id, currentUser) {
        const bill = await this.prisma.bill.findUnique({ where: { id }, include: BILL_INCLUDE });
        if (!bill)
            throw new common_1.NotFoundException('Bill not found');
        if (currentUser.role.name === role_enum_1.Role.SALES_PERSON) {
            const assignedIds = await this.chemistsService.getAssignedChemistIds(currentUser.id);
            if (!assignedIds.includes(bill.chemistId)) {
                throw new common_1.ForbiddenException('Access denied');
            }
        }
        return bill;
    }
    async uploadBillImages(id, files, currentUser) {
        const bill = await this.prisma.bill.findUnique({ where: { id } });
        if (!bill)
            throw new common_1.NotFoundException('Bill not found');
        await this.prisma.billImage.createMany({
            data: files.map((f) => ({
                billId: id,
                url: f.path,
                filename: f.filename,
                uploadedById: currentUser.id,
            })),
        });
        return this.prisma.bill.findUnique({ where: { id }, include: BILL_INCLUDE });
    }
    async deleteBillImage(billId, imageId) {
        const bill = await this.prisma.bill.findUnique({ where: { id: billId } });
        if (!bill)
            throw new common_1.NotFoundException('Bill not found');
        const image = await this.prisma.billImage.findFirst({ where: { id: imageId, billId } });
        if (!image)
            throw new common_1.NotFoundException('Image not found on this bill');
        await this.prisma.billImage.delete({ where: { id: imageId } });
        return { message: 'Image deleted' };
    }
    async createSettlement(userId, dto, currentUser) {
        const bill = await this.findOne(dto.billId, currentUser);
        if (bill.status === 'PAID') {
            throw new common_1.BadRequestException('Cannot settle a fully paid bill');
        }
        const currentDue = Number(bill.dueAmount);
        if (dto.amount > currentDue) {
            throw new common_1.BadRequestException(`Settlement amount exceeds due amount of ₹${currentDue.toFixed(2)}`);
        }
        const newDueAmount = currentDue - dto.amount;
        const newStatus = newDueAmount <= 0 ? 'PAID' : Number(bill.paidAmount) > 0 ? 'PARTIAL' : 'UNPAID';
        const [settlement] = await this.prisma.$transaction([
            this.prisma.settlement.create({
                data: {
                    billId: dto.billId,
                    type: dto.type,
                    amount: dto.amount,
                    reason: dto.notes,
                    createdById: userId,
                },
                include: {
                    bill: { select: { id: true, billNumber: true, totalAmount: true, dueAmount: true, status: true } },
                    createdBy: { select: { id: true, name: true } },
                },
            }),
            this.prisma.bill.update({
                where: { id: dto.billId },
                data: { dueAmount: newDueAmount, status: newStatus },
            }),
        ]);
        return settlement;
    }
    async getSettlements(billId, currentUser) {
        await this.findOne(billId, currentUser);
        return this.prisma.settlement.findMany({
            where: { billId },
            include: { createdBy: { select: { id: true, name: true, employeeCode: true } } },
            orderBy: { createdAt: 'desc' },
        });
    }
};
exports.BillsService = BillsService;
exports.BillsService = BillsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        chemists_service_1.ChemistsService])
], BillsService);
//# sourceMappingURL=bills.service.js.map