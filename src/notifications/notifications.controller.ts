import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards';
import { CurrentUser } from '../auth/decorators';
import { NotificationsService } from './notifications.service';
import { PaginationQueryDto, MarkReadAllDto } from './dto';

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  // /* ------------------------------------------------------------------ */
  // /* GET /notifications ------------------------------------------------ */
  // /* ------------------------------------------------------------------ */
  // @ApiOperation({ summary: 'Danh sách thông báo của user' })
  // @ApiQuery({ name: 'limit', required: false, example: 20 })
  // @ApiQuery({ name: 'page', required: false, example: 1 })
  // @ApiQuery({
  //   name: 'unreadOnly',
  //   required: false,
  //   description: 'true = chỉ lấy chưa đọc',
  // })
  // @Get()
  // async findAll(
  //   @CurrentUser('id') userId: number,
  //   @Query() query: PaginationQueryDto,
  // ) {
  //   const { items, total } = await this.notificationsService.findAll(
  //     userId,
  //     query,
  //   );
  //   return { items, total };
  // }

  // /* ------------------------------------------------------------------ */
  // /* GET /notifications/:id ------------------------------------------- */
  // /* ------------------------------------------------------------------ */
  // @ApiOperation({ summary: 'Chi tiết thông báo (kèm trạng thái)' })
  // @ApiParam({ name: 'id', type: Number })
  // @Get(':id')
  // async findOne(
  //   @CurrentUser('id') userId: number,
  //   @Param('id', ParseIntPipe) id: number,
  // ) {
  //   return this.notificationsService.findOne(userId, id);
  // }

  // /* ------------------------------------------------------------------ */
  // /* PATCH /notifications/:id/read ------------------------------------ */
  // /* ------------------------------------------------------------------ */
  // @ApiOperation({ summary: 'Đánh dấu 1 thông báo đã đọc' })
  // @ApiParam({ name: 'id', type: Number })
  // @Patch(':id/read')
  // @ApiResponse({ status: 204, description: 'No Content' })
  // async markRead(
  //   @CurrentUser('id') userId: number,
  //   @Param('id', ParseIntPipe) id: number,
  // ) {
  //   await this.notificationsService.markRead(userId, id);
  // }

  // /* ------------------------------------------------------------------ */
  // /* PATCH /notifications/read-all ------------------------------------ */
  // /* ------------------------------------------------------------------ */
  // @ApiOperation({ summary: 'Đánh dấu tất cả thông báo đã đọc' })
  // @Patch('read-all')
  // @ApiResponse({ status: 204, description: 'No Content' })
  // async markAllRead(
  //   @CurrentUser('id') userId: number,
  //   @Body() body: MarkReadAllDto,
  // ) {
  //   await this.notificationsService.markAllRead(userId, body?.before);
  // }

  @ApiOperation({ summary: 'Kiểm tra socket' })
  @Get('test-socket')
  async testSocket(
    @CurrentUser('id') userId: number
  ) {
    return await this.notificationsService.broadcastSystem({
      content: 'Chính sách giá mới',
      title: 'New price'
    })
  }

  // @Post('user/:id')
  // testUser(@Param('id') id: string, @Body() body: any) {
  //   this.notificationsService.sendToUser(id, {
  //     message: body?.message ?? 'Hello user ' + id,
  //     ts: Date.now(),
  //   });
  //   return { ok: true };
  // }

  // POST /notifications/test/category/news
  // @Post('category/:fname')
  // testCategory(@Param('fname') fname: string, @Body() body: any) {
  //   this.notificationsService.sendToCategory(fname, {
  //     message: body?.message ?? `Tin nóng ${fname}`,
  //     ts: Date.now(),
  //   });
  //   return { ok: true };
  // }
}
