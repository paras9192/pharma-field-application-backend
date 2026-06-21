import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums/role.enum';

@ApiTags('Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  // ─── Existing endpoints ───────────────────────────────────────────────────────

  @Get('admin')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Admin/Super Admin dashboard with daily overview' })
  @ApiQuery({ name: 'date', required: false })
  getAdminDashboard(@Query('date') date?: string) {
    return this.dashboardService.getAdminDashboard(date);
  }

  @Get('me')
  @ApiOperation({ summary: 'Employee personal dashboard (visits, attendance, follow-ups)' })
  @ApiQuery({ name: 'date', required: false })
  getMyDashboard(@CurrentUser('id') userId: string, @Query('date') date?: string) {
    return this.dashboardService.getEmployeeDashboard(userId, date);
  }

  @Get('territories')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Territory coverage stats' })
  getTerritoryStats() {
    return this.dashboardService.getTerritoryStats();
  }

  @Get('performance')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Employee performance report for a date range' })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  getEmployeePerformance(@Query('from') from?: string, @Query('to') to?: string) {
    return this.dashboardService.getEmployeePerformance(from, to);
  }

  // ─── New comprehensive dashboards ─────────────────────────────────────────────

  @Get('super-admin')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({
    summary: 'Super Admin overview — full org KPIs, revenue/collection trends, leaderboards, alerts',
  })
  @ApiQuery({ name: 'date', required: false, description: 'Target date (defaults to today)' })
  getSuperAdminDashboard(@Query('date') date?: string) {
    return this.dashboardService.getSuperAdminDashboard(date);
  }

  @Get('payments')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.SALES_PERSON)
  @ApiOperation({
    summary: 'Payment analytics — KPIs, aging buckets, salesperson ranking, upcoming collections, high-risk accounts',
  })
  @ApiQuery({ name: 'month', required: false, description: 'Month number 1-12 (use with year)' })
  @ApiQuery({ name: 'year', required: false, description: 'Full year e.g. 2026 (use with month)' })
  @ApiQuery({ name: 'from', required: false, description: 'Custom range start date YYYY-MM-DD' })
  @ApiQuery({ name: 'to', required: false, description: 'Custom range end date YYYY-MM-DD' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter bills by status: UNPAID | PARTIAL | PAID' })
  @ApiQuery({ name: 'chemistId', required: false, description: 'Filter by chemist ID' })
  @ApiQuery({ name: 'collectedById', required: false, description: 'Filter by collector user ID (SA/Admin only)' })
  getPaymentDashboard(
    @CurrentUser() currentUser: any,
    @Query('month') month?: string,
    @Query('year') year?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('status') status?: string,
    @Query('chemistId') chemistId?: string,
    @Query('collectedById') collectedById?: string,
  ) {
    return this.dashboardService.getPaymentDashboard(currentUser, {
      month: month ? Number(month) : undefined,
      year: year ? Number(year) : undefined,
      from,
      to,
      status,
      chemistId,
      collectedById,
    });
  }

  @Get('sales-person')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.SALES_PERSON)
  @ApiOperation({
    summary: 'Sales Person dashboard — collection tasks, overdue bills, today\'s schedule, monthly performance',
    description: 'SALES_PERSON sees their own data. SUPER_ADMIN/ADMIN can pass ?userId= to view any salesperson.',
  })
  @ApiQuery({ name: 'userId', required: false, description: 'Target user ID (SUPER_ADMIN/ADMIN only)' })
  @ApiQuery({ name: 'date', required: false })
  getSalesPersonDashboard(
    @CurrentUser() currentUser: any,
    @Query('userId') userId?: string,
    @Query('date') date?: string,
  ) {
    const targetId =
      currentUser.role.name === Role.SALES_PERSON ? currentUser.id : (userId ?? currentUser.id);
    return this.dashboardService.getSalesPersonDashboard(targetId, date);
  }

  @Get('mr')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MR)
  @ApiOperation({
    summary: 'MR dashboard — visit KPIs, today\'s schedule, follow-ups, monthly productivity',
    description: 'MR sees their own data. SUPER_ADMIN/ADMIN can pass ?userId= to view any MR.',
  })
  @ApiQuery({ name: 'userId', required: false, description: 'Target user ID (SUPER_ADMIN/ADMIN only)' })
  @ApiQuery({ name: 'date', required: false })
  getMRDashboard(
    @CurrentUser() currentUser: any,
    @Query('userId') userId?: string,
    @Query('date') date?: string,
  ) {
    const targetId = currentUser.role.name === Role.MR ? currentUser.id : (userId ?? currentUser.id);
    return this.dashboardService.getMRDashboard(targetId, date);
  }

  @Get('alerts')
  @ApiOperation({
    summary: 'Role-aware system alerts — overdue bills, absent employees, pending follow-ups, missing check-ins',
  })
  getAlerts(@CurrentUser() currentUser: any) {
    return this.dashboardService.getAlerts(currentUser);
  }
}
