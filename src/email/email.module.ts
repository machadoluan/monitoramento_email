// src/email/email.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailService } from './email.service';
import { EmailController } from './email.controller';
import { AlertEntity } from 'src/alert/alert.entity';

// importe os módulos que providenciam os serviços
import { KeywordModule } from 'src/keyword/keyword.module';
import { AlertModule }   from 'src/alert/alert.module';
import { EmailRegistryService } from './email-registry.service';
import { EmailEntity } from './email.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([AlertEntity, EmailEntity]),  // pra AlertService injetar repo
    KeywordModule,                            // ← fornece KeywordService
    AlertModule,                              // ← fornece AlertService
  ],
  providers: [
    EmailService,
    EmailRegistryService
  ],
  controllers: [EmailController],
  exports: [EmailService, EmailRegistryService],
})
export class EmailModule {}
    