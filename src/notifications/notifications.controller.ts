import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards';
import { CurrentUser } from '../auth/decorators';
import { NotificationsService } from './notifications.service';
import { UpdateSetDTO } from './dto';

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}
  // Private route to add word to a default topic

  // Learning
  @Patch('admin/sets/:setId')
  @ApiOperation({ summary: `Modify sets: admin priviledge` })
  @ApiResponse({ status: 201, description: 'Successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiParam({ name: 'setId', type: Number })
  async getStreakLength(
    @CurrentUser() user,
    @Param('setId', ParseIntPipe) setId: number,
    @Body() body: UpdateSetDTO,
  ) {
    const updatedSet = await this.notificationsService.updateSetAdmin(
      setId,
      body,
    );
    await this.notificationsService.notifySetUpdated(setId, updatedSet);

    return updatedSet;
  }
}
