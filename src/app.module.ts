import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EmailService } from './email/email.service';
import { EmailModule } from './email/email.module';
import { TelegramModule } from './telegram/telegram.module';
import { AlertModule } from './alert/alert.module';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DebugModule } from './debug/debug.module';
import { AuthController } from './auth/auth.controller';
import { KeywordModule } from './keyword/keyword.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AlertEntity } from './alert/alert.entity';
import { Keyword } from './keyword/keyword.entity';
import { EmailEntity } from './email/email.entity';
import { BlockWord } from './keyword/blockword.entity';
import { EmailBlockEntity } from './email/emailsBlock.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get<string>('DATABASE_HOST'),
        port: configService.get<number>('DATABASE_PORT'),
        username: configService.get<string>('DATABASE_USER'),
        password: 'Machado@Luan121107#',
        database: configService.get<string>('DATABASE_NAME'),
        entities: [AlertEntity, Keyword, EmailEntity, BlockWord, EmailBlockEntity],
        autoLoadEntities: true,
        synchronize: true,
      }),
      inject: [ConfigService],
    }),
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    EmailModule,
    TelegramModule,
    KeywordModule,
    DebugModule,
    AlertModule,],
  controllers: [AppController, AuthController],
  providers: [AppService],
})
export class AppModule { }
