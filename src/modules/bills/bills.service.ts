import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBillDto } from './dto/create-bill.dto';
import { CreateSettlementDto } from './dto/create-settlement.dto';
import { PaginationDto, paginate, buildPaginatedResponse } from '../../common/dto/pagination.dto';
import { Role } from '../../common/enums/role.enum';
import { ChemistsService } from '../chemists/chemists.service';

function assertNotMR(currentUser: any) {
  if (currentUser?.role?.name === Role.MR) {
    throw new UnauthorizedException('MR users do not have access to bills');
  }
}

const BILL_INCLUDE = {
  chemist: { select: { id: true, shopName: true, ownerName: true, phone: true } },
  order: { select: { id: true, orderNumber: true, status: true } },
  createdBy: { select: { id: true, name: true, employeeCode: true } },
  payments: {
    select: { id: true, amount: true, paymentMode: true, referenceNumber: true, collectedAt: true, notes: true },
    orderBy: { collectedAt: 'desc' as const },
  },
  settlements: {
    select: { id: true, type: true, amount: true, reason: true, createdAt: true,
      createdBy: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'desc' as const },
  },
  images: {
    select: { id: true, url: true, filename: true, createdAt: true,
      uploadedBy: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'asc' as const },
  },
};

@Injectable()
export class BillsService {
  constructor(
    private prisma: PrismaService,
    private chemistsService: ChemistsService,
  ) {}

  private generateBillNumber(): string {
    const now = new Date();
    const ts = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `BILL-${ts}-${rand}`;
  }

  async create(userId: string, dto: CreateBillDto, currentUser: any) {
    assertNotMR(currentUser);
    if (currentUser?.role?.name === Role.SALES_PERSON) {
      throw new ForbiddenException('Sales Person cannot create bills');
    }
    const chemist = await this.prisma.chemist.findUnique({ where: { id: dto.chemistId } });
    if (!chemist) throw new NotFoundException('Chemist not found');

    if (dto.orderId) {
      const order = await this.prisma.order.findUnique({ where: { id: dto.orderId } });
      if (!order) throw new NotFoundException('Order not found');
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
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) where.createdAt.lte = new Date(to);
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

    return buildPaginatedResponse(data, total, page, limit);
  }

  async findOne(id: string, currentUser: any) {
    const bill = await this.prisma.bill.findUnique({ where: { id }, include: BILL_INCLUDE });
    if (!bill) throw new NotFoundException('Bill not found');

    if (currentUser.role.name === Role.SALES_PERSON) {
      const assignedIds = await this.chemistsService.getAssignedChemistIds(currentUser.id);
      if (!assignedIds.includes(bill.chemistId)) {
        throw new ForbiddenException('Access denied');
      }
    }

    return bill;
  }

  async uploadBillImages(id: string, files: Array<{ path: string; filename: string }>, currentUser: any) {
    const bill = await this.prisma.bill.findUnique({ where: { id } });
    if (!bill) throw new NotFoundException('Bill not found');

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

  async deleteBillImage(billId: string, imageId: number) {
    const bill = await this.prisma.bill.findUnique({ where: { id: billId } });
    if (!bill) throw new NotFoundException('Bill not found');

    const image = await this.prisma.billImage.findFirst({ where: { id: imageId, billId } });
    if (!image) throw new NotFoundException('Image not found on this bill');

    await this.prisma.billImage.delete({ where: { id: imageId } });
    return { message: 'Image deleted' };
  }

  async createSettlement(userId: string, dto: CreateSettlementDto, currentUser: any) {
    const bill = await this.findOne(dto.billId, currentUser);

    if (bill.status === 'PAID') {
      throw new BadRequestException('Cannot settle a fully paid bill');
    }

    const currentDue = Number(bill.dueAmount);
    if (dto.amount > currentDue) {
      throw new BadRequestException(`Settlement amount exceeds due amount of ₹${currentDue.toFixed(2)}`);
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

  async getSettlements(billId: string, currentUser: any) {
    await this.findOne(billId, currentUser);

    return this.prisma.settlement.findMany({
      where: { billId },
      include: { createdBy: { select: { id: true, name: true, employeeCode: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }
}
