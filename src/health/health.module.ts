import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { HttpModule } from '@nestjs/axios';
import { CloudinaryHealthIndicator } from './indicators';

@Module({
  imports: [TerminusModule, HttpModule],
  controllers: [HealthController],
  providers: [CloudinaryHealthIndicator]
})
export class HealthModule {}
