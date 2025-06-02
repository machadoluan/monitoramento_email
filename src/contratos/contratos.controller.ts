import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { ContratosService } from './contratos.service';
import { Contratos } from './contratos.entity';
import { contatoDto } from './contato.dto';

@Controller('contratos')
export class ContratosController {

    constructor(private contratosService: ContratosService) { }

    @Get()
    async findAll(): Promise<Contratos[]> {
        return this.contratosService.findAll();
    }

    @Post()
    async create(@Body() dados: contatoDto): Promise<{ success: boolean, message: string, contrato: Contratos }> {
        return this.contratosService.create(dados);
    }

    @Put(':id')
    async update(@Param('id') id: number, @Body() dados: contatoDto): Promise<{ success: boolean, message: string, contrato: Contratos }> {
        return this.contratosService.update(id, dados);
    }

    @Delete(':id')
    async delete(@Param('id') id: number): Promise<{ success: boolean, message: string }> {
        return this.contratosService.delete(id);
    }
}
