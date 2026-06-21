import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums/role.enum';
import { PaginationDto } from '../../common/dto/pagination.dto';

@ApiTags('Orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('orders')
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Post()
  @Roles(Role.SALES_PERSON, Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Create a new order for a chemist' })
  create(@CurrentUser() currentUser: any, @Body() dto: CreateOrderDto) {
    return this.ordersService.create(currentUser.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List orders' })
  @ApiQuery({ name: 'chemistId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: ['PENDING', 'CONFIRMED', 'DISPATCHED', 'DELIVERED', 'CANCELLED'] })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  findAll(
    @CurrentUser() currentUser: any,
    @Query() query: PaginationDto & { chemistId?: string; status?: string; from?: string; to?: string },
  ) {
    return this.ordersService.findAll(query, currentUser);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order details' })
  findOne(@Param('id') id: string, @CurrentUser() currentUser: any) {
    return this.ordersService.findOne(id, currentUser);
  }

  @Patch(':id/status')
  @Roles(Role.SALES_PERSON, Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Update order status (confirm, dispatch, deliver, cancel)' })
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
    @CurrentUser() currentUser: any,
  ) {
    return this.ordersService.updateStatus(id, dto, currentUser);
  }
}
