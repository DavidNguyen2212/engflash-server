// src/messaging/consumers/card-review.consumer.ts
import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload, Ctx, RmqContext } from '@nestjs/microservices';
import { QueueService } from '../queue.service';

@Controller()
export class CardReviewConsumer {
  private readonly logger = new Logger(CardReviewConsumer.name);
  constructor(
    private readonly queueService: QueueService
  ) {}

  @EventPattern('card.review.created')
  async receiveCardReviewCreated(
    @Payload() data: any,
    @Ctx() context: RmqContext,
  ) {
     await this.queueService.resolveCardReviewCreated(data)
  }
}