import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { VisitsService } from './visits.service';
import { CreateVisitDto } from './dto/create-visit.dto';
import { UpdateVisitDto } from './dto/update-visit.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';

@ApiTags('Visits')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('visits')
export class VisitsController {
  constructor(private visitsService: VisitsService) {}

  @Post()
  @ApiOperation({ summary: 'Log a new visit' })
  create(@CurrentUser() currentUser: any, @Body() dto: CreateVisitDto) {
    return this.visitsService.create(currentUser.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List visits (filtered by role)' })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'visitType', required: false, enum: ['DOCTOR', 'CHEMIST'] })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  @ApiQuery({ name: 'territoryId', required: false })
  @ApiQuery({ name: 'followUpPending', required: false })
  findAll(
    @CurrentUser() currentUser: any,
    @Query()
    query: PaginationDto & {
      userId?: string;
      visitType?: string;
      from?: string;
      to?: string;
      territoryId?: number;
      followUpPending?: string;
    },
  ) {
    return this.visitsService.findAll(query, currentUser);
  }

  @Get('follow-ups/pending')
  @ApiOperation({ summary: 'Get pending follow-up visits' })
  getPendingFollowUps(@CurrentUser() currentUser: any) {
    return this.visitsService.getPendingFollowUps(currentUser);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get visit details' })
  findOne(@Param('id') id: string, @CurrentUser() currentUser: any) {
    return this.visitsService.findOne(id, currentUser);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a visit' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateVisitDto,
    @CurrentUser() currentUser: any,
  ) {
    return this.visitsService.update(id, dto, currentUser);
  }

  @Patch(':id/follow-up-done')
  @ApiOperation({ summary: 'Mark follow-up as done' })
  markFollowUpDone(@Param('id') id: string, @CurrentUser() currentUser: any) {
    return this.visitsService.markFollowUpDone(id, currentUser);
  }
}
