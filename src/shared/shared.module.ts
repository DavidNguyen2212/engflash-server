import { Module } from '@nestjs/common';
import { EmailService } from './services/email.service';
import { OpenAIService } from './services/openai.service';

@Module({
  providers: [EmailService, OpenAIService],
  exports: [EmailService, OpenAIService],
})
export class SharedModule {}
