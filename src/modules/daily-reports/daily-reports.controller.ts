import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { DailyReportsService } from './daily-reports.service';
import { CreateDailyReportDto } from './dto/create-daily-report.dto';
import { UpdateDailyReportDto } from './dto/update-daily-report.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';

@ApiTags('Daily Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('daily-reports')
export class DailyReportsController {
  constructor(private dailyReportsService: DailyReportsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a daily working report' })
  create(@CurrentUser() currentUser: any, @Body() dto: CreateDailyReportDto) {
    return this.dailyReportsService.create(currentUser.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List daily reports' })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  @ApiQuery({ name: 'status', required: false, enum: ['DRAFT', 'SUBMITTED'] })
  findAll(
    @CurrentUser() currentUser: any,
    @Query() query: PaginationDto & { userId?: string; from?: string; to?: string; status?: string },
  ) {
    return this.dailyReportsService.findAll(query, currentUser);
  }

  @Get('today')
  @ApiOperation({ summary: "Get today's report (auto-creates if missing)" })
  getMyTodayReport(@CurrentUser('id') userId: string) {
    return this.dailyReportsService.getMyTodayReport(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific daily report' })
  findOne(@Param('id') id: string, @CurrentUser() currentUser: any) {
    return this.dailyReportsService.findOne(id, currentUser);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a daily report' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateDailyReportDto,
    @CurrentUser() currentUser: any,
  ) {
    return this.dailyReportsService.update(id, dto, currentUser);
  }

  @Patch(':id/submit')
  @ApiOperation({ summary: 'Submit a daily report' })
  submit(@Param('id') id: string, @CurrentUser() currentUser: any) {
    return this.dailyReportsService.submit(id, currentUser);
  }
}
