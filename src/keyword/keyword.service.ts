// src/keyword/keyword.service.ts
import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

interface Keywords {
  positive: string[];
  noise: string[];
}

@Injectable()
export class KeywordService {
  private readonly filePath = path.join(process.cwd(), 'keywords.json');
  private data: Keywords;

  constructor() {
    if (fs.existsSync(this.filePath)) {
      this.data = JSON.parse(fs.readFileSync(this.filePath, 'utf-8'));
    } else {
      this.data = {
        positive: ['BYPASS', 'MODO BATERIA', 'AC FAIL'],
        noise:    ['LIGOU NA TOMADA', 'TESTE DE ROTINA', 'INFORMAÇÃO'],
      };
      this.save();
    }
  }

  private save() {
    fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2));
  }

  getPositive(): string[] {
    return this.data.positive;
  }

  getNoise(): string[] {
    return this.data.noise;
  }

  addPositive(word: string): boolean {
    word = word.toUpperCase();
    if (!this.data.positive.includes(word)) {
      this.data.positive.push(word);
      this.save();
      return true;
    }
    return false;
  }

  removePositive(word: string): boolean {
    word = word.toUpperCase();
    const idx = this.data.positive.indexOf(word);
    if (idx >= 0) {
      this.data.positive.splice(idx, 1);
      this.save();
      return true;
    }
    return false;
  }

  addNoise(word: string): boolean {
    word = word.toUpperCase();
    if (!this.data.noise.includes(word)) {
      this.data.noise.push(word);
      this.save();
      return true;
    }
    return false;
  }

  removeNoise(word: string): boolean {
    word = word.toUpperCase();
    const idx = this.data.noise.indexOf(word);
    if (idx >= 0) {
      this.data.noise.splice(idx, 1);
      this.save();
      return true;
    }
    return false;
  }
}
