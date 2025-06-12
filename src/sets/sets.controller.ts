import {
  Body,
  Controller,
  Get,
  Param,
  ParseBoolPipe,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
  ValidationPipe,
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
import { SetsService } from './sets.service';
import { CurrentUser } from '../auth/decorators';

@ApiTags('sets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('sets')
export class SetsController {
  constructor(private readonly setsService: SetsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all set id of current user' })
  @ApiResponse({ status: 201, description: 'Successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getAllSets(@CurrentUser() user) {
    return this.setsService.getAllSetsByUser(user.id);
  }

  @Get(':setId/cards')
  @ApiOperation({ summary: 'Get all cards from a single set' })
  @ApiResponse({ status: 201, description: 'Successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiParam({ name: 'setId', type: Number })
  async getCardsBySet(
    @CurrentUser() user,
    @Param('setId', ParseIntPipe) setId: number,
  ) {
    return this.setsService.getAllCardsfromSet(user.id, setId);
  }

  // Revision
  @Get(':setId/revision-cards')
  @ApiOperation({ summary: '' })
  @ApiResponse({ status: 201, description: 'Successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiParam({ name: 'setId', required: true, type: Number })
  async getCardRevisionSet(
    @CurrentUser() user,
    @Param('setId', ParseIntPipe) setId: number,
  ) {
    return this.setsService.reviseSetCards(user.id, setId);
  }
}
