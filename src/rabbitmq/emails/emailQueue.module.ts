import { Global, Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Card, Topic, UserCardReview, UserCardReviewChoice, UserCardReviewLog } from '../../cards/entities';
import { User } from '../../users/entities';
import { Set } from '../../sets/entities';
import { SharedModule } from '../../shared/shared.module';
import { VerificationConsumer } from './consumers/verification.consumer'; 
import { EmailQueueService } from './emailQueue.service';

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
        name: 'EMAIL_QUEUE',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => {
          const rabbitmqUrl = configService.get<string>('RABBITMQ_URL') || 'amqp://localhost:5672';
          const rabbitmqQueue = configService.get<string>('RABBITMQ_EMAIL_QUEUE') || 'default_queue';
          
          return {
            transport: Transport.RMQ,
            options: {
              urls: [rabbitmqUrl],
              queue: rabbitmqQueue,
              queueOptions: {
                durable: true,
                arguments: {
                  'x-dead-letter-exchange': '',
                  'x-dead-letter-routing-key': 'email_queue_dlq', 
                }
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
  controllers: [VerificationConsumer],
  providers: [EmailQueueService],
  exports: [ClientsModule, EmailQueueService]
})
export class EmailQueueModule {
  constructor() {
    console.log('[EmailQueueModule] Loaded!');
  }
}
