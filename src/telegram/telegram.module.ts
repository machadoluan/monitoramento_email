// src/telegram/telegram.module.ts
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TelegramCommandService } from './telegram-command.service';
import { KeywordModule } from '../keyword/keyword.module';
import { AlertModule } from 'src/alert/alert.module';
import { EmailModule } from 'src/email/email.module';
import { EmailRegistryService } from 'src/email/email-registry.service';

@Module({
  imports: [
    KeywordModule,  
    AlertModule  ,         
    EmailModule// <— importa aqui
  ],
  providers: [ TelegramCommandService],
})
export class TelegramModule {}
