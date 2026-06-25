import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

class FcmTokenDto {
  @IsString() token: string;
}

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get my notifications' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  getMyNotifications(
    @CurrentUser() currentUser: any,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.notificationsService.getForUser(currentUser.id, +page, +limit);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark a notification as read' })
  markRead(@Param('id') id: string, @CurrentUser() currentUser: any) {
    return this.notificationsService.markRead(id, currentUser.id);
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  markAllRead(@CurrentUser() currentUser: any) {
    return this.notificationsService.markAllRead(currentUser.id);
  }

  @Post('fcm-token')
  @ApiOperation({ summary: 'Save FCM token for push notifications' })
  saveFcmToken(@CurrentUser() currentUser: any, @Body() dto: FcmTokenDto) {
    return this.notificationsService.saveFcmToken(currentUser.id, dto.token);
  }

  @Delete('fcm-token')
  @ApiOperation({ summary: 'Remove FCM token (on logout)' })
  removeFcmToken(@Body() dto: FcmTokenDto) {
    return this.notificationsService.removeFcmToken(dto.token);
  }
}
