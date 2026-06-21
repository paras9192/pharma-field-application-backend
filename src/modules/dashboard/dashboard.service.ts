import { Injectable } from '@nestjs/common';
import dayjs from 'dayjs';
import { PrismaService } from '../../prisma/prisma.service';
import { Role } from '../../common/enums/role.enum';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  // ─── Existing endpoints ───────────────────────────────────────────────────────

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

  // ─── Super Admin comprehensive dashboard ──────────────────────────────────────

  async getSuperAdminDashboard(date?: string) {
    const today = date ? dayjs(date) : dayjs();
    const todayStart = today.startOf('day').toDate();
    const todayEnd = today.endOf('day').toDate();
    const monthStart = today.startOf('month').toDate();
    const monthEnd = today.endOf('month').toDate();
    const last30Start = today.subtract(29, 'day').startOf('day').toDate();

    const [
      billAggregate,
      overdueAggregate,
      paymentAggregate,
      totalChemists,
      totalDoctors,
      totalEmployees,
      presentToday,
      visitsToday,
      billsToday,
      billsThisMonth,
      pendingFollowUps,
    ] = await Promise.all([
      this.prisma.bill.aggregate({
        _sum: { totalAmount: true, dueAmount: true, paidAmount: true },
        _count: { id: true },
      }),
      this.prisma.bill.aggregate({
        where: { status: { not: 'PAID' }, dueDate: { lt: todayStart } },
        _sum: { dueAmount: true },
        _count: { id: true },
      }),
      this.prisma.payment.aggregate({
        _sum: { amount: true },
        _count: { id: true },
      }),
      this.prisma.chemist.count({ where: { isActive: true } }),
      this.prisma.doctor.count({ where: { isActive: true } }),
      this.prisma.user.count({ where: { isActive: true, role: { name: { in: ['MR', 'SALES_PERSON'] } } } }),
      this.prisma.attendance.count({ where: { date: todayStart, status: { in: ['PRESENT', 'HALF_DAY'] } } }),
      this.prisma.visit.count({ where: { visitDate: { gte: todayStart, lte: todayEnd } } }),
      this.prisma.bill.count({ where: { createdAt: { gte: todayStart, lte: todayEnd } } }),
      this.prisma.bill.count({ where: { createdAt: { gte: monthStart, lte: monthEnd } } }),
      this.prisma.visit.count({ where: { followUpDate: { lte: new Date() }, followUpDone: false } }),
    ]);

    // Trend data (last 30 days)
    const [billTrendRaw, collectionTrendRaw] = await Promise.all([
      this.prisma.bill.findMany({
        where: { createdAt: { gte: last30Start } },
        select: { createdAt: true, totalAmount: true },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.payment.findMany({
        where: { collectedAt: { gte: last30Start } },
        select: { collectedAt: true, amount: true },
        orderBy: { collectedAt: 'asc' },
      }),
    ]);

    // Salesperson leaderboard: top 10 by collection this month
    const spCollectionsRaw = await this.prisma.payment.groupBy({
      by: ['collectedById'],
      where: { collectedAt: { gte: monthStart, lte: monthEnd } },
      _sum: { amount: true },
      _count: { id: true },
      orderBy: { _sum: { amount: 'desc' } },
      take: 10,
    });

    // MR leaderboard: top 10 by visits this month
    const mrVisitsRaw = await this.prisma.visit.groupBy({
      by: ['userId'],
      where: { visitDate: { gte: monthStart, lte: monthEnd } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    });

    // Recent payments and bills for activity feed
    const [recentPayments, recentBills] = await Promise.all([
      this.prisma.payment.findMany({
        take: 5,
        orderBy: { collectedAt: 'desc' },
        select: {
          id: true,
          amount: true,
          paymentMode: true,
          collectedAt: true,
          collectedBy: { select: { name: true } },
          bill: { select: { billNumber: true, chemist: { select: { shopName: true } } } },
        },
      }),
      this.prisma.bill.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          billNumber: true,
          totalAmount: true,
          status: true,
          createdAt: true,
          chemist: { select: { shopName: true } },
          createdBy: { select: { name: true } },
        },
      }),
    ]);

    // Resolve user details for leaderboards
    const salespersonLeaderboard = await Promise.all(
      spCollectionsRaw.map(async (s, idx) => {
        const user = await this.prisma.user.findUnique({
          where: { id: s.collectedById },
          select: { id: true, name: true, employeeCode: true },
        });
        return {
          rank: idx + 1,
          user,
          collected: Number(s._sum.amount ?? 0),
          transactions: s._count.id,
        };
      }),
    );

    const mrLeaderboard = await Promise.all(
      mrVisitsRaw.map(async (v, idx) => {
        const user = await this.prisma.user.findUnique({
          where: { id: v.userId },
          select: { id: true, name: true, employeeCode: true, role: true },
        });
        return { rank: idx + 1, user, visitsThisMonth: v._count.id };
      }),
    );

    const totalBillValue = Number(billAggregate._sum.totalAmount ?? 0);
    const totalCollected = Number(billAggregate._sum.paidAmount ?? 0);
    const totalOutstanding = Number(billAggregate._sum.dueAmount ?? 0);
    const overdueCount = overdueAggregate._count.id;
    const overdueAmount = Number(overdueAggregate._sum.dueAmount ?? 0);

    return {
      date: today.format('YYYY-MM-DD'),
      kpi: {
        totalBills: billAggregate._count.id,
        totalBillValue,
        totalCollected,
        totalOutstanding,
        overdueCount,
        overdueAmount,
        billsToday,
        billsThisMonth,
        totalChemists,
        totalDoctors,
        totalEmployees,
        presentToday,
        attendanceRate: totalEmployees > 0 ? Math.round((presentToday / totalEmployees) * 100) : 0,
        visitsToday,
        pendingFollowUps,
        collectionRate: totalBillValue > 0 ? Math.round((totalCollected / totalBillValue) * 100) : 0,
      },
      trends: {
        bills: this.buildDailyTrend(billTrendRaw, 'createdAt', 'totalAmount', 30),
        collections: this.buildDailyTrend(collectionTrendRaw, 'collectedAt', 'amount', 30),
      },
      leaderboard: {
        salespersons: salespersonLeaderboard,
        mrs: mrLeaderboard,
      },
      alerts: {
        overdueCount,
        overdueAmount,
        pendingFollowUps,
        employeesAbsent: totalEmployees - presentToday,
      },
      recentActivity: {
        payments: recentPayments.map((p) => ({
          type: 'PAYMENT' as const,
          id: p.id,
          description: `₹${Number(p.amount).toFixed(0)} collected from ${p.bill.chemist.shopName} by ${p.collectedBy.name}`,
          mode: p.paymentMode,
          amount: Number(p.amount),
          at: p.collectedAt,
        })),
        bills: recentBills.map((b) => ({
          type: 'BILL' as const,
          id: b.id,
          description: `Bill ${b.billNumber} for ${b.chemist.shopName} by ${b.createdBy.name}`,
          amount: Number(b.totalAmount),
          status: b.status,
          at: b.createdAt,
        })),
      },
    };
  }

  // ─── Payment analytics dashboard ─────────────────────────────────────────────

  async getPaymentDashboard(
    currentUser: any,
    filters: {
      month?: number;
      year?: number;
      from?: string;
      to?: string;
      status?: string;
      chemistId?: string;
      collectedById?: string;
    } = {},
  ) {
    const today = dayjs().startOf('day');
    const todayDate = today.toDate();

    // ── Resolve period ─────────────────────────────────────────────────────────
    let periodStart: Date | undefined;
    let periodEnd: Date | undefined;
    let periodLabel = 'All Time';

    if (filters.month && filters.year) {
      const m = dayjs().year(filters.year).month(filters.month - 1);
      periodStart = m.startOf('month').toDate();
      periodEnd = m.endOf('month').toDate();
      periodLabel = m.format('MMMM YYYY');
    } else if (filters.from || filters.to) {
      if (filters.from) periodStart = dayjs(filters.from).startOf('day').toDate();
      if (filters.to) periodEnd = dayjs(filters.to).endOf('day').toDate();
      const fromLabel = filters.from ? dayjs(filters.from).format('D MMM YYYY') : '—';
      const toLabel = filters.to ? dayjs(filters.to).format('D MMM YYYY') : '—';
      periodLabel = `${fromLabel} to ${toLabel}`;
    }

    // ── Base scoping (role + optional chemist filter) ──────────────────────────
    const billBaseWhere: any = {};

    if (currentUser.role.name === Role.SALES_PERSON) {
      const assignments = await this.prisma.salesPersonChemist.findMany({
        where: { userId: currentUser.id },
        select: { chemistId: true },
      });
      billBaseWhere.chemistId = { in: assignments.map((a) => a.chemistId) };
    } else if (filters.chemistId) {
      billBaseWhere.chemistId = filters.chemistId;
    }

    if (filters.status) billBaseWhere.status = filters.status;

    // Bills filtered by creation date in period
    const billWhere: any = { ...billBaseWhere };
    if (periodStart || periodEnd) {
      billWhere.createdAt = {};
      if (periodStart) billWhere.createdAt.gte = periodStart;
      if (periodEnd) billWhere.createdAt.lte = periodEnd;
    }

    // Payments filtered by collection date in period
    const paymentWhere: any = {};
    if (currentUser.role.name === Role.SALES_PERSON) {
      paymentWhere.collectedById = currentUser.id;
    } else if (filters.collectedById) {
      paymentWhere.collectedById = filters.collectedById;
    }
    if (periodStart || periodEnd) {
      paymentWhere.collectedAt = {};
      if (periodStart) paymentWhere.collectedAt.gte = periodStart;
      if (periodEnd) paymentWhere.collectedAt.lte = periodEnd;
    }
    // Scope payments to the chemist filter via bill relation
    if (filters.chemistId && currentUser.role.name !== Role.SALES_PERSON) {
      paymentWhere.bill = { chemistId: filters.chemistId };
    }

    // ── Period KPIs ────────────────────────────────────────────────────────────
    const [billAggregate, paymentAggregate, unpaidCount, partialCount, paidCount] = await Promise.all([
      this.prisma.bill.aggregate({
        where: billWhere,
        _sum: { totalAmount: true, paidAmount: true, dueAmount: true },
        _count: { id: true },
      }),
      this.prisma.payment.aggregate({
        where: paymentWhere,
        _sum: { amount: true },
        _count: { id: true },
      }),
      this.prisma.bill.count({ where: { ...billWhere, status: 'UNPAID' } }),
      this.prisma.bill.count({ where: { ...billWhere, status: 'PARTIAL' } }),
      this.prisma.bill.count({ where: { ...billWhere, status: 'PAID' } }),
    ]);

    // ── Aging buckets (always as-of-today, unaffected by period filter) ────────
    const agingBase: any = { ...billBaseWhere, status: { not: 'PAID' as const } };
    const [dueToday, due1to7, due8to15, due16to30, overdue1to30, overdue30plus] = await Promise.all([
      this.prisma.bill.aggregate({
        where: { ...agingBase, dueDate: { gte: todayDate, lt: today.add(1, 'day').toDate() } },
        _sum: { dueAmount: true }, _count: { id: true },
      }),
      this.prisma.bill.aggregate({
        where: { ...agingBase, dueDate: { gte: today.add(1, 'day').toDate(), lt: today.add(8, 'day').toDate() } },
        _sum: { dueAmount: true }, _count: { id: true },
      }),
      this.prisma.bill.aggregate({
        where: { ...agingBase, dueDate: { gte: today.add(8, 'day').toDate(), lt: today.add(16, 'day').toDate() } },
        _sum: { dueAmount: true }, _count: { id: true },
      }),
      this.prisma.bill.aggregate({
        where: { ...agingBase, dueDate: { gte: today.add(16, 'day').toDate(), lt: today.add(31, 'day').toDate() } },
        _sum: { dueAmount: true }, _count: { id: true },
      }),
      this.prisma.bill.aggregate({
        where: { ...agingBase, dueDate: { gte: today.subtract(30, 'day').toDate(), lt: todayDate } },
        _sum: { dueAmount: true }, _count: { id: true },
      }),
      this.prisma.bill.aggregate({
        where: { ...agingBase, dueDate: { lt: today.subtract(30, 'day').toDate() } },
        _sum: { dueAmount: true }, _count: { id: true },
      }),
    ]);

    // ── Payment mode breakdown ──────────────────────────────────────────────────
    const paymentByMode = await this.prisma.payment.groupBy({
      by: ['paymentMode'],
      where: paymentWhere,
      _sum: { amount: true },
      _count: { id: true },
    });

    // ── 12-month trend (bills created + payments collected per month) ───────────
    const twelveMonthsAgo = today.subtract(11, 'month').startOf('month').toDate();
    const [billTrend12Raw, paymentTrend12Raw] = await Promise.all([
      this.prisma.bill.findMany({
        where: { ...billBaseWhere, createdAt: { gte: twelveMonthsAgo } },
        select: { createdAt: true, totalAmount: true },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.payment.findMany({
        where: {
          ...(currentUser.role.name === Role.SALES_PERSON ? { collectedById: currentUser.id } : {}),
          ...(filters.chemistId && currentUser.role.name !== Role.SALES_PERSON ? { bill: { chemistId: filters.chemistId } } : {}),
          ...(filters.collectedById && currentUser.role.name !== Role.SALES_PERSON ? { collectedById: filters.collectedById } : {}),
          collectedAt: { gte: twelveMonthsAgo },
        },
        select: { collectedAt: true, amount: true },
        orderBy: { collectedAt: 'asc' },
      }),
    ]);

    const monthlyTrend = this.buildMonthlyTrend(billTrend12Raw, paymentTrend12Raw, 12);

    // ── Daily trend (last 30 days, scoped to period if <= 30 days) ─────────────
    const dailyTrendPayments = await this.prisma.payment.findMany({
      where: { ...paymentWhere, collectedAt: { gte: today.subtract(29, 'day').toDate(), ...(paymentWhere.collectedAt ?? {}) } },
      select: { collectedAt: true, amount: true },
      orderBy: { collectedAt: 'asc' },
    });

    // ── Salesperson ranking (SA/Admin only, scoped to period) ──────────────────
    let salespersonRanking: any[] = [];
    if (currentUser.role.name === Role.SUPER_ADMIN || currentUser.role.name === Role.ADMIN) {
      const spRaw = await this.prisma.payment.groupBy({
        by: ['collectedById'],
        where: paymentWhere,
        _sum: { amount: true },
        _count: { id: true },
        orderBy: { _sum: { amount: 'desc' } },
        take: 10,
      });
      salespersonRanking = await Promise.all(
        spRaw.map(async (s, idx) => {
          const user = await this.prisma.user.findUnique({
            where: { id: s.collectedById },
            select: { id: true, name: true, employeeCode: true },
          });
          return {
            rank: idx + 1,
            user,
            totalCollected: Number(s._sum.amount ?? 0),
            transactions: s._count.id,
          };
        }),
      );
    }

    // ── Upcoming collections (next 7 days, always live) ────────────────────────
    const upcomingBills = await this.prisma.bill.findMany({
      where: {
        ...billBaseWhere,
        status: { not: 'PAID' },
        dueDate: { gte: todayDate, lte: today.add(7, 'day').toDate() },
      },
      orderBy: { dueDate: 'asc' },
      take: 15,
      select: {
        id: true, billNumber: true, dueAmount: true, dueDate: true, status: true,
        chemist: { select: { id: true, shopName: true, ownerName: true, phone: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });

    // ── High risk accounts (overdue > 30 days, always live) ────────────────────
    const highRiskBills = await this.prisma.bill.findMany({
      where: {
        ...billBaseWhere,
        status: { not: 'PAID' },
        dueDate: { lt: today.subtract(30, 'day').toDate() },
      },
      orderBy: { dueDate: 'asc' },
      take: 15,
      select: {
        id: true, billNumber: true, dueAmount: true, dueDate: true, status: true,
        chemist: { select: { id: true, shopName: true, ownerName: true, phone: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });

    const totalBillValue = Number(billAggregate._sum.totalAmount ?? 0);
    const totalCollected = Number(paymentAggregate._sum.amount ?? 0);
    const totalOutstanding = Number(billAggregate._sum.dueAmount ?? 0);

    return {
      // Echo back active filters so FE knows what's applied
      period: {
        label: periodLabel,
        from: periodStart ? dayjs(periodStart).format('YYYY-MM-DD') : null,
        to: periodEnd ? dayjs(periodEnd).format('YYYY-MM-DD') : null,
        month: filters.month ?? null,
        year: filters.year ?? null,
      },
      filters: {
        status: filters.status ?? null,
        chemistId: filters.chemistId ?? null,
        collectedById: filters.collectedById ?? null,
      },
      kpi: {
        totalBills: billAggregate._count.id,
        totalBillValue,
        totalCollected,           // payments collected in period
        totalOutstanding,         // remaining due on bills in period
        unpaidCount,
        partialCount,
        paidCount,
        totalTransactions: paymentAggregate._count.id,
        collectionRate: totalBillValue > 0 ? Math.round((totalCollected / totalBillValue) * 100) : 0,
      },
      // Always as-of-today regardless of period filter
      aging: {
        dueToday:     { count: dueToday._count.id,     amount: Number(dueToday._sum.dueAmount ?? 0) },
        due1to7Days:  { count: due1to7._count.id,      amount: Number(due1to7._sum.dueAmount ?? 0) },
        due8to15Days: { count: due8to15._count.id,     amount: Number(due8to15._sum.dueAmount ?? 0) },
        due16to30Days:{ count: due16to30._count.id,    amount: Number(due16to30._sum.dueAmount ?? 0) },
        overdue1to30: { count: overdue1to30._count.id, amount: Number(overdue1to30._sum.dueAmount ?? 0) },
        overdue30plus:{ count: overdue30plus._count.id,amount: Number(overdue30plus._sum.dueAmount ?? 0) },
      },
      paymentModes: paymentByMode.map((b) => ({
        mode: b.paymentMode,
        amount: Number(b._sum.amount ?? 0),
        count: b._count.id,
      })),
      // 12-month bill + collection trend (always full 12M, unaffected by period filter)
      monthlyTrend,
      // Daily trend for the last 30 days
      dailyTrend: this.buildDailyTrend(dailyTrendPayments, 'collectedAt', 'amount', 30),
      salespersonRanking,
      upcomingCollections: upcomingBills.map((b) => ({
        ...b,
        dueAmount: Number(b.dueAmount),
        daysUntilDue: dayjs(b.dueDate).diff(today, 'day'),
      })),
      highRiskAccounts: highRiskBills.map((b) => ({
        ...b,
        dueAmount: Number(b.dueAmount),
        daysOverdue: today.diff(dayjs(b.dueDate), 'day'),
      })),
    };
  }

  // ─── Sales Person operational dashboard ──────────────────────────────────────

  async getSalesPersonDashboard(userId: string, date?: string) {
    const today = date ? dayjs(date) : dayjs();
    const todayStart = today.startOf('day').toDate();
    const todayEnd = today.endOf('day').toDate();
    const monthStart = today.startOf('month').toDate();
    const monthEnd = today.endOf('month').toDate();

    // Assigned chemists
    const assignments = await this.prisma.salesPersonChemist.findMany({
      where: { userId },
      select: {
        chemistId: true,
        chemist: { select: { id: true, shopName: true, ownerName: true, phone: true } },
      },
    });
    const chemistIds = assignments.map((a) => a.chemistId);
    const billWhere = { chemistId: { in: chemistIds } };

    const [
      todayAttendance,
      todayCollectedAgg,
      todayVisits,
      pendingBillsCount,
      overdueCount,
      pendingFollowUps,
      monthlyCollectedAgg,
      monthlyBillAgg,
      monthlyBillsCount,
    ] = await Promise.all([
      this.prisma.attendance.findUnique({ where: { userId_date: { userId, date: todayStart } } }),
      this.prisma.payment.aggregate({
        where: { collectedById: userId, collectedAt: { gte: todayStart, lte: todayEnd } },
        _sum: { amount: true },
        _count: { id: true },
      }),
      this.prisma.visit.count({ where: { userId, visitDate: { gte: todayStart, lte: todayEnd } } }),
      this.prisma.bill.count({ where: { ...billWhere, status: { not: 'PAID' } } }),
      this.prisma.bill.count({ where: { ...billWhere, status: { not: 'PAID' }, dueDate: { lt: todayStart } } }),
      this.prisma.visit.count({ where: { userId, followUpDate: { lte: new Date() }, followUpDone: false } }),
      this.prisma.payment.aggregate({
        where: { collectedById: userId, collectedAt: { gte: monthStart, lte: monthEnd } },
        _sum: { amount: true },
        _count: { id: true },
      }),
      this.prisma.bill.aggregate({
        where: { ...billWhere, createdAt: { gte: monthStart, lte: monthEnd } },
        _sum: { totalAmount: true },
      }),
      this.prisma.bill.count({ where: { ...billWhere, createdAt: { gte: monthStart, lte: monthEnd } } }),
    ]);

    // Collection tasks: all upcoming unpaid/partial bills (due today or later, or no due date)
    const collectionTasks = await this.prisma.bill.findMany({
      where: {
        ...billWhere,
        status: { not: 'PAID' },
        OR: [
          { dueDate: { gte: todayStart } },
          { dueDate: null },
        ],
      },
      orderBy: [{ dueDate: 'asc' }],
      take: 50,
      select: {
        id: true,
        billNumber: true,
        dueAmount: true,
        dueDate: true,
        status: true,
        chemist: { select: { id: true, shopName: true, ownerName: true, phone: true } },
      },
    });

    // Overdue bills
    const overdueBills = await this.prisma.bill.findMany({
      where: { ...billWhere, status: { not: 'PAID' }, dueDate: { lt: todayStart } },
      orderBy: { dueDate: 'asc' },
      take: 10,
      select: {
        id: true,
        billNumber: true,
        dueAmount: true,
        dueDate: true,
        status: true,
        chemist: { select: { id: true, shopName: true, ownerName: true, phone: true } },
      },
    });

    // Today's visits
    const todaySchedule = await this.prisma.visit.findMany({
      where: { userId, visitDate: { gte: todayStart, lte: todayEnd } },
      orderBy: { visitTime: 'asc' },
      select: {
        id: true,
        visitType: true,
        visitTime: true,
        status: true,
        purpose: true,
        doctor: { select: { id: true, name: true } },
        chemist: { select: { id: true, shopName: true } },
      },
    });

    return {
      date: today.format('YYYY-MM-DD'),
      attendance: todayAttendance,
      kpi: {
        totalAssignedChemists: chemistIds.length,
        todayCollected: Number(todayCollectedAgg._sum.amount ?? 0),
        todayTransactions: todayCollectedAgg._count.id,
        todayVisits,
        pendingBills: pendingBillsCount,
        overdueCount,
        pendingFollowUps,
      },
      monthlyPerformance: {
        billsCreated: monthlyBillsCount,
        billValue: Number(monthlyBillAgg._sum.totalAmount ?? 0),
        collected: Number(monthlyCollectedAgg._sum.amount ?? 0),
        transactions: monthlyCollectedAgg._count.id,
      },
      collectionTasks: collectionTasks.map((b) => {
        const daysUntilDue = dayjs(b.dueDate).diff(today, 'day');
        return {
          ...b,
          dueAmount: Number(b.dueAmount),
          daysUntilDue,
          priority: daysUntilDue <= 1 ? 'HIGH' : daysUntilDue <= 7 ? 'MEDIUM' : 'LOW',
        };
      }),
      overdueBills: overdueBills.map((b) => ({
        ...b,
        dueAmount: Number(b.dueAmount),
        daysOverdue: today.diff(dayjs(b.dueDate), 'day'),
      })),
      todaySchedule,
      assignedChemists: assignments.map((a) => a.chemist),
    };
  }

  // ─── MR visit-centric dashboard ───────────────────────────────────────────────

  async getMRDashboard(userId: string, date?: string) {
    const today = date ? dayjs(date) : dayjs();
    const todayStart = today.startOf('day').toDate();
    const todayEnd = today.endOf('day').toDate();
    const monthStart = today.startOf('month').toDate();
    const monthEnd = today.endOf('month').toDate();

    const [
      todayAttendance,
      todayVisitsCount,
      completedVisitsToday,
      pendingFollowUps,
      totalVisitsMonth,
      doctorVisitsMonth,
      chemistVisitsMonth,
      completedVisitsMonth,
      todayReport,
    ] = await Promise.all([
      this.prisma.attendance.findUnique({ where: { userId_date: { userId, date: todayStart } } }),
      this.prisma.visit.count({ where: { userId, visitDate: { gte: todayStart, lte: todayEnd } } }),
      this.prisma.visit.count({ where: { userId, visitDate: { gte: todayStart, lte: todayEnd }, status: 'COMPLETED' } }),
      this.prisma.visit.count({ where: { userId, followUpDate: { lte: new Date() }, followUpDone: false } }),
      this.prisma.visit.count({ where: { userId, visitDate: { gte: monthStart, lte: monthEnd } } }),
      this.prisma.visit.count({ where: { userId, visitDate: { gte: monthStart, lte: monthEnd }, visitType: 'DOCTOR' } }),
      this.prisma.visit.count({ where: { userId, visitDate: { gte: monthStart, lte: monthEnd }, visitType: 'CHEMIST' } }),
      this.prisma.visit.count({ where: { userId, visitDate: { gte: monthStart, lte: monthEnd }, status: 'COMPLETED' } }),
      this.prisma.dailyReport.findUnique({ where: { userId_date: { userId, date: todayStart } } }),
    ]);

    // Today's schedule
    const todaySchedule = await this.prisma.visit.findMany({
      where: { userId, visitDate: { gte: todayStart, lte: todayEnd } },
      orderBy: { visitTime: 'asc' },
      select: {
        id: true,
        visitType: true,
        visitTime: true,
        status: true,
        purpose: true,
        notes: true,
        doctor: { select: { id: true, name: true, specialization: true, clinicName: true } },
        chemist: { select: { id: true, shopName: true } },
        products: true,
      },
    });

    // Upcoming follow-ups (next 14 days)
    const upcomingFollowUps = await this.prisma.visit.findMany({
      where: {
        userId,
        followUpDate: { gte: new Date() },
        followUpDone: false,
      },
      orderBy: { followUpDate: 'asc' },
      take: 10,
      select: {
        id: true,
        visitType: true,
        followUpDate: true,
        followUpNotes: true,
        doctor: { select: { id: true, name: true, specialization: true, clinicName: true } },
        chemist: { select: { id: true, shopName: true } },
      },
    });

    // Recent activity
    const recentVisits = await this.prisma.visit.findMany({
      where: { userId },
      orderBy: { visitDate: 'desc' },
      take: 5,
      select: {
        id: true,
        visitType: true,
        visitDate: true,
        status: true,
        doctor: { select: { id: true, name: true } },
        chemist: { select: { id: true, shopName: true } },
      },
    });

    const workingDaysElapsed = today.date();

    return {
      date: today.format('YYYY-MM-DD'),
      attendance: todayAttendance,
      kpi: {
        todayVisits: todayVisitsCount,
        completedVisitsToday,
        pendingFollowUps,
        totalVisitsThisMonth: totalVisitsMonth,
        avgVisitsPerDay: workingDaysElapsed > 0 ? Math.round(totalVisitsMonth / workingDaysElapsed) : 0,
        reportStatus: todayReport?.status ?? 'NOT_CREATED',
      },
      monthlyBreakdown: {
        totalVisits: totalVisitsMonth,
        doctorVisits: doctorVisitsMonth,
        chemistVisits: chemistVisitsMonth,
        completionRate: totalVisitsMonth > 0 ? Math.round((completedVisitsMonth / totalVisitsMonth) * 100) : 0,
      },
      todaySchedule,
      upcomingFollowUps,
      recentActivity: recentVisits,
    };
  }

  // ─── Role-aware alerts ────────────────────────────────────────────────────────

  async getAlerts(currentUser: any) {
    const today = dayjs().startOf('day');
    const alerts: Array<{ type: string; severity: 'HIGH' | 'MEDIUM' | 'LOW'; message: string; count?: number }> = [];

    if (currentUser.role.name === Role.SUPER_ADMIN || currentUser.role.name === Role.ADMIN) {
      const [overdueCount, totalEmployees, presentToday, pendingFollowUps, draftReportsToday] = await Promise.all([
        this.prisma.bill.count({ where: { status: { not: 'PAID' }, dueDate: { lt: today.toDate() } } }),
        this.prisma.user.count({ where: { isActive: true, role: { name: { in: ['MR', 'SALES_PERSON'] } } } }),
        this.prisma.attendance.count({ where: { date: today.toDate(), status: { in: ['PRESENT', 'HALF_DAY'] } } }),
        this.prisma.visit.count({ where: { followUpDate: { lte: new Date() }, followUpDone: false } }),
        this.prisma.dailyReport.count({ where: { date: today.toDate(), status: 'DRAFT' } }),
      ]);

      const absentCount = totalEmployees - presentToday;

      if (overdueCount > 0) {
        alerts.push({ type: 'OVERDUE_BILLS', severity: 'HIGH', message: `${overdueCount} bills are overdue and unpaid`, count: overdueCount });
      }
      if (absentCount > 0) {
        alerts.push({ type: 'ABSENT_EMPLOYEES', severity: 'MEDIUM', message: `${absentCount} of ${totalEmployees} employees absent today`, count: absentCount });
      }
      if (pendingFollowUps > 0) {
        alerts.push({ type: 'PENDING_FOLLOWUPS', severity: 'MEDIUM', message: `${pendingFollowUps} overdue follow-ups across all employees`, count: pendingFollowUps });
      }
      if (draftReportsToday > 0) {
        alerts.push({ type: 'REPORTS_DRAFT', severity: 'LOW', message: `${draftReportsToday} daily reports still in draft`, count: draftReportsToday });
      }
    } else if (currentUser.role.name === Role.SALES_PERSON) {
      const assignments = await this.prisma.salesPersonChemist.findMany({
        where: { userId: currentUser.id },
        select: { chemistId: true },
      });
      const chemistIds = assignments.map((a) => a.chemistId);

      const [overdueCount, dueTodayCount, pendingFollowUps, attendance] = await Promise.all([
        this.prisma.bill.count({ where: { chemistId: { in: chemistIds }, status: { not: 'PAID' }, dueDate: { lt: today.toDate() } } }),
        this.prisma.bill.count({ where: { chemistId: { in: chemistIds }, status: { not: 'PAID' }, dueDate: { gte: today.toDate(), lt: today.add(1, 'day').toDate() } } }),
        this.prisma.visit.count({ where: { userId: currentUser.id, followUpDate: { lte: new Date() }, followUpDone: false } }),
        this.prisma.attendance.findUnique({ where: { userId_date: { userId: currentUser.id, date: today.toDate() } } }),
      ]);

      if (!attendance) {
        alerts.push({ type: 'NO_CHECKIN', severity: 'HIGH', message: 'You have not checked in today' });
      }
      if (overdueCount > 0) {
        alerts.push({ type: 'OVERDUE_BILLS', severity: 'HIGH', message: `${overdueCount} bills in your territory are overdue`, count: overdueCount });
      }
      if (dueTodayCount > 0) {
        alerts.push({ type: 'DUE_TODAY', severity: 'MEDIUM', message: `${dueTodayCount} bills are due today — collect now`, count: dueTodayCount });
      }
      if (pendingFollowUps > 0) {
        alerts.push({ type: 'PENDING_FOLLOWUPS', severity: 'MEDIUM', message: `${pendingFollowUps} visit follow-ups are overdue`, count: pendingFollowUps });
      }
    } else if (currentUser.role.name === Role.MR) {
      const [pendingFollowUps, todayVisitsCount, attendance, todayReport] = await Promise.all([
        this.prisma.visit.count({ where: { userId: currentUser.id, followUpDate: { lte: new Date() }, followUpDone: false } }),
        this.prisma.visit.count({ where: { userId: currentUser.id, visitDate: { gte: today.toDate(), lt: today.add(1, 'day').toDate() } } }),
        this.prisma.attendance.findUnique({ where: { userId_date: { userId: currentUser.id, date: today.toDate() } } }),
        this.prisma.dailyReport.findUnique({ where: { userId_date: { userId: currentUser.id, date: today.toDate() } } }),
      ]);

      if (!attendance) {
        alerts.push({ type: 'NO_CHECKIN', severity: 'HIGH', message: 'You have not checked in today' });
      }
      if (pendingFollowUps > 0) {
        alerts.push({ type: 'PENDING_FOLLOWUPS', severity: 'HIGH', message: `${pendingFollowUps} doctor follow-ups are overdue`, count: pendingFollowUps });
      }
      if (!todayReport || todayReport.status === 'DRAFT') {
        alerts.push({ type: 'REPORT_PENDING', severity: 'MEDIUM', message: "Today's daily report has not been submitted" });
      }
      if (todayVisitsCount === 0) {
        alerts.push({ type: 'NO_VISITS_TODAY', severity: 'LOW', message: 'No visits recorded today' });
      }
    }

    return { alerts, count: alerts.length, generatedAt: new Date() };
  }

  // ─── Private helpers ──────────────────────────────────────────────────────────

  private buildMonthlyTrend(
    billRecords: Array<{ createdAt: Date; totalAmount: any }>,
    paymentRecords: Array<{ collectedAt: Date; amount: any }>,
    months: number,
  ): Array<{ month: string; label: string; billValue: number; billCount: number; collected: number; transactions: number; collectionRate: number }> {
    const today = dayjs();
    const buckets: Record<string, { billValue: number; billCount: number; collected: number; transactions: number }> = {};

    for (let i = months - 1; i >= 0; i--) {
      const key = today.subtract(i, 'month').format('YYYY-MM');
      buckets[key] = { billValue: 0, billCount: 0, collected: 0, transactions: 0 };
    }

    for (const r of billRecords) {
      const key = dayjs(r.createdAt).format('YYYY-MM');
      if (buckets[key]) {
        buckets[key].billValue += Number(r.totalAmount);
        buckets[key].billCount += 1;
      }
    }

    for (const r of paymentRecords) {
      const key = dayjs(r.collectedAt).format('YYYY-MM');
      if (buckets[key]) {
        buckets[key].collected += Number(r.amount);
        buckets[key].transactions += 1;
      }
    }

    return Object.entries(buckets).map(([month, v]) => ({
      month,
      label: dayjs(month + '-01').format('MMM YYYY'),
      ...v,
      collectionRate: v.billValue > 0 ? Math.round((v.collected / v.billValue) * 100) : 0,
    }));
  }

  private buildDailyTrend(
    records: Array<Record<string, any>>,
    dateField: string,
    amountField: string,
    days: number,
  ): Array<{ date: string; amount: number; count: number }> {
    const today = dayjs();
    const buckets: Record<string, { amount: number; count: number }> = {};

    for (let i = days - 1; i >= 0; i--) {
      const key = today.subtract(i, 'day').format('YYYY-MM-DD');
      buckets[key] = { amount: 0, count: 0 };
    }

    for (const r of records) {
      const key = dayjs(r[dateField]).format('YYYY-MM-DD');
      if (buckets[key]) {
        buckets[key].amount += Number(r[amountField]);
        buckets[key].count += 1;
      }
    }

    return Object.entries(buckets).map(([date, v]) => ({ date, ...v }));
  }
}
