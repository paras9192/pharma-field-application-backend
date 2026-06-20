import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import dayjs from 'dayjs';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateVisitDto } from './dto/create-visit.dto';
import { UpdateVisitDto } from './dto/update-visit.dto';
import { PaginationDto, paginate, buildPaginatedResponse } from '../../common/dto/pagination.dto';
import { Role } from '../../common/enums/role.enum';
import { MailService } from '../../mail/mail.service';

const VISIT_INCLUDE = {
  user: { select: { id: true, name: true, employeeCode: true } },
  doctor: { select: { id: true, name: true, specialization: true, email: true, clinicName: true } },
  chemist: { select: { id: true, shopName: true, ownerName: true } },
  territory: { select: { id: true, name: true } },
  products: true,
};

@Injectable()
export class VisitsService {
  constructor(
    private prisma: PrismaService,
    private mail: MailService,
  ) {}

  async create(userId: string, dto: CreateVisitDto) {
    if (dto.visitType === 'DOCTOR' && !dto.doctorId) {
      throw new BadRequestException('doctorId is required for doctor visits');
    }
    if (dto.visitType === 'CHEMIST' && !dto.chemistId) {
      throw new BadRequestException('chemistId is required for chemist visits');
    }

    const { products, visitDate, followUpDate, lat, lng, territoryId, ...rest } = dto;

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
        products: products?.length
          ? { create: products }
          : undefined,
      },
      include: VISIT_INCLUDE,
    });

    this.mail.notifyVisit(visit);
    if (visit.visitType === 'DOCTOR') {
      this.mail.notifyDoctor(visit);
    }
    return visit;
  }

  async findAll(
    query: PaginationDto & {
      userId?: string;
      visitType?: string;
      from?: string;
      to?: string;
      territoryId?: number;
      followUpPending?: string;
    },
    currentUser: any,
  ) {
    const { page = 1, limit = 20, search, visitType, from, to, territoryId, followUpPending } = query;
    const { skip, take } = paginate(page, limit);

    const where: any = {};

    // MRs and Sales Persons can only see their own visits
    if (currentUser.role.name === Role.MR || currentUser.role.name === Role.SALES_PERSON) {
      where.userId = currentUser.id;
    } else if (query.userId) {
      where.userId = query.userId;
    }

    if (visitType) where.visitType = visitType;
    if (territoryId) where.territoryId = Number(territoryId);

    if (from || to) {
      where.visitDate = {};
      if (from) where.visitDate.gte = dayjs(from).startOf('day').toDate();
      if (to) where.visitDate.lte = dayjs(to).endOf('day').toDate();
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

    return buildPaginatedResponse(data, total, page, limit);
  }

  async findOne(id: string, currentUser: any) {
    const visit = await this.prisma.visit.findUnique({
      where: { id },
      include: VISIT_INCLUDE,
    });
    if (!visit) throw new NotFoundException('Visit not found');

    if (
      (currentUser.role.name === Role.MR || currentUser.role.name === Role.SALES_PERSON) &&
      visit.userId !== currentUser.id
    ) {
      throw new ForbiddenException('Access denied');
    }

    return visit;
  }

  async update(id: string, dto: UpdateVisitDto, currentUser: any) {
    const visit = await this.findOne(id, currentUser);

    if (
      (currentUser.role.name === Role.MR || currentUser.role.name === Role.SALES_PERSON) &&
      visit.userId !== currentUser.id
    ) {
      throw new ForbiddenException('Cannot update another user\'s visit');
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
        products: products !== undefined
          ? { create: products }
          : undefined,
      },
      include: VISIT_INCLUDE,
    });
  }

  async getPendingFollowUps(currentUser: any) {
    const where: any = {
      followUpDate: { lte: new Date() },
      followUpDone: false,
    };

    if (currentUser.role.name === Role.MR || currentUser.role.name === Role.SALES_PERSON) {
      where.userId = currentUser.id;
    }

    return this.prisma.visit.findMany({
      where,
      include: VISIT_INCLUDE,
      orderBy: { followUpDate: 'asc' },
    });
  }

  async markFollowUpDone(id: string, currentUser: any) {
    await this.findOne(id, currentUser);
    return this.prisma.visit.update({
      where: { id },
      data: { followUpDone: true },
      include: VISIT_INCLUDE,
    });
  }
}
