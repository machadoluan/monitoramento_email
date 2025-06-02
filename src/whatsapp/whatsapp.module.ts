
import { Global, Module } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { WhatsappController } from './whatsapp.controller';

@Global()
@Module({
    imports: [],
    providers: [WhatsappService],
    controllers: [WhatsappController],
    exports: [WhatsappService]
})
export class WhatsappModule {}
