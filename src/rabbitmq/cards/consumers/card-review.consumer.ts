import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload, Ctx, RmqContext } from '@nestjs/microservices';
import { CardQueueService } from '../cardQueue.service';

@Controller()
export class CardReviewConsumer {
  private readonly logger = new Logger(CardReviewConsumer.name);
  constructor(
    private readonly queueService: CardQueueService
  ) {}

  @EventPattern('card.swipe')
  async receiveSendingVerificationMail(
    @Payload() data: any,
    @Ctx() context: RmqContext,
  ) {
     await this.queueService.resolveCardReviewCreated(data)
  }
}