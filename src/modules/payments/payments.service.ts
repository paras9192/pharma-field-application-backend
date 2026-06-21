import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CollectPaymentDto } from './dto/collect-payment.dto';
import { PaginationDto, paginate, buildPaginatedResponse } from '../../common/dto/pagination.dto';
import { Role } from '../../common/enums/role.enum';

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

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  async collect(userId: string, dto: CollectPaymentDto) {
    const bill = await this.prisma.bill.findUnique({ where: { id: dto.billId } });
    if (!bill) throw new NotFoundException('Bill not found');

    if (bill.status === 'PAID') {
      throw new BadRequestException('Bill is already fully paid');
    }

    const dueAmount = Number(bill.dueAmount);
    if (dto.amount > dueAmount) {
      throw new BadRequestException(`Amount exceeds due amount of ₹${dueAmount.toFixed(2)}`);
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

  async findAll(
    query: PaginationDto & { billId?: string; collectedById?: string; from?: string; to?: string },
    currentUser: any,
  ) {
    const { page = 1, limit = 20, from, to } = query;
    const { skip, take } = paginate(page, limit);

    const where: any = {};

    if (query.billId) {
      // When filtering by bill, return all payments for that bill regardless of collector.
      // Bill-level access is enforced separately (sales person can only view their own bills).
      where.billId = query.billId;
    } else if (currentUser.role.name === Role.SALES_PERSON) {
      where.collectedById = currentUser.id;
    } else if (query.collectedById) {
      where.collectedById = query.collectedById;
    }

    if (from || to) {
      where.collectedAt = {};
      if (from) where.collectedAt.gte = new Date(from);
      if (to) where.collectedAt.lte = new Date(to);
    }

    const [data, total] = await Promise.all([
      this.prisma.payment.findMany({ where, skip, take, include: PAYMENT_INCLUDE, orderBy: { collectedAt: 'desc' } }),
      this.prisma.payment.count({ where }),
    ]);

    return buildPaginatedResponse(data, total, page, limit);
  }

  async findOne(id: string, currentUser: any) {
    const payment = await this.prisma.payment.findUnique({ where: { id }, include: PAYMENT_INCLUDE });
    if (!payment) throw new NotFoundException('Payment not found');

    if (currentUser.role.name === Role.SALES_PERSON && payment.collectedById !== currentUser.id) {
      throw new ForbiddenException('Access denied');
    }

    return payment;
  }

  async getCollectionSummary(currentUser: any, from?: string, to?: string) {
    const where: any = {};

    if (currentUser.role.name === Role.SALES_PERSON) {
      where.collectedById = currentUser.id;
    }

    if (from || to) {
      where.collectedAt = {};
      if (from) where.collectedAt.gte = new Date(from);
      if (to) where.collectedAt.lte = new Date(to);
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
}
