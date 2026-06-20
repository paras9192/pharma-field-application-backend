import {
  Injectable,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import dayjs from 'dayjs';
import { PrismaService } from '../../prisma/prisma.service';
import { CheckInDto } from './dto/check-in.dto';
import { CheckOutDto } from './dto/check-out.dto';
import { PaginationDto, paginate, buildPaginatedResponse } from '../../common/dto/pagination.dto';

@Injectable()
export class AttendanceService {
  constructor(private prisma: PrismaService) {}

  async checkIn(userId: string, dto: CheckInDto) {
    const today = dayjs().startOf('day').toDate();

    const existing = await this.prisma.attendance.findUnique({
      where: { userId_date: { userId, date: today } },
    });
    if (existing) throw new ConflictException('Already checked in for today');

    return this.prisma.attendance.create({
      data: {
        userId,
        date: today,
        checkInTime: new Date(),
        checkInLat: dto.lat,
        checkInLng: dto.lng,
        checkInAddress: dto.address,
        notes: dto.notes,
        status: 'PRESENT',
      },
      include: { user: { select: { id: true, name: true } } },
    });
  }

  async checkOut(userId: string, dto: CheckOutDto) {
    const today = dayjs().startOf('day').toDate();

    const attendance = await this.prisma.attendance.findUnique({
      where: { userId_date: { userId, date: today } },
    });
    if (!attendance) throw new BadRequestException('Not checked in today');
    if (attendance.checkOutTime) throw new ConflictException('Already checked out today');

    const checkOutTime = new Date();
    const checkInTime = attendance.checkInTime!;
    const workingHours = (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);
    const status = workingHours < 4 ? 'HALF_DAY' : 'PRESENT';

    return this.prisma.attendance.update({
      where: { userId_date: { userId, date: today } },
      data: {
        checkOutTime,
        checkOutLat: dto.lat,
        checkOutLng: dto.lng,
        checkOutAddress: dto.address,
        workingHours,
        status,
        notes: dto.notes ?? attendance.notes,
      },
      include: { user: { select: { id: true, name: true } } },
    });
  }

  async getTodayAttendance(userId: string) {
    const today = dayjs().startOf('day').toDate();
    const record = await this.prisma.attendance.findUnique({
      where: { userId_date: { userId, date: today } },
      include: { user: { select: { id: true, name: true } } },
    });
    return record || null;
  }

  async getMyAttendance(userId: string, query: PaginationDto & { from?: string; to?: string }) {
    return this.getAttendanceList({ ...query, userId });
  }

  async getAttendanceList(
    query: PaginationDto & { userId?: string; from?: string; to?: string; date?: string },
  ) {
    const { page = 1, limit = 20, userId, from, to, date } = query;
    const { skip, take } = paginate(page, limit);

    const where: any = {};
    if (userId) where.userId = userId;
    if (date) {
      where.date = dayjs(date).startOf('day').toDate();
    } else if (from || to) {
      where.date = {};
      if (from) where.date.gte = dayjs(from).startOf('day').toDate();
      if (to) where.date.lte = dayjs(to).endOf('day').toDate();
    }

    const [data, total] = await Promise.all([
      this.prisma.attendance.findMany({
        where,
        skip,
        take,
        include: { user: { select: { id: true, name: true, employeeCode: true } } },
        orderBy: { date: 'desc' },
      }),
      this.prisma.attendance.count({ where }),
    ]);

    return buildPaginatedResponse(data, total, page, limit);
  }

  async getAttendanceById(id: string) {
    const record = await this.prisma.attendance.findUnique({
      where: { id },
      include: { user: { select: { id: true, name: true } } },
    });
    if (!record) throw new NotFoundException('Attendance record not found');
    return record;
  }

  async getDailyPresent(date?: string) {
    const targetDate = date
      ? dayjs(date).startOf('day').toDate()
      : dayjs().startOf('day').toDate();

    return this.prisma.attendance.findMany({
      where: { date: targetDate, status: { in: ['PRESENT', 'HALF_DAY'] } },
      include: {
        user: { select: { id: true, name: true, employeeCode: true, role: true } },
      },
    });
  }
}
