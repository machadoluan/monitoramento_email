// src/alert/alerts.controller.ts
import { Controller, Get } from '@nestjs/common';
import { AlertService } from './alert.service';
import { AlertDto } from './dto/alert.dto';
import { AlertEntity } from './alert.entity';

@Controller('alerts')
export class AlertsController {
  constructor(private readonly alertService: AlertService) {}

  @Get()
  getAlerts():  Promise<AlertEntity[]> {
    return this.alertService.findAll();
  }
}   
