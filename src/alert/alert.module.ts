import { Module } from '@nestjs/common';
import { EmailService } from '../email/email.service';
import { TelegramService } from '../telegram/telegram.service';
import { AlertService } from './alert.service';

@Module({
  providers: [ TelegramService, AlertService],
  exports: [AlertService],
})
export class AlertModule {}
