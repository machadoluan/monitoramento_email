// src/keyword/keyword.controller.ts
import { Controller, Get, Post, Delete, Param, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { KeywordService } from './keyword.service';

@Controller('keywords')
export class KeywordController {
  constructor(private readonly kw: KeywordService) {}

  @Get()
  getAll(): Promise<string[]> {
    return this.kw.getAll();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  add(@Body('word') word: string) {
    return this.kw.add(word).then(added => ({ added }));
  }

  @Delete(':word')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('word') word: string) {
    return this.kw.remove(word);
  }

  @Get('listblock')
  async listBlock() {
    return this.kw.getAllBlock();
  }

  @Post('block')
  @HttpCode(HttpStatus.CREATED)
  addBlock(@Body('word') word: string) {
    return this.kw.addBlock(word).then(added => ({ added }));
  }

  @Delete('block/:word')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeBlock(@Param('word') word: string) {
    return this.kw.removeBlock(word);
  }
}
