// src/keyword/keyword.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Keyword } from './keyword.entity';
import { KeywordService } from './keyword.service';
import { KeywordController } from './keyword.controller';
import { BlockWord } from './blockword.entity';

@Module({
  imports: [ TypeOrmModule.forFeature([Keyword, BlockWord]) ],
  providers: [KeywordService],
  controllers: [KeywordController],
  exports: [KeywordService],
})
export class KeywordModule {}
