// src/keyword/keyword.module.ts
import { Module, Global } from '@nestjs/common';
import { KeywordService } from './keyword.service';

@Global()
@Module({
  providers: [KeywordService],
  exports: [KeywordService],
})
export class KeywordModule {}
