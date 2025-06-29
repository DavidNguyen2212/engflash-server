import { Injectable, Logger } from '@nestjs/common';
import { EventPattern, Payload, Ctx, RmqContext } from '@nestjs/microservices';

@Injectable()
export class DeadLetterService {
  private readonly logger = new Logger(DeadLetterService.name);

  @EventPattern('card_review_dlq')
  async handleDeadLetterMessage(
    @Payload() data: any,
    @Ctx() context: RmqContext,
  ) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();
    
    this.logger.error(`💀 [DeadLetterService] Processing dead letter message:`, {
      cardId: data.cardId,
      reviewId: data.reviewId,
      userId: data.userId,
      error: data.error || 'Unknown error',
      retryCount: originalMsg.properties.headers?.retryCount || 0,
    });

    // Log the failed message for manual intervention
    // In production, you might want to:
    // 1. Send notification to admin
    // 2. Store in database for manual processing
    // 3. Send to monitoring service
    
    // Acknowledge the dead letter message
    channel.ack(originalMsg);
    
    // TODO: Implement manual recovery mechanism
    // This could be a webhook, admin panel, or automated retry after some time
  }

  /**
   * Manual retry mechanism for failed messages
   * This can be called from admin panel or scheduled job
   */
  async retryFailedMessage(messageData: any) {
    this.logger.log(`🔄 [DeadLetterService] Manual retry for card ${messageData.cardId}`);
    
    // Reset retry count and send back to main queue
    // Implementation depends on your specific needs
  }
} 