import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CollectPaymentDto } from './dto/collect-payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums/role.enum';
import { PaginationDto } from '../../common/dto/pagination.dto';

@ApiTags('Payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Post()
  @Roles(Role.SALES_PERSON, Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Collect a payment against a bill' })
  collect(@CurrentUser() currentUser: any, @Body() dto: CollectPaymentDto) {
    return this.paymentsService.collect(currentUser.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List payment collections' })
  @ApiQuery({ name: 'billId', required: false })
  @ApiQuery({ name: 'collectedById', required: false })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  findAll(
    @CurrentUser() currentUser: any,
    @Query() query: PaginationDto & { billId?: string; collectedById?: string; from?: string; to?: string },
  ) {
    return this.paymentsService.findAll(query, currentUser);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Collection summary (total + breakdown by payment mode)' })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  getSummary(
    @CurrentUser() currentUser: any,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.paymentsService.getCollectionSummary(currentUser, from, to);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get payment details' })
  findOne(@Param('id') id: string, @CurrentUser() currentUser: any) {
    return this.paymentsService.findOne(id, currentUser);
  }
}
