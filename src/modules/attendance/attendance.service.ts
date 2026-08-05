import {
  Injectable,
  ConflictException,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import dayjs from 'dayjs';
import { PrismaService } from '../../prisma/prisma.service';
import { CheckInDto } from './dto/check-in.dto';
import { CheckOutDto } from './dto/check-out.dto';
import { PaginationDto, paginate, buildPaginatedResponse } from '../../common/dto/pagination.dto';
import { GeocodingService } from '../../common/geocoding/geocoding.service';
import { Role } from '../../common/enums/role.enum';

/** Only these two roles see attendance across the whole company. */
function isAdminRole(roleName?: string) {
  return roleName === Role.SUPER_ADMIN || roleName === Role.ADMIN;
}

@Injectable()
export class AttendanceService {
  constructor(
    private prisma: PrismaService,
    private geocoding: GeocodingService,
  ) {}

  async checkIn(userId: string, dto: CheckInDto) {
    const today = dayjs().startOf('day').toDate();

    const existing = await this.prisma.attendance.findUnique({
      where: { userId_date: { userId, date: today } },
    });
    if (existing) throw new ConflictException('Already checked in for today');

    const checkInAddress =
      (await this.geocoding.reverse(dto.lat, dto.lng)) ?? dto.address ?? null;

    return this.prisma.attendance.create({
      data: {
        userId,
        date: today,
        checkInTime: new Date(),
        checkInLat: dto.lat,
        checkInLng: dto.lng,
        checkInAddress,
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

    const checkOutAddress =
      (await this.geocoding.reverse(dto.lat, dto.lng)) ?? dto.address ?? null;

    return this.prisma.attendance.update({
      where: { userId_date: { userId, date: today } },
      data: {
        checkOutTime,
        checkOutLat: dto.lat,
        checkOutLng: dto.lng,
        checkOutAddress,
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

  /**
   * Admin/Super Admin may read the whole company and filter by `userId`; every
   * other role is pinned to their own history regardless of what they ask for.
   * Called without `currentUser` internally (getMyAttendance), which skips the
   * pinning because the caller has already chosen the user.
   */
  async getAttendanceList(
    query: PaginationDto & { userId?: string; from?: string; to?: string; date?: string },
    currentUser?: any,
  ) {
    const { page = 1, limit = 20, from, to, date } = query;
    const { skip, take } = paginate(page, limit);

    const userId =
      currentUser && !isAdminRole(currentUser.role?.name) ? currentUser.id : query.userId;

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

  async getAttendanceById(id: string, currentUser?: any) {
    const record = await this.prisma.attendance.findUnique({
      where: { id },
      include: { user: { select: { id: true, name: true } } },
    });
    if (!record) throw new NotFoundException('Attendance record not found');

    if (currentUser && !isAdminRole(currentUser.role?.name) && record.userId !== currentUser.id) {
      throw new ForbiddenException('Access denied');
    }
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
