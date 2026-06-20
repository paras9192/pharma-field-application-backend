import { Injectable } from '@nestjs/common';
import dayjs from 'dayjs';
import { PrismaService } from '../../prisma/prisma.service';
import { Role } from '../../common/enums/role.enum';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getAdminDashboard(date?: string) {
    const targetDate = date ? dayjs(date) : dayjs();
    const start = targetDate.startOf('day').toDate();
    const end = targetDate.endOf('day').toDate();

    const [
      totalEmployees,
      activeEmployees,
      presentToday,
      totalVisitsToday,
      doctorVisitsToday,
      chemistVisitsToday,
      pendingFollowUps,
      reportsSubmittedToday,
      totalDoctors,
      totalChemists,
    ] = await Promise.all([
      this.prisma.user.count({ where: { role: { name: { in: ['MR', 'SALES_PERSON'] } } } }),
      this.prisma.user.count({ where: { isActive: true, role: { name: { in: ['MR', 'SALES_PERSON'] } } } }),
      this.prisma.attendance.count({
        where: { date: start, status: { in: ['PRESENT', 'HALF_DAY'] } },
      }),
      this.prisma.visit.count({ where: { visitDate: { gte: start, lte: end } } }),
      this.prisma.visit.count({ where: { visitDate: { gte: start, lte: end }, visitType: 'DOCTOR' } }),
      this.prisma.visit.count({ where: { visitDate: { gte: start, lte: end }, visitType: 'CHEMIST' } }),
      this.prisma.visit.count({ where: { followUpDate: { lte: new Date() }, followUpDone: false } }),
      this.prisma.dailyReport.count({ where: { date: start, status: 'SUBMITTED' } }),
      this.prisma.doctor.count({ where: { isActive: true } }),
      this.prisma.chemist.count({ where: { isActive: true } }),
    ]);

    const topPerformers = await this.prisma.visit.groupBy({
      by: ['userId'],
      where: { visitDate: { gte: start, lte: end } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5,
    });

    const topPerformerDetails = await Promise.all(
      topPerformers.map(async (p) => {
        const user = await this.prisma.user.findUnique({
          where: { id: p.userId },
          select: { id: true, name: true, employeeCode: true, role: true },
        });
        return { user, visitCount: p._count.id };
      }),
    );

    const presentEmployees = await this.prisma.attendance.findMany({
      where: { date: start, status: { in: ['PRESENT', 'HALF_DAY'] } },
      include: {
        user: { select: { id: true, name: true, employeeCode: true, role: true } },
      },
    });

    return {
      date: targetDate.format('YYYY-MM-DD'),
      summary: {
        totalEmployees,
        activeEmployees,
        presentToday,
        absentToday: activeEmployees - presentToday,
        totalVisitsToday,
        doctorVisitsToday,
        chemistVisitsToday,
        pendingFollowUps,
        reportsSubmittedToday,
        totalDoctors,
        totalChemists,
      },
      topPerformers: topPerformerDetails,
      presentEmployees,
    };
  }

  async getEmployeeDashboard(userId: string, date?: string) {
    const targetDate = date ? dayjs(date) : dayjs();
    const start = targetDate.startOf('day').toDate();
    const end = targetDate.endOf('day').toDate();

    const [
      todayAttendance,
      todayVisits,
      doctorVisitsToday,
      chemistVisitsToday,
      pendingFollowUps,
      totalVisitsMonth,
      todayReport,
    ] = await Promise.all([
      this.prisma.attendance.findUnique({ where: { userId_date: { userId, date: start } } }),
      this.prisma.visit.count({ where: { userId, visitDate: { gte: start, lte: end } } }),
      this.prisma.visit.count({ where: { userId, visitDate: { gte: start, lte: end }, visitType: 'DOCTOR' } }),
      this.prisma.visit.count({ where: { userId, visitDate: { gte: start, lte: end }, visitType: 'CHEMIST' } }),
      this.prisma.visit.count({ where: { userId, followUpDate: { lte: new Date() }, followUpDone: false } }),
      this.prisma.visit.count({
        where: {
          userId,
          visitDate: {
            gte: targetDate.startOf('month').toDate(),
            lte: targetDate.endOf('month').toDate(),
          },
        },
      }),
      this.prisma.dailyReport.findUnique({ where: { userId_date: { userId, date: start } } }),
    ]);

    const recentVisits = await this.prisma.visit.findMany({
      where: { userId },
      orderBy: { visitDate: 'desc' },
      take: 5,
      include: {
        doctor: { select: { id: true, name: true } },
        chemist: { select: { id: true, shopName: true } },
        products: true,
      },
    });

    const upcomingFollowUps = await this.prisma.visit.findMany({
      where: {
        userId,
        followUpDate: { gte: new Date() },
        followUpDone: false,
      },
      orderBy: { followUpDate: 'asc' },
      take: 5,
      include: {
        doctor: { select: { id: true, name: true } },
        chemist: { select: { id: true, shopName: true } },
      },
    });

    return {
      date: targetDate.format('YYYY-MM-DD'),
      attendance: todayAttendance,
      summary: {
        todayVisits,
        doctorVisitsToday,
        chemistVisitsToday,
        pendingFollowUps,
        totalVisitsMonth,
        reportStatus: todayReport?.status || 'NOT_CREATED',
      },
      recentVisits,
      upcomingFollowUps,
    };
  }

  async getTerritoryStats() {
    const territories = await this.prisma.territory.findMany({
      where: { isActive: true },
      include: {
        city: { include: { district: { include: { state: true } } } },
        employeeTerritories: {
          include: { user: { select: { id: true, name: true, role: true } } },
        },
        _count: { select: { doctors: true, chemists: true, visits: true } },
      },
    });

    return territories.map((t) => ({
      id: t.id,
      name: t.name,
      code: t.code,
      location: {
        city: t.city.name,
        district: t.city.district.name,
        state: t.city.district.state.name,
      },
      assignedEmployees: t.employeeTerritories.length,
      employees: t.employeeTerritories.map((et) => et.user),
      stats: {
        doctors: t._count.doctors,
        chemists: t._count.chemists,
        totalVisits: t._count.visits,
      },
    }));
  }

  async getEmployeePerformance(from?: string, to?: string) {
    const start = from ? dayjs(from).startOf('day').toDate() : dayjs().startOf('month').toDate();
    const end = to ? dayjs(to).endOf('day').toDate() : dayjs().endOf('month').toDate();

    const employees = await this.prisma.user.findMany({
      where: { isActive: true, role: { name: { in: ['MR', 'SALES_PERSON'] } } },
      select: { id: true, name: true, employeeCode: true, role: true },
    });

    const performance = await Promise.all(
      employees.map(async (emp) => {
        const [totalVisits, doctorVisits, chemistVisits, daysPresent, reportsSubmitted] =
          await Promise.all([
            this.prisma.visit.count({ where: { userId: emp.id, visitDate: { gte: start, lte: end } } }),
            this.prisma.visit.count({ where: { userId: emp.id, visitDate: { gte: start, lte: end }, visitType: 'DOCTOR' } }),
            this.prisma.visit.count({ where: { userId: emp.id, visitDate: { gte: start, lte: end }, visitType: 'CHEMIST' } }),
            this.prisma.attendance.count({ where: { userId: emp.id, date: { gte: start, lte: end }, status: { in: ['PRESENT', 'HALF_DAY'] } } }),
            this.prisma.dailyReport.count({ where: { userId: emp.id, date: { gte: start, lte: end }, status: 'SUBMITTED' } }),
          ]);

        return {
          employee: emp,
          totalVisits,
          doctorVisits,
          chemistVisits,
          daysPresent,
          reportsSubmitted,
        };
      }),
    );

    return performance.sort((a, b) => b.totalVisits - a.totalVisits);
  }
}
