// src/alert/alert.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AlertEntity } from './alert.entity';
import { AlertDto } from './dto/alert.dto';
import { Alert } from '@microsoft/microsoft-graph-types';

@Injectable()
export class AlertService {
  constructor(
    @InjectRepository(AlertEntity)
    private readonly repo: Repository<AlertEntity>,
  ) {}

  async create(dto: AlertDto): Promise<AlertEntity> {
    const alert = this.repo.create(dto);
    return this.repo.save(alert);
  }

  async findAll(): Promise<AlertEntity[]> {
    return this.repo.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string){
    return this.repo.findOne({ where: { id } });
  }
}
