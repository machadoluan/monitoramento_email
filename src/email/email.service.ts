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
import * as cheerio from 'cheerio';

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



  private async enviarTelegramComOuSemCorpo(dto: AlertDto, id: string, chatId: string) {
    const msgText = [
      '⚠️ Alerta de No-break',
      `🖥️ Aviso: ${dto.aviso}`,
      `📅 Data: ${dto.data}`,
      `⏰ Hora: ${dto.hora}`,
      `🖥️ Sistema: ${dto.nomeSistema}`,
      `📞 Contato: ${dto.contato}`,
      `📍 Localidade: ${dto.localidade}`,
      `❗️ Status: ${dto.status}`,
    ].join('\n');
  
    // extrai só dígitos do contato
    const tel = dto.contato.replace(/\D/g, '');
    
    const keyboard: any[][] = [
      [{ text: '📨 Ver corpo do e-mail', callback_data: `ver_corpo::${id}` }]
    ];

    if (tel.length >= 8) {
      const waText = encodeURIComponent(
        `Recebemos um alerta de ${dto.aviso}, está tudo bem?`
      );
      keyboard.push([
        // botão de chamada vira callback_data
        { text: '📞 Ligar',    callback_data: `ligar:${tel}` },
        { text: '💬 WhatsApp', url: `https://api.whatsapp.com/send?phone=${tel}&text=${waText}` }
      ]);
    }
  
    const payload = {
      chat_id: chatId,
      text: msgText,
      reply_markup: {
        inline_keyboard: keyboard
      },
    };
  
    this.logger.debug(`📤 Enviando mensagem para Telegram (chatId: ${chatId})`);
    this.logger.debug(`📦 Payload: ${JSON.stringify(payload, null, 2)}`);
  
    try {
      const res = await fetch(
        `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        this.logger.error(`❌ Erro ao enviar para Telegram: ${res.status} - ${res.statusText}`);
        this.logger.error(`📨 Resposta do Telegram: ${JSON.stringify(data, null, 2)}`);
      } else {
        this.logger.log(`✅ Mensagem enviada ao Telegram com sucesso (chatId: ${chatId})`);
      }
    } catch (err) {
      this.logger.error(`💥 Exceção ao enviar mensagem para Telegram: ${err.message}`);
    }
  }



  private extrairDataHora(valor: string): { data: string, hora: string } {
    let data = '';
    let hora = '';
  
    if (valor.includes(' ')) {
      const partes = valor.trim().split(' ');
      if (partes.length >= 2) {
        // Checa se a primeira parte é data
        if (/\d{2}\/\d{2}\/\d{4}/.test(partes[0]) || /\d{4}\/\d{2}\/\d{2}/.test(partes[0])) {
          data = partes[0];
          hora = partes[1];
        }
      }
    } else {
      if (/\d{2}\/\d{2}\/\d{4}/.test(valor) || /\d{4}\/\d{2}\/\d{2}/.test(valor)) {
        data = valor;
      } else if (/\d{2}:\d{2}:\d{2}/.test(valor)) {
        hora = valor;
      }
    }
  
    return { data, hora };
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
  
          const fields: Record<string,string> = {};

          // 1) Sempre tente extrair da tabela HTML
          if (parsed.html) {
            const $ = cheerio.load(parsed.html);
            $('table tr').each((_, row) => {
              const cells = $(row).find('td');
              if (cells.length >= 2) {
                const key   = cells.eq(0).text().trim();  // ex: "Date/Time"
                const value = cells.eq(1).text().trim();  // ex: "2025/05/14 13:45:40"
                if (key) fields[key] = value;
              }
            });
          }
          
          // 2) Se não sobrou nada, tente o texto puro (allow ":" no valor)
          if (Object.keys(fields).length === 0 && parsed.text) {
            parsed.text
              .split(/\r?\n/)
              .map(l => l.trim())
              .filter(Boolean)
              .forEach(line => {
                const [rawKey, ...rest] = line.split(':');
                const val = rest.join(':').trim();
                if (rawKey && val) fields[rawKey.trim()] = val;
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

        const rawDataHora = fields['Data/Hora'] || fields['Date/Time'] || '';
const rawData = fields['Date'] || '';
const rawHora = fields['Time'] || fields['hora'] || '';

const { data: data1, hora: hora1 } = this.extrairDataHora(rawDataHora);
const { data: data2 } = this.extrairDataHora(rawData);
const { hora: hora2 } = this.extrairDataHora(rawHora);

const data = data1 || data2 || '(sem data)';
const hora = hora1 || hora2 || '';

const contatoRaw = fields['Contato Sistema'] || fields['System Contact'] || fields['Contact'] || '';
const localidadeRaw = fields['Localidade Sistema'] || fields['System Location'] || fields['Location'] || '';


const [contato, localidadeExtra] = contatoRaw.split(/System Location:/i);
const localidade = localidadeExtra?.trim() || localidadeRaw;
  
const dto: AlertDto = {
  time: `${data} ${hora}`.trim(),
  aviso: assunto,
  data: data,
  hora: hora,
  ip: fields['IP'] || '(sem IP)',
  nomeSistema: fields['Nome Sistema'] || fields['System Name'] || fields['Name'] || '(sem nome)',
  contato: contato?.trim() || '(sem contato)',
  localidade: localidade || '(sem localidade)',
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