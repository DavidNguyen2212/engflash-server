import { Inject, Injectable, Logger } from '@nestjs/common';
import { OpenAIService } from '../../shared/services/openai.service';
import { InjectRepository } from '@nestjs/typeorm';
import { UserCardReview, UserCardReviewChoice, UserCardReviewLog } from '../../cards/entities';
import { DataSource, QueryRunner, Repository } from 'typeorm';
import { capitalizeFirstLetter } from '../../common/utils';
import { TransactionalRunner } from '../../common/decorators';
import { PinoLogger } from 'nestjs-pino';
import { EmailService } from '../../shared/services/email.service';
import { SendCodeEvent } from '../../auth/events';

@Injectable()
export class EmailQueueService {
  private readonly transactionalRunner: TransactionalRunner
  private logger = new Logger(EmailQueueService.name)
  constructor(
    // private readonly logger: PinoLogger,
    private readonly emailService: EmailService
  ) { 
    // this.transactionalRunner = new TransactionalRunner(this.dataSource)
    // this.logger.setContext(QueueService.name)
  }

  async resolveSendingVerificationMail(data: SendCodeEvent) {
    this.logger.log(`🔄 Start writing email...`);
    await this.emailService.sendVerificationCode(data.email, data.code)
    this.logger.log(`📧 Verification email sent to ${data.email}!`);
  }

  async resolveSendingPasswordResetCode(data: SendCodeEvent) {
    this.logger.log(`🔄 Start writing email...`);
    await this.emailService.sendPasswordResetCode(data.email, data.code)
    this.logger.log(`📧 Reset email sent to ${data.email}!`);
  }
}
