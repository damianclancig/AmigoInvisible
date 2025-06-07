
export type ContactType = 'email' | 'sms'; // 'sms' se usará como base para números de teléfono (WhatsApp/SMS)

export interface Participant {
  id: string;
  name: string;
  contact: string; // Puede ser email o número de teléfono
  contactType: ContactType;
}

export interface Assignment {
  giver: Participant;
  receiver: Participant;
}

export interface ExclusionRule {
  id: string; // Un ID único para la regla de exclusión
  participant1Id: string;
  participant2Id: string;
  // Para mostrar en la UI de forma amigable
  participant1Name?: string;
  participant2Name?: string;
}

export interface AssignmentLogEntry {
  giverName: string;
  giverContact: string; // Email o teléfono del que da el regalo
  receiverName: string;
  messageSubjectOrType: string; // Asunto del correo o tipo de mensaje (ej. "Mensaje de WhatsApp: Amigo Invisible")
  messageBodyHtml: string; // Cuerpo del correo en HTML o mensaje de texto (puede ser el mismo para SMS/WhatsApp)
  messageBodyText: string; // Cuerpo del correo en texto plano o mensaje de texto
  sendStatus: 'enviado' | 'fallido' | 'no_configurado' | 'simulado_sms' | 'simulado_whatsapp';
  sendError?: string; // Mensaje de error si falló
  contactType: ContactType; // 'email' o 'sms' (para WhatsApp se usará 'sms' con el número)
}

export interface ServerActionResponse {
  success: boolean;
  message: string;
  assignmentsLog?: AssignmentLogEntry[];
}
