import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class QueueService {
  constructor(
    @Inject('RABBITMQ_SERVICE') private readonly client: ClientProxy,
  ) {
    // this.client.connect()
  }

  emitReviewSwiped(data: any) {
    console.log("🚀 Emitting review.swiped event with data:", data);
    console.log("📤 Event pattern: review.swiped");
    return this.client.emit('review.swiped', data).subscribe({
      error: (err) => console.error('Failed to publish event:', err),
    });
  }
}
