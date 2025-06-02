import { Controller, Get, Query } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';

@Controller('whatsapp')
export class WhatsappController {
  constructor(private readonly whatsappService: WhatsappService) {}

  @Get('qrcode')
  getQrCode() {
    return this.whatsappService.getQrCode();
  }

  @Get('send-test')
  async sendTest(@Query('number') number: string, @Query('message') message: string) {
    await this.whatsappService.sendMessage(number, message);
    return { status: 'Mensagem enviada!', number, message };
  }
}
