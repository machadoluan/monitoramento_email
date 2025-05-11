import { Controller, Get } from '@nestjs/common';
import { EmailService } from './email.service';

@Controller('email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  // @Get('ler')
  // async ler() {
  //   await this.emailService.fetchAndProcess();
  //   return { status: 'ok' };
  // }
}
