import { BadRequestException, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Contratos } from './contratos.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { contatoDto } from './contato.dto';

@Injectable()
export class ContratosService {

    constructor(
        @InjectRepository(Contratos)
        private contratosRepository: Repository<Contratos>,
    ) { }

    async findAll(): Promise<Contratos[]> {
        const contratos = await this.contratosRepository.find();

        return contratos.map(c => ({
            ...c,
            tags: c.tags ? JSON.parse(c.tags) : []
        }));
    }

    async findForNumber(number: string): Promise<Contratos | null> {
        return await this.contratosRepository.findOne({ where: { telefone: number } });
    }

    async create(dados: contatoDto): Promise<{ success: boolean, message: string, contrato: Contratos }> {
        if (!dados.nome || !dados.telefone || !dados.endereco) {
            throw new BadRequestException('Dados incompletos');
        }

        if (dados.telefone.length !== 11) {
            throw new BadRequestException('Telefone inválido');
        }

        if (dados.endereco.length < 10) {
            throw new BadRequestException('Endereço inválido');
        }

        // Converte array em JSON string para salvar
        const contrato = this.contratosRepository.create({
            ...dados,
            tags: JSON.stringify(dados.tags || [])
        });

        const save = await this.contratosRepository.save(contrato);

        return {
            success: true,
            message: 'Contrato criado com sucesso',
            contrato: save
        };
    }

    async update(id: number, dados: contatoDto): Promise<{ success: boolean, message: string, contrato: Contratos }> {
        const contrato = await this.contratosRepository.findOne({ where: { id } });
        if (!contrato) {
            throw new BadRequestException('Contrato não encontrado');
        }
        if (!dados.nome || !dados.telefone || !dados.endereco) {
            throw new BadRequestException('Dados incompletos');
        }

        const updatedContrato = this.contratosRepository.merge(contrato, {
            ...dados,
            tags: JSON.stringify(dados.tags || [])
        });



        const save = await this.contratosRepository.save(updatedContrato);

        return {
            success: true,
            message: 'Contrato atualizado com sucesso',
            contrato: save
        };
    }

    async delete(id: number): Promise<{ success: boolean, message: string }> {
        const contrato = await this.contratosRepository.findOne({ where: { id } });
        if (!contrato) {
            throw new BadRequestException('Contrato não encontrado');
        }



        await this.contratosRepository.delete(id);

        return {
            success: true,
            message: 'Contrato deletado com sucesso'
        };
    }


}
