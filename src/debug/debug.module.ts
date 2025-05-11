// src/debug/debug.module.ts
import { Module } from '@nestjs/common';
import { EmailModule } from '../email/email.module';
import { DebugController } from './debug.controller';

@Module({
  imports: [],
  controllers: [DebugController],
})
export class DebugModule {}
