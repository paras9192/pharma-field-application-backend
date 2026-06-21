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
exports.OrdersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const update_order_status_dto_1 = require("./dto/update-order-status.dto");
const pagination_dto_1 = require("../../common/dto/pagination.dto");
const role_enum_1 = require("../../common/enums/role.enum");
const chemists_service_1 = require("../chemists/chemists.service");
const ORDER_INCLUDE = {
    chemist: { select: { id: true, shopName: true, ownerName: true, phone: true } },
    items: true,
    createdBy: { select: { id: true, name: true, employeeCode: true } },
    deliveredBy: { select: { id: true, name: true, employeeCode: true } },
    bills: { select: { id: true, billNumber: true, status: true, totalAmount: true, paidAmount: true } },
};
let OrdersService = class OrdersService {
    prisma;
    chemistsService;
    constructor(prisma, chemistsService) {
        this.prisma = prisma;
        this.chemistsService = chemistsService;
    }
    generateOrderNumber() {
        const now = new Date();
        const ts = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
        const rand = Math.floor(1000 + Math.random() * 9000);
        return `ORD-${ts}-${rand}`;
    }
    async create(userId, dto) {
        const chemist = await this.prisma.chemist.findUnique({ where: { id: dto.chemistId } });
        if (!chemist)
            throw new common_1.NotFoundException('Chemist not found');
        const totalAmount = dto.items.reduce((sum, item) => sum + item.quantity * item.rate, 0);
        return this.prisma.order.create({
            data: {
                orderNumber: this.generateOrderNumber(),
                chemistId: dto.chemistId,
                totalAmount,
                expectedDelivery: dto.expectedDelivery ? new Date(dto.expectedDelivery) : undefined,
                notes: dto.notes,
                createdById: userId,
                items: {
                    create: dto.items.map((item) => ({
                        productName: item.productName,
                        quantity: item.quantity,
                        rate: item.rate,
                        amount: item.quantity * item.rate,
                        notes: item.notes,
                    })),
                },
            },
            include: ORDER_INCLUDE,
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
            where.orderDate = {};
            if (from)
                where.orderDate.gte = new Date(from);
            if (to)
                where.orderDate.lte = new Date(to);
        }
        if (search) {
            where.OR = [
                { orderNumber: { contains: search, mode: 'insensitive' } },
                { chemist: { shopName: { contains: search, mode: 'insensitive' } } },
            ];
        }
        const [data, total] = await Promise.all([
            this.prisma.order.findMany({ where, skip, take, include: ORDER_INCLUDE, orderBy: { createdAt: 'desc' } }),
            this.prisma.order.count({ where }),
        ]);
        return (0, pagination_dto_1.buildPaginatedResponse)(data, total, page, limit);
    }
    async findOne(id, currentUser) {
        const order = await this.prisma.order.findUnique({ where: { id }, include: ORDER_INCLUDE });
        if (!order)
            throw new common_1.NotFoundException('Order not found');
        if (currentUser.role.name === role_enum_1.Role.SALES_PERSON) {
            const assignedIds = await this.chemistsService.getAssignedChemistIds(currentUser.id);
            if (!assignedIds.includes(order.chemistId)) {
                throw new common_1.ForbiddenException('Access denied');
            }
        }
        return order;
    }
    async updateStatus(id, dto, currentUser) {
        const order = await this.findOne(id, currentUser);
        if (order.status === 'DELIVERED' || order.status === 'CANCELLED') {
            throw new common_1.BadRequestException(`Cannot update a ${order.status.toLowerCase()} order`);
        }
        const data = { status: dto.status, notes: dto.notes ?? order.notes };
        if (dto.status === update_order_status_dto_1.OrderStatus.DELIVERED) {
            data.deliveredAt = new Date();
            data.deliveredById = currentUser.id;
        }
        return this.prisma.order.update({ where: { id }, data, include: ORDER_INCLUDE });
    }
};
exports.OrdersService = OrdersService;
exports.OrdersService = OrdersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        chemists_service_1.ChemistsService])
], OrdersService);
//# sourceMappingURL=orders.service.js.map