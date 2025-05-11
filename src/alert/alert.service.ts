import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { EmailService } from 'src/email/email.service';
import { TelegramService } from 'src/telegram/telegram.service';

@Injectable()
export class AlertService {
}
