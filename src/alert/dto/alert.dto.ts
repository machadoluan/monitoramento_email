export class AlertDto {
  time: string;         // timestamp do recebimento
  aviso: string;        // “⚠️ Alerta de No-break”
  data: string;     // Data/Hora extraído do corpo
  hora: string;
  ip: string;           // IP
  nomeSistema: string;  // Nome Sistema
  contato: string;      // Contato Sistema
  localidade: string;   // Localidade Sistema
  status: string;       // Status
  mensagemOriginal?: string
}
