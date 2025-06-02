// 3. Serviço de registro de e-mails - email-registry.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EmailEntity } from './email.entity';
import { Repository } from 'typeorm';
import { AddEmailDto } from './add-email.dto';
import { EmailBlockEntity } from './emailsBlock.entity';

@Injectable()
export class EmailRegistryService {

  constructor(
    @InjectRepository(EmailEntity)
    private readonly repo: Repository<EmailEntity>,
    @InjectRepository(EmailBlockEntity)
    private readonly repoBlock: Repository<EmailBlockEntity>,
  ) { }

  async add(dto: AddEmailDto) {
    const existe = await this.repo.findOne({ where: { email: dto.email } });
    if (!existe) {
      const novo = this.repo.create(dto);
      await this.repo.save(novo);
    }
    return { success: true };
  }

  async list(): Promise<any[]> {
    const registros = await this.repo.find();

    const result = registros.map(registro => ({
      email: registro.email,
      chatId: registro.chatId,
      senha: registro.senha,
    }));

    return result;
  }

  async listBlock(): Promise<EmailBlockEntity[]> {
    return this.repoBlock.find();
  }

  async findByChat(chatId: string): Promise<EmailEntity[]> {
    return this.repo.find({ where: { chatId } });
  }

  async updatePassword(email: string, novaSenha: string): Promise<boolean> {
    const registro = await this.repo.findOne({ where: { email } });
    if (!registro) return false;
    registro.senha = novaSenha;
    await this.repo.save(registro);
    return true;
  }

  async updateChat(email: string, novoChatId: string): Promise<boolean> {
    const registro = await this.repo.findOne({ where: { email } });
    if (!registro) return false;
    registro.chatId = novoChatId;
    await this.repo.save(registro);
    return true;
  }

  async remove(email: string): Promise<boolean> {
    const existing = await this.repo.findOne({ where: { email } });
    if (!existing) return false;
    await this.repo.remove(existing);
    return true;
  }

  async block(email: string): Promise<boolean> {
    const registro = await this.repoBlock.findOne({ where: { email } });
    if (!registro) {
      const novo = this.repoBlock.create({ email });
      await this.repoBlock.save(novo);
    }
    return true;
  }

  async unblock(email: string): Promise<boolean> {
    const registro = await this.repoBlock.findOne({ where: { email } });
    if (!registro) return false;
    await this.repoBlock.remove(registro);
    return true;
  }
}

