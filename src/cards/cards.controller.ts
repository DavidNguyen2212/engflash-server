import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
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
import { CardsService } from './cards.service';
import { CurrentUser } from '../auth/decorators';
import { Roles } from 'src/common/decorators'
import {
  ModifyExampleDTO,
  AddCardDTO,
  NewMeaningDTO,
  ReviseCardDTO,
  AIExampleDTO,
  SimpleCardDTO,
  ReviewCardDTO,
} from './dto';
import { RolesGuard } from 'src/common/guards';

@ApiTags('cards')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('learner')
@Controller('cards')
export class CardsController {
  constructor(private readonly cardsService: CardsService) {}

  @Post('generation')
  @ApiOperation({ summary: 'Magical AI generation for example' })
  @ApiResponse({ status: 201, description: 'Successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMeaningfromAI(
    @CurrentUser() user,
    @Body() providedData: AIExampleDTO,
  ) {
    // english example and its Vnmese meaning
    return this.cardsService.getMeaningfromAI(providedData);
  }

  @Put('example')
  @ApiOperation({ summary: 'Modify the example of a card' })
  @ApiResponse({ status: 201, description: 'Successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async modifyCardExample(
    @CurrentUser() user,
    @Body() modifyExampleData: ModifyExampleDTO,
  ) {
    return this.cardsService.modifyCardExample(user.id, modifyExampleData);
  }

  @Post()
  @ApiOperation({
    summary: 'Add a new card (create a topic if topic_id is not provided)',
  })
  @ApiResponse({ status: 201, description: 'Successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async addNewCard(@CurrentUser() user, @Body() newCardData: AddCardDTO) {
    return this.cardsService.addCardtoTopic(user.id, newCardData);
  }

  @Post('grammar')
  @ApiOperation({ summary: 'Get the grammar of a card (if not presented).' })
  @ApiResponse({ status: 201, description: 'Successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async generateAIGrammar(
    @CurrentUser() user,
    @Body() { card_id }: SimpleCardDTO,
  ) {
    return this.cardsService.generateAIGrammar(user.id, card_id);
  }

  // Learn from video
  @Post('meaning')
  @ApiOperation({
    summary: 'Get the meaning of a single word in the transcript.',
  })
  @ApiResponse({ status: 201, description: 'Successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async extractMeaning(
    @CurrentUser() user,
    @Body() newCardData: NewMeaningDTO,
  ) {
    return this.cardsService.getSingleMeaning(newCardData);
  }

  @Delete(':card_id')
  @ApiOperation({ summary: 'Drop a card.' })
  @ApiResponse({ status: 200, description: 'Successfully deleted' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async deleteCardByUser(
    @CurrentUser() user,
    @Param('card_id', ParseIntPipe) cardId: number,
  ) {
    return this.cardsService.deleteCard(user.id, cardId);
  }

  // Learning (Swiping)
  @Post('learn')
  @ApiOperation({
    summary: 'Learn a card using spaced repetition (swipe left/right)',
  })
  @ApiResponse({ status: 201, description: 'Successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async swipeCard(@CurrentUser() user, @Body() body: ReviewCardDTO) {
    return this.cardsService.swipeCard(user.id, body);
  }
}
