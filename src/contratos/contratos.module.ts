import { Module } from '@nestjs/common';
import { ContratosController } from './contratos.controller';
import { ContratosService } from './contratos.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Contratos } from './contratos.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Contratos])],
  controllers: [ContratosController],
  providers: [ContratosService],
  exports: [ContratosService]
})
export class ContratosModule {}
