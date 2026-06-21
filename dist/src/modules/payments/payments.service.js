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
exports.PaymentsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const pagination_dto_1 = require("../../common/dto/pagination.dto");
const role_enum_1 = require("../../common/enums/role.enum");
const PAYMENT_INCLUDE = {
    bill: {
        select: {
            id: true,
            billNumber: true,
            totalAmount: true,
            paidAmount: true,
            dueAmount: true,
            status: true,
            chemist: { select: { id: true, shopName: true, ownerName: true } },
        },
    },
    collectedBy: { select: { id: true, name: true, employeeCode: true } },
};
let PaymentsService = class PaymentsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async collect(userId, dto) {
        const bill = await this.prisma.bill.findUnique({ where: { id: dto.billId } });
        if (!bill)
            throw new common_1.NotFoundException('Bill not found');
        if (bill.status === 'PAID') {
            throw new common_1.BadRequestException('Bill is already fully paid');
        }
        const dueAmount = Number(bill.dueAmount);
        if (dto.amount > dueAmount) {
            throw new common_1.BadRequestException(`Amount exceeds due amount of ₹${dueAmount.toFixed(2)}`);
        }
        const newPaidAmount = Number(bill.paidAmount) + dto.amount;
        const newDueAmount = Number(bill.totalAmount) - newPaidAmount;
        const newStatus = newDueAmount <= 0 ? 'PAID' : 'PARTIAL';
        const [payment] = await this.prisma.$transaction([
            this.prisma.payment.create({
                data: {
                    billId: dto.billId,
                    amount: dto.amount,
                    paymentMode: dto.paymentMode,
                    referenceNumber: dto.referenceNumber,
                    notes: dto.notes,
                    collectedById: userId,
                },
                include: PAYMENT_INCLUDE,
            }),
            this.prisma.bill.update({
                where: { id: dto.billId },
                data: {
                    paidAmount: newPaidAmount,
                    dueAmount: newDueAmount,
                    status: newStatus,
                },
            }),
        ]);
        return payment;
    }
    async findAll(query, currentUser) {
        const { page = 1, limit = 20, from, to } = query;
        const { skip, take } = (0, pagination_dto_1.paginate)(page, limit);
        const where = {};
        if (query.billId) {
            where.billId = query.billId;
        }
        else if (currentUser.role.name === role_enum_1.Role.SALES_PERSON) {
            where.collectedById = currentUser.id;
        }
        else if (query.collectedById) {
            where.collectedById = query.collectedById;
        }
        if (from || to) {
            where.collectedAt = {};
            if (from)
                where.collectedAt.gte = new Date(from);
            if (to)
                where.collectedAt.lte = new Date(to);
        }
        const [data, total] = await Promise.all([
            this.prisma.payment.findMany({ where, skip, take, include: PAYMENT_INCLUDE, orderBy: { collectedAt: 'desc' } }),
            this.prisma.payment.count({ where }),
        ]);
        return (0, pagination_dto_1.buildPaginatedResponse)(data, total, page, limit);
    }
    async findOne(id, currentUser) {
        const payment = await this.prisma.payment.findUnique({ where: { id }, include: PAYMENT_INCLUDE });
        if (!payment)
            throw new common_1.NotFoundException('Payment not found');
        if (currentUser.role.name === role_enum_1.Role.SALES_PERSON && payment.collectedById !== currentUser.id) {
            throw new common_1.ForbiddenException('Access denied');
        }
        return payment;
    }
    async getCollectionSummary(currentUser, from, to) {
        const where = {};
        if (currentUser.role.name === role_enum_1.Role.SALES_PERSON) {
            where.collectedById = currentUser.id;
        }
        if (from || to) {
            where.collectedAt = {};
            if (from)
                where.collectedAt.gte = new Date(from);
            if (to)
                where.collectedAt.lte = new Date(to);
        }
        const [payments, byMode] = await Promise.all([
            this.prisma.payment.aggregate({ where, _sum: { amount: true }, _count: { id: true } }),
            this.prisma.payment.groupBy({
                by: ['paymentMode'],
                where,
                _sum: { amount: true },
                _count: { id: true },
            }),
        ]);
        return {
            totalCollected: payments._sum.amount ?? 0,
            totalTransactions: payments._count.id,
            byMode: byMode.map((b) => ({
                mode: b.paymentMode,
                amount: b._sum.amount ?? 0,
                count: b._count.id,
            })),
        };
    }
};
exports.PaymentsService = PaymentsService;
exports.PaymentsService = PaymentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PaymentsService);
//# sourceMappingURL=payments.service.js.map