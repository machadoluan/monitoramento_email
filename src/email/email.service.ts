// src/email/email.service.ts

import { Injectable, Logger } from '@nestjs/common';
import * as Imap from 'imap-simple';
import { simpleParser, ParsedMail } from 'mailparser';
import fetch from 'node-fetch';
import * as dotenv from 'dotenv';
import { Cron, CronExpression } from '@nestjs/schedule';
import { KeywordService } from '../keyword/keyword.service';

dotenv.config();

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  constructor(
    private readonly kw: KeywordService,    // <- injeção
  ) { }
  private processing = false;

  private readonly imapConfig = {
    imap: {
      user: process.env.IMAP_EMAIL,
      password: process.env.IMAP_PASSWORD,
      host: 'imap.gmail.com',
      port: 993,
      tls: true,
      tlsOptions: { rejectUnauthorized: false },
      authTimeout: 5000,
    },
  };

  private async enviarTelegram(text: string) {
    const url = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: process.env.TELEGRAM_CHAT_ID,
        text,
        parse_mode: 'Markdown',
      }),
    });
    const json = await res.json();
    if (!json.ok) {
      this.logger.error('❌ Falha ao enviar Telegram:', json.description);
    }
  }

  private async fetchAndProcess() {
    const connection = await Imap.connect(this.imapConfig);
    await connection.openBox('INBOX');

    // Busca apenas e-mails não lidos e já marca como lido
    const messages = await connection.search(
      [['UNSEEN']],
      { bodies: [''], struct: true, markSeen: true }
    );

    for (const msg of messages) {
      // 'which' === '' indica o raw completo
      const part = msg.parts.find(p => p.which === '');
      if (!part) continue;

      const raw = Buffer.isBuffer(part.body)
        ? part.body
        : Buffer.from(part.body as string, 'utf-8');

      const parsed: ParsedMail = await simpleParser(raw);


      // Extrai assunto, remetente e data
      const assunto = parsed.subject?.trim() || '(sem assunto)';
      const remetente = parsed.from?.value?.[0]?.address || '(sem remetente)';
      const dataHora = parsed.date
        ? parsed.date.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
        : '(sem data)';

      const textBody = (parsed.text || '').trim();
      const lines = textBody
        .split(/\r?\n/)
        .map(l => l.trim())
        .filter(l => l.includes(':'));


      const fields: Record<string, string> = {};
      for (const line of lines) {
        const [key, ...rest] = line.split(':');
        fields[key.trim()] = rest.join(':').trim();
      }

      const sistema = fields['Nome Sistema'] || parsed.subject?.trim() || '(sem sistema)';


      // Extrai corpo limpo
      const corpoTexto = (parsed.text || parsed.html || '')
        .replace(/<[^>]*>/g, '')      // remove tags HTML
        .replace(/\s+/g, ' ')         // normalize whitespace
        .trim();

      this.logger.log(`📌 ${assunto} — ${remetente} — ${dataHora}`);
      this.logger.log(`📄 ${corpoTexto.slice(0, 100)}…`);

      // Filtros de relevância
      const U = (assunto + ' ' + corpoTexto).toUpperCase();
      const palavrasChave = this.kw.getPositive();
      const relevante = palavrasChave.some(k => U.includes(k));

      if (relevante) {
        const msgText = [
          `⚠️ *Alerta de No-break*`,
          `🖥️ *Aviso:* ${assunto}`,
          `📄 *Mensagem:* ${corpoTexto}`
        ].join('\n');

        this.logger.warn(msgText.replace(/\*/g, ''));
        await this.enviarTelegram(msgText);
      } else {
        this.logger.log(`🗑️ Ignorado: ${assunto}`);
      }
    }

    await connection.end();
  }

  @Cron(CronExpression.EVERY_5_SECONDS)
  async verificarPeriodicamente() {
    if (this.processing) return;
    this.processing = true;
    try {
      this.logger.log('⏱️ Iniciando verificação automática de e-mails');
      await this.fetchAndProcess();
    } finally {
      this.processing = false;
    }
  }
}
