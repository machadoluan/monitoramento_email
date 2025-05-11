// src/telegram/telegram.module.ts
import { Module } from '@nestjs/common';
import { TelegramCommandService } from './telegram-command.service';

@Module({
  providers: [TelegramCommandService],
})
export class TelegramModule {}
