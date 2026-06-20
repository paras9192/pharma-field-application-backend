import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AttendanceService } from './attendance.service';
import { CheckInDto } from './dto/check-in.dto';
import { CheckOutDto } from './dto/check-out.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums/role.enum';
import { PaginationDto } from '../../common/dto/pagination.dto';

@ApiTags('Attendance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('attendance')
export class AttendanceController {
  constructor(private attendanceService: AttendanceService) {}

  @Post('check-in')
  @ApiOperation({ summary: 'Check in for today' })
  checkIn(@CurrentUser('id') userId: string, @Body() dto: CheckInDto) {
    return this.attendanceService.checkIn(userId, dto);
  }

  @Post('check-out')
  @ApiOperation({ summary: 'Check out for today' })
  checkOut(@CurrentUser('id') userId: string, @Body() dto: CheckOutDto) {
    return this.attendanceService.checkOut(userId, dto);
  }

  @Get('today')
  @ApiOperation({ summary: "Get my today's attendance status" })
  getTodayAttendance(@CurrentUser('id') userId: string) {
    return this.attendanceService.getTodayAttendance(userId);
  }

  @Get('my')
  @ApiOperation({ summary: 'Get my attendance history' })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  getMyAttendance(
    @CurrentUser('id') userId: string,
    @Query() query: PaginationDto & { from?: string; to?: string },
  ) {
    return this.attendanceService.getMyAttendance(userId, query);
  }

  @Get('daily-present')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Get all employees present on a given date' })
  @ApiQuery({ name: 'date', required: false })
  getDailyPresent(@Query('date') date?: string) {
    return this.attendanceService.getDailyPresent(date);
  }

  @Get('list')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'List all attendance records (admin)' })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'date', required: false })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  getAttendanceList(
    @Query() query: PaginationDto & { userId?: string; from?: string; to?: string; date?: string },
  ) {
    return this.attendanceService.getAttendanceList(query);
  }

  @Get(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Get attendance record by ID' })
  getAttendanceById(@Param('id') id: string) {
    return this.attendanceService.getAttendanceById(id);
  }
}
