import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.connectMicroservice({
    transport: Transport.RMQ,
    options: {
      urls: [configService.get<string>('RABBITMQ_URL') || 'amqp://localhost:5672'],
      queue: configService.get<string>('RABBITMQ_QUEUE') || 'default_queue',
      queueOptions: { durable: true },
    },
  });

  await app.startAllMicroservices();
  console.log('🎯 Microservice listening on RabbitMQ!');
}
bootstrap();
