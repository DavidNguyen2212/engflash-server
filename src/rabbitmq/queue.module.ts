import { Global, Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Card, Topic, UserCardReview, UserCardReviewChoice, UserCardReviewLog } from '../cards/entities';
import { User } from '../users/entities';
import { Set } from '../sets/entities';
import { SharedModule } from '../shared/shared.module';
import { CardReviewConsumer } from './consumers/card-review.consumer';
import { QueueService } from './queue.service';

@Global()
@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([
      Card,
      Topic,
      Set,
      User,
      UserCardReview,
      UserCardReviewChoice,
      UserCardReviewLog,
    ]),
    SharedModule,
    ClientsModule.registerAsync([
      {
        name: 'RABBITMQ_SERVICE',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => {
          const rabbitmqUrl = configService.get<string>('RABBITMQ_URL') || 'amqp://localhost:5672';
          const rabbitmqQueue = configService.get<string>('RABBITMQ_QUEUE') || 'default_queue';
          
          console.log('🔧 [QueueModule] Configuring RabbitMQ client...');
          console.log('🔧 [QueueModule] URL:', rabbitmqUrl);
          console.log('🔧 [QueueModule] Queue:', rabbitmqQueue);
          
          return {
            transport: Transport.RMQ,
            options: {
              urls: [rabbitmqUrl],
              queue: rabbitmqQueue,
              queueOptions: {
                durable: true,
              },
              socketOptions: {
                heartbeatIntervalInSeconds: 60,
                reconnectTimeInSeconds: 5,
              },
            },
          };
        },
        inject: [ConfigService],
      },
    ]),
  ],
  controllers: [CardReviewConsumer],
  // providers: [CardReviewConsumer],
  providers: [QueueService],
  // exports: ['RABBITMQ_SERVICE'], => Sai
  /** Trong NestJS, khi bạn dùng ClientsModule.registerAsync, các provider được đăng ký sẽ được export thông qua chính ClientsModule, chứ không phải module của bạn 
   * Ta inject như sau
   * 
   * @Inject('RABBITMQ_SERVICE') private readonly rabbitClient: ClientProxy,
  */
  exports: [ClientsModule, QueueService]
})
export class QueueModule {
  constructor() {
    console.log('[QueueModule] Loaded!');
  }
}
