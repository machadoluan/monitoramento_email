// src/keyword/keyword.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Keyword } from './keyword.entity';

@Injectable()
export class KeywordService {
  constructor(
    @InjectRepository(Keyword)
    private readonly repo: Repository<Keyword>,
  ) {}

  async getAll(): Promise<string[]> {
    const kws = await this.repo.find({ order: { word: 'ASC' } });
    return kws.map(k => k.word);
  }

  async add(word: string): Promise<boolean> {
    word = word.trim().toUpperCase();
    const exists = await this.repo.findOne({ where: { word } });
    if (exists) return false;
    const kw = this.repo.create({ word });
    await this.repo.save(kw);
    return true;
  }

  async remove(word: string): Promise<void> {
    const result = await this.repo.delete({ word: word.trim().toUpperCase() });
    if (result.affected === 0) {
      throw new NotFoundException(`Keyword "${word}" não encontrada`);
    }
  }
}
