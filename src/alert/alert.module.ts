// src/alert/alert.module.ts
import { Module } from '@nestjs/common';
import { AlertService } from './alert.service';
import { AlertsController } from './alert.controller';
import { AlertEntity } from './alert.entity';
import { TypeOrmModule } from '@nestjs/typeorm';


@Module({
  imports: [
    TypeOrmModule.forFeature([AlertEntity]),
  ],
  providers: [AlertService],
  controllers: [AlertsController],
  exports: [AlertService],
})
export class AlertModule {}
