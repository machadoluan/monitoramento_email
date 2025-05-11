import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EmailService } from './email/email.service';
import { EmailModule } from './email/email.module';
import { TelegramModule } from './telegram/telegram.module';
import { AlertModule } from './alert/alert.module';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';
import { DebugModule } from './debug/debug.module';
import { AuthController } from './auth/auth.controller';
import { KeywordModule } from './keyword/keyword.module';

@Module({
  imports: [  
    ConfigModule.forRoot({ isGlobal: true }),   
    ScheduleModule.forRoot(), 
    EmailModule, 
    TelegramModule, 
    AlertModule,
    DebugModule,
    KeywordModule],
  controllers: [AppController, AuthController],
  providers: [AppService],
})
export class AppModule {}
