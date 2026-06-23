import {
  Injectable,
  ConflictException,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateDailyReportDto } from './dto/create-daily-report.dto';
import { UpdateDailyReportDto } from './dto/update-daily-report.dto';
import { PaginationDto, paginate, buildPaginatedResponse } from '../../common/dto/pagination.dto';
import { Role } from '../../common/enums/role.enum';
import { MailService } from '../../mail/mail.service';

// Parse a YYYY-MM-DD string as UTC midnight to avoid local-timezone shifts
// e.g. "2026-06-22" → 2026-06-22T00:00:00.000Z regardless of server timezone
function toUTCDate(dateStr: string): Date {
  return new Date(dateStr.split('T')[0] + 'T00:00:00.000Z');
}

// Today expressed as UTC midnight so it matches date-only DB columns consistently
function todayUTC(): Date {
  return new Date(new Date().toISOString().split('T')[0] + 'T00:00:00.000Z');
}

@Injectable()
export class DailyReportsService {
  constructor(
    private prisma: PrismaService,
    private mail: MailService,
  ) {}

  private async computeVisitCounts(userId: string, date: Date) {
    const [totalVisits, doctorVisits, chemistVisits] = await Promise.all([
      this.prisma.visit.count({ where: { userId, visitDate: date } }),
      this.prisma.visit.count({ where: { userId, visitDate: date, visitType: 'DOCTOR' } }),
      this.prisma.visit.count({ where: { userId, visitDate: date, visitType: 'CHEMIST' } }),
    ]);
    return { totalVisits, doctorVisits, chemistVisits };
  }

  async create(userId: string, dto: CreateDailyReportDto) {
    const date = toUTCDate(dto.date);

    const existing = await this.prisma.dailyReport.findUnique({
      where: { userId_date: { userId, date } },
    });
    if (existing) throw new ConflictException('Report for this date already exists. Use update instead.');

    const counts = await this.computeVisitCounts(userId, date);

    const report = await this.prisma.dailyReport.create({
      data: {
        userId,
        date,
        ...counts,
        productsDiscussed: dto.productsDiscussed,
        competitorActivity: dto.competitorActivity,
        highlights: dto.highlights,
        challenges: dto.challenges,
        remarks: dto.remarks,
        status: dto.status || 'DRAFT',
        submittedAt: dto.status === 'SUBMITTED' ? new Date() : undefined,
      },
      include: { user: { select: { id: true, name: true } } },
    });

    this.mail.notifyDailyReport(report);
    return report;
  }

  async update(id: string, dto: UpdateDailyReportDto, currentUser: any) {
    const report = await this.prisma.dailyReport.findUnique({ where: { id } });
    if (!report) throw new NotFoundException('Report not found');

    if (
      (currentUser.role.name === Role.MR || currentUser.role.name === Role.SALES_PERSON) &&
      report.userId !== currentUser.id
    ) {
      throw new ForbiddenException('Access denied');
    }

    if (report.status === 'SUBMITTED' && dto.status !== 'SUBMITTED') {
      throw new BadRequestException('Cannot edit a submitted report');
    }

    const counts = await this.computeVisitCounts(report.userId, report.date);

    return this.prisma.dailyReport.update({
      where: { id },
      data: {
        ...dto,
        ...counts,
        submittedAt: dto.status === 'SUBMITTED' ? new Date() : report.submittedAt,
      },
      include: { user: { select: { id: true, name: true } } },
    });
  }

  async submit(id: string, currentUser: any) {
    const report = await this.prisma.dailyReport.findUnique({ where: { id } });
    if (!report) throw new NotFoundException('Report not found');

    if (
      (currentUser.role.name === Role.MR || currentUser.role.name === Role.SALES_PERSON) &&
      report.userId !== currentUser.id
    ) {
      throw new ForbiddenException('Access denied');
    }

    if (report.status === 'SUBMITTED') {
      throw new BadRequestException('Report already submitted');
    }

    const counts = await this.computeVisitCounts(report.userId, report.date);

    const submitted = await this.prisma.dailyReport.update({
      where: { id },
      data: { status: 'SUBMITTED', submittedAt: new Date(), ...counts },
      include: { user: { select: { id: true, name: true } } },
    });

    this.mail.notifyDailyReport(submitted);
    return submitted;
  }

  async findAll(
    query: PaginationDto & { userId?: string; from?: string; to?: string; status?: string },
    currentUser: any,
  ) {
    const { page = 1, limit = 20, from, to, status } = query;
    const { skip, take } = paginate(page, limit);

    const where: any = {};

    if (currentUser.role.name === Role.MR || currentUser.role.name === Role.SALES_PERSON) {
      where.userId = currentUser.id;
    } else if (query.userId) {
      where.userId = query.userId;
    }

    if (status) where.status = status;

    if (from || to) {
      where.date = {};
      if (from) where.date.gte = toUTCDate(from);
      if (to) where.date.lte = toUTCDate(to);
    }

    const [data, total] = await Promise.all([
      this.prisma.dailyReport.findMany({
        where,
        skip,
        take,
        include: { user: { select: { id: true, name: true } } },
        orderBy: { date: 'desc' },
      }),
      this.prisma.dailyReport.count({ where }),
    ]);

    return buildPaginatedResponse(data, total, page, limit);
  }

  async findOne(id: string, currentUser: any) {
    const report = await this.prisma.dailyReport.findUnique({
      where: { id },
      include: { user: { select: { id: true, name: true } } },
    });
    if (!report) throw new NotFoundException('Report not found');

    if (
      (currentUser.role.name === Role.MR || currentUser.role.name === Role.SALES_PERSON) &&
      report.userId !== currentUser.id
    ) {
      throw new ForbiddenException('Access denied');
    }

    const freshCounts = await this.computeVisitCounts(report.userId, report.date);
    return { ...report, ...freshCounts };
  }

  async getMyTodayReport(userId: string) {
    const today = todayUTC();
    const report = await this.prisma.dailyReport.findUnique({
      where: { userId_date: { userId, date: today } },
      include: { user: { select: { id: true, name: true } } },
    });
    if (!report) return null;
    const freshCounts = await this.computeVisitCounts(userId, report.date);
    return { ...report, ...freshCounts };
  }
}
