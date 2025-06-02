import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Client, LocalAuth } from 'whatsapp-web.js';
import * as QRCode from 'qrcode';
import { join, resolve } from 'path';

@Injectable()
export class WhatsappService implements OnModuleDestroy {
  private readonly logger = new Logger(WhatsappService.name);
  private client: Client;
  private qrCode: string | null = null;
  private isReady = false;

  constructor() {
    this.client = new Client({
      authStrategy: new LocalAuth({
        dataPath: resolve(process.cwd(), 'whatsapp-session'),
      }),
      puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      },
    });

    this.client.on('qr', qr => {
      this.logger.log('QR recebido: gere o código para escanear.');
      QRCode.toDataURL(qr)
        .then(url => {
          this.qrCode = url;
          this.logger.log('QR Code convertido e armazenado.');
        })
        .catch(err => {
          this.logger.error('Erro ao gerar QR Code:', err);
          this.qrCode = null;
        });
    });

    this.client.on('ready', () => {
      this.logger.log('✅ WhatsApp pronto e conectado!');
      this.isReady = true;
      this.qrCode = null;
    });

    this.client.on('authenticated', () => {
      this.logger.log('🔄 Sessão restaurada com sucesso!');
    });

    this.client.on('auth_failure', msg => {
      this.logger.error('❌ Falha na autenticação:', msg);
    });

    this.client.on('disconnected', reason => {
      this.logger.warn(`⚠️ WhatsApp desconectado: ${reason}`);
      this.isReady = false;
      this.qrCode = null;
    });

    this.client.initialize();
  }

  getQrCode() {
    return { qrCode: this.qrCode, isReady: this.isReady };
  }

  async sendMessage(number: string, message: string) {
    if (!this.isReady) {
      throw new Error('WhatsApp não está conectado!');
    }
    const chatId = number.includes('@c.us') ? number : `${number}@c.us`;
    await this.client.sendMessage(chatId, message);
    this.logger.log(`Mensagem enviada para ${chatId}: ${message}`);
  }

  async onModuleDestroy() {
    this.logger.log('Encerrando módulo WhatsAppService...');
    // Não destruir para manter a sessão
  }
}
