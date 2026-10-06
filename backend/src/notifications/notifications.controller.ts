import { Controller, Get, Patch, Delete, Param, Query, Req, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async getNotifications(
    @Req() req: any,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
  ) {
    const userId = req.user.sub || req.user.id;
    return this.notificationsService.getUserNotifications(userId, page, pageSize);
  }

  @Patch(':id')
  async markAsRead(@Req() req: any, @Param('id') id: string) {
    const userId = req.user.sub || req.user.id;
    return this.notificationsService.markAsRead(userId, id);
  }

  @Delete(':id')
  async deleteNotification(@Req() req: any, @Param('id') id: string) {
    const userId = req.user.sub || req.user.id;
    return this.notificationsService.deleteNotification(userId, id);
  }
}
