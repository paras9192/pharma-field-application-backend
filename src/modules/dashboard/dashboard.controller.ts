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

  @Get('admin')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Admin/Super Admin dashboard with daily overview' })
  @ApiQuery({ name: 'date', required: false })
  getAdminDashboard(@Query('date') date?: string) {
    return this.dashboardService.getAdminDashboard(date);
  }

  @Get('me')
  @ApiOperation({ summary: 'Employee personal dashboard' })
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
  @ApiOperation({ summary: 'Employee performance report' })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  getEmployeePerformance(@Query('from') from?: string, @Query('to') to?: string) {
    return this.dashboardService.getEmployeePerformance(from, to);
  }
}
