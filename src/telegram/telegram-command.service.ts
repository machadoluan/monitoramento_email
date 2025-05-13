// src/telegram/telegram-command.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import fetch from 'node-fetch';
import { KeywordService } from '../keyword/keyword.service';
import { AlertService } from '../alert/alert.service';
import { EmailRegistryService } from 'src/email/email-registry.service';

@Injectable()
export class TelegramCommandService {
  private readonly logger = new Logger(TelegramCommandService.name);
  private offset = 0;

  constructor(
    private readonly kw: KeywordService,
    private readonly alertService: AlertService,
    private readonly registry: EmailRegistryService
  ) { }

  @Cron(CronExpression.EVERY_5_SECONDS)
  async pollCommands() {
    const url = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/getUpdates?offset=${this.offset}`;
    try {
      const res = await fetch(url);
      const json = await res.json();
      if (!json.ok) throw new Error(JSON.stringify(json));

      for (const upd of json.result) {
        this.offset = upd.update_id + 1;

        if (upd.message?.text) {
          await this.handle(upd.message.chat.id, upd.message.text);
        } else if (upd.callback_query) {
          const chatId = upd.callback_query.message.chat.id;
          const data = upd.callback_query.data;

          if (data.startsWith('ver_corpo::')) {
            const id = data.split('::')[1];
            const alert = await this.alertService.findById(id);
            const corpo = alert?.mensagemOriginal || '❌ Corpo do e-mail não encontrado.';

            await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: chatId,
                text: `📨 *Corpo do e-mail:*\n\n${corpo}`,
                parse_mode: 'Markdown',
              }),
            });
          }
        }
      }
    } catch (e) {
      this.logger.error('Erro pollCommands:', e);
    }
  }

  private async handle(chatId: number, text: string) {
    const match = text.match(/(?:[^\s"]+|"[^"]*")+/g) || [];
    const [cmd, ...args] = match.map(t => t.replace(/(^"|"$)/g, ''));

    const word = args.join(' ').trim();
    let resp: string;

    try {
      switch (cmd.toLowerCase()) {
        case '/addtag':
          if (!word) {
            resp = `❗ Uso: /addtag <palavra>`;
            break;
          }
          {
            const added = await this.kw.add(word);
            resp = added
              ? `✅ Palavra '${word.toUpperCase()}' adicionada com sucesso.`
              : `⚠️ A palavra '${word.toUpperCase()}' já existe.`;
          }
          break;

        case '/removetag':
          if (!word) {
            resp = `❗ Uso: /removetag <palavra>`;
            break;
          }
          try {
            await this.kw.remove(word);
            resp = `✅ Palavra '${word.toUpperCase()}' removida com sucesso.`;
          } catch {
            resp = `⚠️ Não encontrei a palavra '${word.toUpperCase()}' para remover.`;
          }
          break;

        case '/vertags':
          {
            const all = await this.kw.getAll();
            if (all.length === 0) {
              resp = `🔑 Nenhuma palavra cadastrada ainda.`;
            } else {
              resp = `🔑 Palavras-cadastro:\n\n` + all.map(w => `• ${w}`).join('\n');
            }
          }
          break;

        case '/addemail':
          const [email, senha, chatIdArg] = args;
          if (!email || !senha || !chatIdArg) {
            resp = `❗ Uso: /addemail <email> <senha> <chatId>`;
          } else {
            await this.registry.add({
              email,
              senha: senha,
              chatId: chatIdArg,
            });
            resp = `✅ E-mail *${email}* vinculado ao chat *${chatIdArg}* com sucesso.`;
          }
          break;


        case '/listemails':
          {
            const all = await this.registry.findByChat(chatId.toString());
            if (!all.length) {
              resp = `⚠️ Nenhum e-mail registrado para este grupo.`;
            } else {
              resp = `📬 *E-mails registrados:*\n` + all.map(r => `• ${r.email}`).join('\n');
            }
          }
          break;

        case '/removeemail':
          {
            const [emailToRemove] = args;
            if (!emailToRemove) {
              resp = `❗ Uso: /removeemail <email>`;
              break;
            }
            const deleted = await this.registry.remove(emailToRemove, chatId.toString());
            resp = deleted
              ? `🗑️ E-mail *${emailToRemove}* removido com sucesso.`
              : `⚠️ Não encontrei o e-mail ou ele não pertence a este chat.`;
          }
          break;

        case '/editsenha':
          {
            const [emailEdit, novaSenha] = args;
            if (!emailEdit || !novaSenha) {
              resp = `❗ Uso: /editsenha <email> <novasenha>`;
              break;
            }
            const updated = await this.registry.updatePassword(emailEdit, novaSenha);
            resp = updated
              ? `✅ Senha de *${emailEdit}* atualizada com sucesso.`
              : `⚠️ E-mail não encontrado.`;
          }
          break;

        case '/setgrupo':
          {
            const [emailEdit, novoChatId] = args;
            if (!emailEdit || !novoChatId) {
              resp = `❗ Uso: /setgrupo <email> <chatId>`;
              break;
            }
            const updated = await this.registry.updateChat(emailEdit, novoChatId);
            resp = updated
              ? `✅ E-mail *${emailEdit}* agora envia alertas para o chat *${novoChatId}*.`
              : `⚠️ E-mail não encontrado.`;
          }
          break;


        default:
          resp =
            `🤖 *Comandos disponíveis:*\n\n` +

            `📌 *Palavras-chave:*\n` +
            `➕ /addtag <palavra> — adicionar palavra-chave\n` +
            `➖ /removetag <palavra> — remover palavra-chave\n` +
            `📃 /vertags — listar palavras-chave\n\n` +

            `📬 *E-mails monitorados:*\n` +
            `📥 /addemail <email> <senha> <chatId> — adicionar e-mail\n` +
            `📜 /listemails — listar e-mails cadastrados\n` +
            `🗑️ /removeemail <email> — remover e-mail\n` +
            `🔐 /editsenha <email> <novasenha> — alterar senha\n` +
            `📲 /setgrupo <email> <chatId> — mudar grupo destino dos alertas`;

      }
    } catch (err) {
      this.logger.error('Erro ao tratar comando:', err);
      resp = `❌ Ocorreu um erro ao processar seu comando.`;
    }

    await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: resp,
        parse_mode: 'Markdown',
      }),
    });
  }

}
