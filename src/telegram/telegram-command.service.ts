// src/telegram/telegram-command.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import fetch from 'node-fetch';
import { KeywordService } from '../keyword/keyword.service';

@Injectable()
export class TelegramCommandService {
  private readonly logger = new Logger(TelegramCommandService.name);
  private offset = 0;

  constructor(private readonly kw: KeywordService) {}

  @Cron(CronExpression.EVERY_5_SECONDS)
  async pollCommands() {
    const url = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/getUpdates?offset=${this.offset + 1}`;
    try {
      const res = await fetch(url);
      const json = await res.json();
      if (!json.ok) throw new Error(JSON.stringify(json));
      for (const upd of json.result) {
        this.offset = upd.update_id;
        if (!upd.message?.text) continue;
        await this.handle(upd.message.chat.id, upd.message.text);
      }
    } catch (e) {
      this.logger.error('Erro pollCommands:', e);
    }
  }

  private async handle(chatId: number, text: string) {
    const [cmd, ...args] = text.trim().split(/\s+/);
    let resp: string;

    switch (cmd.toLowerCase()) {
      case '/addtag':
        if (!args.length) { resp = 'Uso: /addkeyword <palavra>'; break; }
        resp = this.kw.addPositive(args.join(' ')) 
          ? `✅ Palavra '${args.join(' ')}' adicionada.`
          : `⚠️ Já existe '${args.join(' ')}'.`;
        break;
      case '/removertag':
        if (!args.length) { resp = 'Uso: /removekeyword <palavra>'; break; }
        resp = this.kw.removePositive(args.join(' ')) 
          ? `✅ Palavra '${args.join(' ')}' removida.`
          : `⚠️ Não achei '${args.join(' ')}'.`;
        break;
      
      case '/vertags':
        resp = [
          `🔑 *Palavras-chave:* \n \n ${this.kw.getPositive().map(p => `• ${p}`).join('\n')} \n`,
        ].join('\n');
        break;
      default:
        resp = 'Comando não reconhecido. Use /vertags';
    }

    await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: resp, parse_mode: 'Markdown' }),
    });
  }
}
