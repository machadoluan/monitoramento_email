import { Body, Controller, Delete, Get, HttpStatus, HttpCode, NotFoundException, Param, Post, Put } from '@nestjs/common';
import { EmailService } from './email.service';
import { AddEmailDto } from './add-email.dto';
import { EmailRegistryService } from './email-registry.service';

@Controller('email')
export class EmailController {
  constructor(private readonly emailService: EmailService, private readonly registry: EmailRegistryService) { }

  @Post('addemail')
  async addEmail(@Body() dto: AddEmailDto) {
    return this.registry.add(dto);
  }

  @Post('listemails')
  async listEmails(@Body('chatId') chatId: string) {
    return this.registry.findByChat(chatId);
  }

  @Put(':email/senha')
  async updateSenha(
    @Param('email') email: string,
    @Body('senha') novaSenha: string,
  ) {
    const updated = await this.registry.updatePassword(email, novaSenha);
    if (!updated) throw new NotFoundException('E-mail não encontrado');
    return { success: true };
  }

  @Put(':email/chat')
  async updateChatId(
    @Param('email') email: string,
    @Body('chatId') novoChatId: string,
  ) {
    const updated = await this.registry.updateChat(email, novoChatId);
    if (!updated) throw new NotFoundException('E-mail não encontrado');
    return { success: true };
  }

  @Delete(':email')
  async removeEmail(@Param('email') email: string) {
    const removed = await this.registry.remove(email);
    if (!removed) throw new NotFoundException('E-mail não encontrado');
    return { success: true };
  }


  @Get('listblock')
  async listBlock() {
    return this.registry.listBlock();
  }

  @Get('list')
  async list() {
    return this.registry.list();
  }

  @Post('block')
  @HttpCode(HttpStatus.CREATED)
  addBlock(@Body('email') email: string) {
    return this.registry.block(email).then(added => ({ added }));
  }

  @Delete('block/:email')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeBlock(@Param('email') email: string) {
    return this.registry.unblock(email);
  }



}
