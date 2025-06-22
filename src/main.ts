import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import {
  DatabaseExceptionFilter,
  GlobalExceptionFilter,
  ValidationExceptionFilter,
} from './common/filters';
import * as cookieParser from 'cookie-parser';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);
  app.useStaticAssets(join(__dirname, '..', 'public')); //js, css, images
  app.setBaseViewsDir(join(__dirname, '..', 'views')); //view
  app.setViewEngine('ejs');
  app.enableCors({origin: '*'})
  app.use(cookieParser())
  app.useGlobalFilters(
    new ValidationExceptionFilter(),
    new DatabaseExceptionFilter(),
    new GlobalExceptionFilter(),
  );
  app.useGlobalPipes(
    new ValidationPipe({
      // Chuẩn rest
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.setGlobalPrefix('api');
  const config = new DocumentBuilder()
    .setTitle('EngFlash API')
    .addBearerAuth()
    .addTag('auth')
    .addTag('users')
    .addTag('statistics')
    .addTag('notifications')
    // .addTag('health')
    .setDescription('Engflash API Documentation')
    .setVersion('1')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Thêm đoạn này để khởi động microservice RabbitMQ
  const rabbitmqUrl = configService.get<string>('RABBITMQ_URL') || 'amqp://localhost:5672';
  
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [rabbitmqUrl],
      queue: configService.get<string>('RABBITMQ_CARD_QUEUE') || 'default_queue',
      queueOptions: { durable: true },
      socketOptions: {
        heartbeatIntervalInSeconds: 60,
        reconnectTimeInSeconds: 5,
      },
      // persistent: true,
    },
  });

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [rabbitmqUrl],
      queue: configService.get<string>('RABBITMQ_EMAIL_QUEUE') || 'default_queue',
      queueOptions: { durable: true },
      socketOptions: {
        heartbeatIntervalInSeconds: 60,
        reconnectTimeInSeconds: 5,
      },
      // persistent: true,
    },
  });

  await app.startAllMicroservices(); 
  console.log('✅ [Microservice] RabbitMQ microservice started successfully!');

  await app.listen(configService.get<string>('PORT') ?? 3000);
}

bootstrap();
