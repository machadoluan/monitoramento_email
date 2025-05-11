import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class TelegramService {
    private token = process.env.TELEGRAM_BOT_TOKEN;
    private chatId = process.env.TELEGRAM_CHAT_ID;
  
    async send(text: string) {
      await axios.post(
        `https://api.telegram.org/bot${this.token}/sendMessage`,
        { chat_id: this.chatId, text, parse_mode: 'Markdown' },
      );
    }
}
