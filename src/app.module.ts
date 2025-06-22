import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { CardsModule } from './cards/cards.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { StatisticsModule } from './statistics/statistics.module';
import { TopicsModule } from './topics/topics.module';
import { SetsModule } from './sets/sets.module';
import { NotificationsModule } from './notifications/notifications.module';
import { HealthModule } from './health/health.module';
import { DataSource } from 'typeorm';
import { v2 as cloudinary } from 'cloudinary';
import { OauthModule } from './oauth/oauth.module';
import { CardQueueModule } from './rabbitmq/cards/cardQueue.module';
import { EmailQueueModule } from './rabbitmq/emails/emailQueue.module'; 
// import { LoggerModule } from './logger/logger.module';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get<string>('DATABASE_URL'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        migrations: ['database/migrations/*.ts'],
        synchronize: false,
        logging: false,
        logger: 'advanced-console',
        retryAttempts: 5,
        retryDelay: 3000,
        autoLoadEntities: true,
        keepConnectionAlive: true,
        verboseRetryLog: true,
        ssl: configService.get<boolean>('DATABASE_SSL'),
        extra: {
          max: configService.get<number>('DB_CONNECTION_LIMIT') || 10, // for pg
          idleTimeoutMillis: configService.get<number>('DB_TIMEOUT') || 60000,
          connectionTimeoutMillis:
            configService.get<number>('DB_ACQUIRE_TIMEOUT') || 60000,
        },
      }),
      inject: [ConfigService],
    }),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'captions'),
      serveRoot: '/captions',
    }),
    UsersModule,
    AuthModule,
    CardsModule,
    StatisticsModule,
    TopicsModule,
    SetsModule,
    NotificationsModule,
    HealthModule,
    OauthModule,
    CardQueueModule,
    EmailQueueModule
    // LoggerModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  constructor(
    private dataSource: DataSource,
    private configService: ConfigService,
  ) {
    cloudinary.config({
      cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
    });
  }
}
