
export interface Participant {
  id: string;
  name: string;
  email: string;
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
  giverEmail: string;
  receiverName: string;
  emailSubject: string;
  emailBodyHtml: string; // Cuerpo del correo en HTML
  emailBodyText: string; // Cuerpo del correo en texto plano
  sendStatus: 'enviado' | 'fallido' | 'no_configurado'; // no_configurado si EMAIL_USER o EMAIL_PASS faltan
  sendError?: string; // Mensaje de error si falló
}

export interface ServerActionResponse {
  success: boolean;
  message: string;
  assignmentsLog?: AssignmentLogEntry[];
}

