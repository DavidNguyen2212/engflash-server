// src/messaging/consumers/card-review.consumer.ts
import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload, Ctx, RmqContext } from '@nestjs/microservices';
import { EmailQueueService } from '../emailQueue.service'; 
import { SendCodeEvent } from '../../../auth/events';

@Controller()
export class VerificationConsumer {
  private readonly logger = new Logger(VerificationConsumer.name);
  constructor(
    private readonly queueService: EmailQueueService
  ) {}

  @EventPattern('email.verify')
  async receiveCardReviewCreated(
    @Payload() data: SendCodeEvent,
    @Ctx() context: RmqContext,
  ) {
     await this.queueService.resolveSendingVerificationMail(data)
  }

  @EventPattern('email.reset-password')
  async receiveSendingPasswordResetCode(
    @Payload() data: SendCodeEvent,
    @Ctx() context: RmqContext,
  ) {
     await this.queueService.resolveSendingPasswordResetCode(data)
  }
}