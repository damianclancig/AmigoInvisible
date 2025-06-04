
'use server';

import type { Participant, ServerActionResponse, AssignmentLogEntry, ExclusionRule } from '@/types';
import { sendEmail } from '@/services/emailService';

// Helper function to shuffle an array (Fisher-Yates shuffle)
function shuffleArray<T>(array: T[]): T[] {
  const shuffledArray = [...array];
  for (let i = shuffledArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
  }
  return shuffledArray;
}

export async function processSecretSanta(
  eventTitle: string,
  eventDescription: string,
  participants: Participant[],
  exclusions: ExclusionRule[]
): Promise<ServerActionResponse> {
  if (!eventTitle.trim()) {
    return { success: false, message: 'El título del evento no puede estar vacío.' };
  }
  if (participants.length < 2) {
    return { success: false, message: 'Se requieren al menos dos participantes.' };
  }
  if (participants.length < 3 && exclusions.length > 0) {
    return { success: false, message: 'No se pueden aplicar exclusiones con menos de 3 participantes.'};
  }


  let assignments: { giver: Participant; receiver: Participant }[] = [];
  let foundValidAssignment = false;
  const MAX_ATTEMPTS = 100; // Número de intentos para encontrar una asignación válida

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const shuffledParticipants = shuffleArray(participants);
    const currentAssignments: { giver: Participant; receiver: Participant }[] = [];
    let possibleThisAttempt = true;

    for (let i = 0; i < shuffledParticipants.length; i++) {
      const giver = shuffledParticipants[i];
      const receiver = shuffledParticipants[(i + 1) % shuffledParticipants.length];

      // Validar auto-asignación (aunque el shuffle circular debería evitarlo si hay > 1 participante)
      if (giver.id === receiver.id) {
        possibleThisAttempt = false;
        break;
      }

      // Verificar exclusiones
      let violatesExclusion = false;
      for (const rule of exclusions) {
        if (
          (giver.id === rule.participant1Id && receiver.id === rule.participant2Id) ||
          (giver.id === rule.participant2Id && receiver.id === rule.participant1Id)
        ) {
          violatesExclusion = true;
          break;
        }
      }

      if (violatesExclusion) {
        possibleThisAttempt = false;
        break; 
      }
      currentAssignments.push({ giver, receiver });
    }

    if (possibleThisAttempt) {
      assignments = currentAssignments;
      foundValidAssignment = true;
      break; 
    }
  }

  if (!foundValidAssignment) {
    return {
      success: false,
      message: 'No se pudo encontrar una asignación válida que respete todas las reglas de exclusión. Por favor, ajusta las exclusiones o el número de participantes.',
    };
  }


  const assignmentsLog: AssignmentLogEntry[] = [];
  let allEmailsSentSuccessfully = true;
  let emailServiceConfigured = !!(process.env.EMAIL_USER && process.env.EMAIL_PASS);

  for (const { giver, receiver } of assignments) {
    const emailSubject = `¡Tu asignación de Amigo Invisible para "${eventTitle}"!`;
    const emailBodyHtml = `
<p>Hola ${giver.name},</p>
<p>¡Prepárate para la diversión! Para el evento de Amigo Invisible "<strong>${eventTitle}</strong>", tú eres el Amigo Invisible de...</p>
<p style="font-size: 1.5em; font-weight: bold; margin: 1em 0;">${receiver.name}</p>
<p><strong>Descripción del evento:</strong><br/>
${eventDescription ? eventDescription.replace(/\n/g, '<br/>') : 'Sin descripción proporcionada.'}</p>
<p>¡Felices regalos!</p>
    `.trim();
    const emailBodyText = `
Hola ${giver.name},

¡Prepárate para la diversión! Para el evento de Amigo Invisible "${eventTitle}", tú eres el Amigo Invisible de...

**${receiver.name}**!

Descripción del evento:
${eventDescription || 'Sin descripción proporcionada.'}

¡Felices regalos!
    `.trim();

    let sendStatus: AssignmentLogEntry['sendStatus'] = 'no_configurado';
    let sendError: string | undefined;

    if (emailServiceConfigured) {
      const emailResult = await sendEmail({
        to: giver.email,
        subject: emailSubject,
        html: emailBodyHtml,
        text: emailBodyText,
      });

      if (emailResult.success) {
        sendStatus = 'enviado';
      } else {
        sendStatus = 'fallido';
        sendError = emailResult.error || 'Error desconocido al enviar.';
        allEmailsSentSuccessfully = false;
      }
    } else {
      console.log(`SIMULACIÓN (credenciales no configuradas): Email para ${giver.email}`);
      console.log(`  -> Destinatario (Amigo Invisible): ${receiver.name}`);
      console.log(`Asunto: ${emailSubject}`);
      console.log(`Cuerpo HTML:\n${emailBodyHtml}\n---`);
    }
    
    assignmentsLog.push({
      giverName: giver.name,
      giverEmail: giver.email,
      receiverName: receiver.name,
      emailSubject,
      emailBodyHtml,
      emailBodyText,
      sendStatus,
      sendError,
    });
  }
  
  let responseMessage: string;
  if (!emailServiceConfigured) {
    responseMessage = "¡Sorteo realizado! Las credenciales de correo no están configuradas. Los correos se han simulado en la consola del servidor.";
  } else if (allEmailsSentSuccessfully) {
    responseMessage = "¡Sorteo de Amigo Invisible realizado con éxito! Se han enviado (o intentado enviar) los correos con las asignaciones.";
  } else {
    responseMessage = "Sorteo realizado. Hubo problemas al enviar algunos correos. Revisa los detalles en el log de envíos o la consola del servidor.";
  }

  return {
    success: true, 
    message: responseMessage,
    assignmentsLog,
  };
}

