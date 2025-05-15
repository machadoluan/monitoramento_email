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
import { EmailRegistryService } from './email-registry.service';

dotenv.config();

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  constructor(
    private readonly kw: KeywordService,
    private readonly alertService: AlertService,
    private readonly emailRegistryService: EmailRegistryService
  ) { }

  private processing = false;

  // private readonly imapConfig = {
  //   imap: {
  //     user: process.env.IMAP_EMAIL,
  //     password: process.env.IMAP_PASSWORD,
  //     host: process.env.IMAP_HOST,       // imap.kinghost.net
  //     port: Number(process.env.IMAP_PORT), // 993
  //     tls: process.env.IMAP_TLS === 'true',
  //     tlsOptions: { rejectUnauthorized: false },
  //     authTimeout: 5000,
  //   },
  // };

  private escapeMarkdown(text: string): string {
    return text.replace(/([_*[\]()~`>#+=|{}.!-])/g, '\\$1');
  }

  private async enviarTelegramComOuSemCorpo(dto: AlertDto, id: string, chatId: string) {
    const msgText = this.escapeMarkdown([
      `⚠️ Alerta de No-break`,
      `🖥️ Aviso: ${dto.aviso}`,
      `⏰ Data/Hora: ${dto.dataHora}`,
      `🖥️ Sistema: ${dto.nomeSistema}`,
      `📞 Contato: ${dto.contato}`,
      `📍 Localidade: ${dto.localidade}`,
      `❗️ Status: ${dto.status}`,
    ].join('\n'));
  
    const payload = {
      chat_id: chatId,
      text: msgText,
      reply_markup: {
        inline_keyboard: [[{ text: '📨 Ver corpo do e-mail', callback_data: `ver_corpo::${id}` }]],
      },
    };
    this.logger.debug(`📤 Enviando mensagem para Telegram (chatId: ${chatId})`);
    this.logger.debug(`📦 Payload: ${JSON.stringify(payload, null, 2)}`);
  
    try {
      const res = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
  
      const data = await res.json();
  
      if (!res.ok) {
        this.logger.error(`❌ Erro no envio para o Telegram: ${res.status} - ${res.statusText}`);
        this.logger.error(`📨 Resposta do Telegram: ${JSON.stringify(data, null, 2)}`);
      } else {
        this.logger.log(`✅ Mensagem enviada ao Telegram com sucesso (chatId: ${chatId})`);
      }
    } catch (err) {
      this.logger.error(`💥 Exceção ao enviar mensagem para Telegram: ${err.message}`);
    }
  }
  

  private async fetchAndProcess() {
    const registros = await this.emailRegistryService.list();
  
    for (const reg of registros) {
      const host = reg.email.includes('@gmail.com')
        ? 'imap.gmail.com'
        : 'imap.kinghost.net';
  
      const connection = await Imap.connect({
        imap: {
          user: reg.email,
          password: reg.senha,
          host,
          port: 993,
          tls: true,
          tlsOptions: { rejectUnauthorized: false },
        },
      });
  
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
  
        const fields: Record<string, string> = {};
  
        // 🔍 Extração de texto
        const plainText = (parsed.text || parsed.html || '').replace(/\r/g, '');
        const lines = plainText.split('\n').map(l => l.trim()).filter(Boolean);
  
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
  
          // 1. Captura todos os "Chave: Valor" da linha
          const matches = [...line.matchAll(/([\wÀ-ÿ \/]+):\s*([^\n:]+?)(?=(?:\s+\w+\s*:\s*)|$)/g)];
          if (matches.length > 0) {
            for (const [, rawKey, rawValue] of matches) {
              const key = rawKey.trim();
              const value = rawValue.trim();
              fields[key] = value;
            }
          } else {
            // 2. "Status:" seguido por valor na próxima linha
            if (/^Status:?$/i.test(line) && i + 1 < lines.length) {
              const nextLine = lines[i + 1].trim();
              if (nextLine) {
                fields['Status'] = nextLine;
                i++;
              }
            }
          }
        }
  
        // 3. Se ainda não encontrou nada, tenta HTML (tabela)
        if (Object.keys(fields).length === 0 && parsed.html) {
          const cheerio = await import('cheerio');
          const $ = cheerio.load(parsed.html);
  
          $('table tr').each((_, row) => {
            const key = $(row).find('td').eq(0).text().trim();
            const value = $(row).find('td').eq(1).text().trim();
            if (key) fields[key] = value;
          });
        }
  
        // ✂️ Limpeza do corpo para salvar no banco e exibir no Telegram
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
          dataHora: fields['Data/Hora'] || fields['Date/Time'] || fields['Date'] || '(sem data)',
          ip: fields['IP'] || '(sem IP)',
          nomeSistema: fields['Nome Sistema'] || fields['System Name'] || fields['Name'] || '(sem nome)',
          contato: fields['Contato Sistema'] || fields['System Contact'] || fields['Contact'] || '(sem contato)',
          localidade: fields['Localidade Sistema'] || fields['System Location'] || fields['Location'] || '(sem localidade)',
          status: fields['Status'] || fields['Code'] || '(sem status)',
          mensagemOriginal: corpoTexto,
        };
  
        if (relevante) {
          const saved = await this.alertService.create(dto);
          await this.enviarTelegramComOuSemCorpo(dto, saved.id, reg.chatId);
          await this.notificarAlexa(dto.contato, dto.status);
        } else {
          this.logger.log(`🗑️ Ignorado: ${assunto}`);
        }
      }
  
      await connection.end();
    }
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

  private async notificarAlexa(contato: string, status: string) {
    const url = `https://maker.ifttt.com/trigger/alerta_no_break/with/key/${process.env.IFTTT_KEY}`;
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        value1: contato,
        value2: status,
      }),
    });
  }
}