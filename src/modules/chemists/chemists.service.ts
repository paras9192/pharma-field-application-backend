import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { S3Service } from '../../common/s3/s3.service';
import { MailService } from '../../mail/mail.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateChemistDto } from './dto/create-chemist.dto';
import { UpdateChemistDto } from './dto/update-chemist.dto';
import { PaginationDto, paginate, buildPaginatedResponse } from '../../common/dto/pagination.dto';
import { Role } from '../../common/enums/role.enum';

const CHEMIST_INCLUDE = {
  territory: true,
  addedBy: { select: { id: true, name: true } },
  salesPersons: { select: { user: { select: { id: true, name: true } } }, take: 1 },
  images: {
    select: { id: true, url: true, filename: true, createdAt: true,
      uploadedBy: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'asc' as const },
  },
};

@Injectable()
export class ChemistsService {
  constructor(
    private prisma: PrismaService,
    private s3: S3Service,
    private mail: MailService,
    private notifications: NotificationsService,
  ) {}

  async getAssignedChemistIds(userId: string): Promise<string[]> {
    const rows = await this.prisma.salesPersonChemist.findMany({
      where: { userId },
      select: { chemistId: true },
    });
    return rows.map((r) => r.chemistId);
  }

  private withAssignedSalesPerson<T extends { salesPersons?: { user: { id: string; name: string } }[] }>(
    chemist: T,
  ) {
    const { salesPersons, ...rest } = chemist as any;
    return {
      ...rest,
      assignedSalesPerson: salesPersons?.[0]?.user ?? null,
    };
  }

  async create(dto: CreateChemistDto, addedById: string) {
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

  async findAll(
    query: PaginationDto & { territoryId?: number; isActive?: string },
    currentUser?: any,
  ) {
    const { page = 1, limit = 20, search, territoryId, isActive } = query;
    const { skip, take } = paginate(page, limit);

    const where: any = {};

    if (currentUser?.role?.name === Role.SALES_PERSON) {
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
    if (territoryId) where.territoryId = Number(territoryId);
    if (isActive !== undefined) where.isActive = isActive === 'true';

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

    return buildPaginatedResponse(data.map((c) => this.withAssignedSalesPerson(c)), total, page, limit);
  }

  async findOne(id: string) {
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
    if (!chemist) throw new NotFoundException('Chemist not found');
    return this.withAssignedSalesPerson(chemist);
  }

  async update(id: string, dto: UpdateChemistDto, currentUser: any) {
    const chemist = await this.prisma.chemist.findUnique({
      where: { id },
      select: { addedById: true },
    });
    if (!chemist) throw new NotFoundException('Chemist not found');

    if (currentUser.role.name === Role.MR || currentUser.role.name === Role.SALES_PERSON) {
      if (chemist.addedById !== currentUser.id) {
        throw new ForbiddenException('You can only edit chemists you created');
      }
    }

    return this.prisma.chemist.update({
      where: { id },
      data: dto,
      include: CHEMIST_INCLUDE,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.chemist.update({ where: { id }, data: { isActive: false } });
    return { message: 'Chemist deactivated successfully' };
  }

  async uploadImages(id: string, files: Array<{ path: string; filename: string }>, currentUser: any) {
    const chemist = await this.prisma.chemist.findUnique({ where: { id } });
    if (!chemist) throw new NotFoundException('Chemist not found');

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

  async deleteImage(chemistId: string, imageId: number, currentUser: any) {
    const image = await this.prisma.chemistImage.findFirst({ where: { id: imageId, chemistId } });
    if (!image) throw new NotFoundException('Image not found on this chemist');

    if (currentUser.role.name === Role.MR || currentUser.role.name === Role.SALES_PERSON) {
      if (image.uploadedById !== currentUser.id) {
        throw new ForbiddenException('You can only delete images you uploaded');
      }
    }

    await this.s3.deleteObject(image.url).catch(() => {});
    await this.prisma.chemistImage.delete({ where: { id: imageId } });
    return { message: 'Image deleted' };
  }

  async sendPaymentReminder(chemistId: string, currentUser: any) {
    const chemist = await this.prisma.chemist.findUnique({
      where: { id: chemistId },
      select: { id: true, shopName: true, ownerName: true, email: true, phone: true },
    });
    if (!chemist) throw new NotFoundException('Chemist not found');
    if (!chemist.email) throw new BadRequestException('Chemist does not have an email address on record');

    const bills = await this.prisma.bill.findMany({
      where: { chemistId, status: { in: ['UNPAID', 'PARTIAL'] } },
      orderBy: { dueDate: 'asc' },
      select: {
        billNumber: true, originalBillId: true, totalAmount: true, paidAmount: true,
        dueAmount: true, status: true, dueDate: true,
      },
    });

    if (!bills.length) throw new BadRequestException('No outstanding bills found for this chemist');

    const sender = await this.prisma.user.findUnique({
      where: { id: currentUser.id },
      select: { name: true },
    });

    await this.mail.notifyPaymentReminder({
      chemist,
      bills: bills.map(b => ({ ...b, billNumber: (b as any).originalBillId ?? b.billNumber })),
      sentBy: sender?.name ?? 'Admin',
    });

    const totalDue = bills.reduce((s, b) => s + Number(b.dueAmount), 0);
    this.notifications.notifyAdmins(
      `📨 Reminder Sent — ${chemist.shopName}`,
      `Payment reminder sent to ${chemist.shopName} for ₹${totalDue.toLocaleString('en-IN')} outstanding`,
      'PAYMENT_REMINDER',
      { chemistId, totalDue, billCount: bills.length },
    );

    return { message: `Payment reminder sent to ${chemist.email}`, billCount: bills.length };
  }
}
