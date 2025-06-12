import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
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
import { TopicsService } from './topics.service';
import { CurrentUser } from '../auth/decorators';
import { ProcessTranscriptDto, ProcessVideoDto } from './dto';

@ApiTags('topics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('topics')
export class TopicsController {
  constructor(private readonly topicsService: TopicsService) {}

  // Private route to add word to a default topic

  // Learning
  @Get()
  @ApiOperation({ summary: 'Get all topic id of current user' })
  @ApiResponse({ status: 201, description: 'Successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getAllTopics(@CurrentUser() user) {
    return this.topicsService.getAllTopicsByUser(user.id);
  }

  @Get(':topicId/cards')
  @ApiOperation({ summary: 'Get all cards from a single topic' })
  @ApiResponse({ status: 201, description: 'Successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiParam({ name: 'topicId', type: Number })
  async getCardsBySet(
    @CurrentUser() user,
    @Param('topicId', ParseIntPipe) topicId: number,
  ) {
    return this.topicsService.getAllCardsfromTopic(user.id, topicId);
  }

  // Video learning
  @Post('from-video')
  @ApiOperation({ summary: 'Call this to get transcript of video and vtt.' })
  @ApiResponse({ status: 201, description: 'Successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async processVideo(@CurrentUser() user, @Body() data: ProcessVideoDto) {
    return this.topicsService.createTranscriptFromVideo(data.url);
  }

  @Post('from-script')
  @ApiOperation({ summary: '' })
  @ApiResponse({ status: 201, description: 'Successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createTopicFromScript(
    @CurrentUser() user,
    @Body() data: ProcessTranscriptDto,
  ) {
    return this.topicsService.createTopicFromTranscript(
      user.id,
      data.url,
      data.level,
      data.topic_name,
    );
  }

  // Revision
  @Get(':topicId/revision-cards')
  @ApiOperation({
    summary: 'Get all cards needs to revise from a single topic',
  })
  @ApiResponse({ status: 201, description: 'Successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiParam({ name: 'topicId', required: true, type: Number })
  async getCardRevisionTopic(
    @CurrentUser() user,
    @Param('topicId', ParseIntPipe) topicId: number,
  ) {
    return this.topicsService.reviseTopicCards(user.id, topicId);
  }
}
