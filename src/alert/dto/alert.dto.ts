export class AlertDto {
  time: string;         // timestamp do recebimento
  aviso: string;        // “⚠️ Alerta de No-break”
  dataHora: string;     // Data/Hora extraído do corpo
  ip: string;           // IP
  nomeSistema: string;  // Nome Sistema
  contato: string;      // Contato Sistema
  localidade: string;   // Localidade Sistema
  status: string;       // Status
  mensagemOriginal?: string
}
