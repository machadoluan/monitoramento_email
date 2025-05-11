// src/email/email.service.ts

import { Injectable, Logger } from '@nestjs/common';
import * as Imap from 'imap-simple';
import { simpleParser, ParsedMail } from 'mailparser';
import fetch from 'node-fetch';
import * as dotenv from 'dotenv';
import { Cron, CronExpression } from '@nestjs/schedule';
import { KeywordService } from '../keyword/keyword.service';
import { AlertService } from 'src/alert/alert.service';
import { AlertDto } from 'src/alert/dto/alert.dto';

dotenv.config();

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  constructor(
    private readonly kw: KeywordService,
    private readonly alertService: AlertService,
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

  private async enviarTelegramComOuSemCorpo(dto: AlertDto, id: string) {
    const msgText = [
      `⚠️ *Alerta de No-break*`,
      `🖥️ *Aviso:* ${dto.aviso}`,
      `⏰ *Data/Hora:* ${dto.dataHora}`,
      `🌐 *IP:* ${dto.ip}`,
      `🖥️ *Sistema:* ${dto.nomeSistema}`,
      `📞 *Contato:* ${dto.contato}`,
      `📍 *Localidade:* ${dto.localidade}`,
      `❗️ *Status:* ${dto.status}`,
    ].join('\n');

    await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: process.env.TELEGRAM_CHAT_ID,
        text: msgText,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [[{ text: '📨 Ver corpo do e-mail', callback_data: `ver_corpo::${id}` }]],
        },
      }),
    });
  }

  private async fetchAndProcess() {
    const connection = await Imap.connect(this.imapConfig);
    await connection.openBox('INBOX');

    const messages = await connection.search(
      [['UNSEEN']],
      { bodies: [''], struct: true, markSeen: true },
    );

    for (const msg of messages) {
      const part = msg.parts.find(p => p.which === '');
      if (!part) continue;

      const raw = Buffer.isBuffer(part.body)
        ? part.body
        : Buffer.from(part.body as string, 'utf-8');

      const parsed: ParsedMail = await simpleParser(raw);

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

      const corpoTexto = (parsed.text || parsed.html || '')
        .replace(/<[^>]*>/g, '')
        .replace(/\s+/g, ' ')
        .trim();

      const U = (assunto + ' ' + corpoTexto).toUpperCase();
      const palavrasChave = await this.kw.getAll();
      const relevante = palavrasChave.some(k => U.includes(k));

      const dto: AlertDto = {
        time: dataHora,
        aviso: assunto,
        dataHora: fields['Data/Hora'] || '(sem data)',
        ip: fields['IP'] || '(sem IP)',
        nomeSistema: fields['Nome Sistema'] || '(sem nome)',
        contato: fields['Contato Sistema'] || '(sem contato)',
        localidade: fields['Localidade Sistema'] || '(sem localidade)',
        status: fields['Status'] || '(sem status)',
        mensagemOriginal: corpoTexto,
      };

      if (relevante) {
        const saved = await this.alertService.create(dto);
        await this.enviarTelegramComOuSemCorpo(dto, saved.id);
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