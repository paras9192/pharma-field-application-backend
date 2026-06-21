import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto, OrderStatus } from './dto/update-order-status.dto';
import { PaginationDto, paginate, buildPaginatedResponse } from '../../common/dto/pagination.dto';
import { Role } from '../../common/enums/role.enum';
import { ChemistsService } from '../chemists/chemists.service';

const ORDER_INCLUDE = {
  chemist: { select: { id: true, shopName: true, ownerName: true, phone: true } },
  items: true,
  createdBy: { select: { id: true, name: true, employeeCode: true } },
  deliveredBy: { select: { id: true, name: true, employeeCode: true } },
  bills: { select: { id: true, billNumber: true, status: true, totalAmount: true, paidAmount: true } },
};

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private chemistsService: ChemistsService,
  ) {}

  private generateOrderNumber(): string {
    const now = new Date();
    const ts = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `ORD-${ts}-${rand}`;
  }

  async create(userId: string, dto: CreateOrderDto) {
    const chemist = await this.prisma.chemist.findUnique({ where: { id: dto.chemistId } });
    if (!chemist) throw new NotFoundException('Chemist not found');

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

  async findAll(
    query: PaginationDto & { chemistId?: string; status?: string; from?: string; to?: string },
    currentUser: any,
  ) {
    const { page = 1, limit = 20, search, status, from, to } = query;
    const { skip, take } = paginate(page, limit);

    const where: any = {};

    if (currentUser.role.name === Role.SALES_PERSON) {
      const assignedIds = await this.chemistsService.getAssignedChemistIds(currentUser.id);
      where.chemistId = { in: assignedIds };
    }

    if (query.chemistId) where.chemistId = query.chemistId;
    if (status) where.status = status;

    if (from || to) {
      where.orderDate = {};
      if (from) where.orderDate.gte = new Date(from);
      if (to) where.orderDate.lte = new Date(to);
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

    return buildPaginatedResponse(data, total, page, limit);
  }

  async findOne(id: string, currentUser: any) {
    const order = await this.prisma.order.findUnique({ where: { id }, include: ORDER_INCLUDE });
    if (!order) throw new NotFoundException('Order not found');

    if (currentUser.role.name === Role.SALES_PERSON) {
      const assignedIds = await this.chemistsService.getAssignedChemistIds(currentUser.id);
      if (!assignedIds.includes(order.chemistId)) {
        throw new ForbiddenException('Access denied');
      }
    }

    return order;
  }

  async updateStatus(id: string, dto: UpdateOrderStatusDto, currentUser: any) {
    const order = await this.findOne(id, currentUser);

    if (order.status === 'DELIVERED' || order.status === 'CANCELLED') {
      throw new BadRequestException(`Cannot update a ${order.status.toLowerCase()} order`);
    }

    const data: any = { status: dto.status, notes: dto.notes ?? order.notes };

    if (dto.status === OrderStatus.DELIVERED) {
      data.deliveredAt = new Date();
      data.deliveredById = currentUser.id;
    }

    return this.prisma.order.update({ where: { id }, data, include: ORDER_INCLUDE });
  }
}
