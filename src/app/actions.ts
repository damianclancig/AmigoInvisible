
'use server';

import type { Participant, ServerActionResponse, AssignmentLogEntry, ExclusionRule, ContactType } from '@/types';
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

const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const WHATSAPP_TEMPLATE_NAME = process.env.WHATSAPP_TEMPLATE_NAME;
const WHATSAPP_TEMPLATE_LANGUAGE_CODE = process.env.WHATSAPP_TEMPLATE_LANGUAGE_CODE;

const whatsAppConfigured = WHATSAPP_ACCESS_TOKEN && WHATSAPP_PHONE_NUMBER_ID && WHATSAPP_TEMPLATE_NAME && WHATSAPP_TEMPLATE_LANGUAGE_CODE;

async function sendWhatsAppMessage(phoneNumber: string, templateParams: { name: string; title: string; friend: string }): Promise<{ success: boolean; error?: string }> {
  if (!whatsAppConfigured) {
    return { success: false, error: 'Configuración de WhatsApp incompleta en variables de entorno.' };
  }

  const formattedPhoneNumber = phoneNumber.replace(/[^0-9]/g, '');

  const payload = {
    messaging_product: 'whatsapp',
    to: formattedPhoneNumber,
    type: 'template',
    template: {
      name: WHATSAPP_TEMPLATE_NAME!,
      language: {
        code: WHATSAPP_TEMPLATE_LANGUAGE_CODE!,
      },
      components: [
        {
          type: 'body',
          parameters: [
            { type: 'text', text: templateParams.name },
            { type: 'text', text: templateParams.title },
            { type: 'text', text: templateParams.friend },
          ],
        },
      ],
    },
  };

  try {
    const response = await fetch(`https://graph.facebook.com/v19.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error('Error sending WhatsApp message:', responseData);
      return { success: false, error: responseData.error?.message || `Error ${response.status} from WhatsApp API` };
    }
    return { success: true };
  } catch (error: any) {
    console.error('Exception sending WhatsApp message:', error);
    return { success: false, error: error.message || 'Unknown error sending WhatsApp message' };
  }
}


export async function processSecretSanta(
  eventTitle: string,
  eventDescription: string,
  participants: Participant[],
  exclusions: ExclusionRule[],
  notificationMethod: ContactType
): Promise<ServerActionResponse> {
  if (!eventTitle.trim()) {
    return { success: false, message: 'El título del evento no puede estar vacío.' };
  }
  if (participants.length < 2) {
    return { success: false, message: 'Se requieren al menos dos participantes.' };
  }
  if (participants.some(p => p.contactType !== notificationMethod)) {
     return { success: false, message: `Conflicto en el método de notificación. Todos los participantes deben coincidir con el método seleccionado para el evento ('${notificationMethod === 'email' ? 'Email' : 'WhatsApp'}').` };
  }
   if (participants.length < 3 && exclusions.length > 0) {
    return { success: false, message: 'No se pueden aplicar exclusiones con menos de 3 participantes.'};
  }

  let assignments: { giver: Participant; receiver: Participant }[] = [];
  let foundValidAssignment = false;
  const MAX_ATTEMPTS = 100;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const shuffledParticipants = shuffleArray(participants);
    const currentAssignments: { giver: Participant; receiver: Participant }[] = [];
    let possibleThisAttempt = true;

    for (let i = 0; i < shuffledParticipants.length; i++) {
      const giver = shuffledParticipants[i];
      const receiver = shuffledParticipants[(i + 1) % shuffledParticipants.length];

      if (giver.id === receiver.id) {
        possibleThisAttempt = false;
        break;
      }

      let violatesExclusion = false;
      for (const rule of exclusions) {
        if (
          (rule.participant1Id === giver.id && rule.participant2Id === receiver.id) ||
          (rule.participant1Id === receiver.id && rule.participant2Id === giver.id)
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
  let allNotificationsSentOrSimulatedSuccessfully = true;
  const emailServiceConfigured = !!(process.env.EMAIL_USER && process.env.EMAIL_PASS);

  for (const { giver, receiver } of assignments) {
    let messageSubjectOrType: string;
    let messageBodyHtml: string = '';
    let messageBodyText: string = '';
    let sendStatus: AssignmentLogEntry['sendStatus'] = 'no_configurado';
    let sendError: string | undefined;

    if (notificationMethod === 'email') {
      messageSubjectOrType = `¡Tu asignación de Amigo Invisible para "${eventTitle}"!`;
      messageBodyHtml = `
<p>Hola ${giver.name},</p>
<p>¡Prepárate para la diversión! Para el evento de Amigo Invisible "<strong>${eventTitle}</strong>", tú eres el Amigo Invisible de...</p>
<p style="font-size: 1.5em; font-weight: bold; margin: 1em 0;">${receiver.name}</p>
<p><strong>Descripción del evento:</strong><br/>
${eventDescription ? eventDescription.replace(/\n/g, '<br/>') : 'Sin descripción proporcionada.'}</p>
<p>¡Felices regalos!</p>
      `.trim();
      messageBodyText = `
Hola ${giver.name},

¡Prepárate para la diversión! Para el evento de Amigo Invisible "${eventTitle}", tú eres el Amigo Invisible de...

**${receiver.name}**!

Descripción del evento:
${eventDescription || 'Sin descripción proporcionada.'}

¡Felices regalos!
      `.trim();

      if (emailServiceConfigured) {
        const emailResult = await sendEmail({
          to: giver.contact,
          subject: messageSubjectOrType,
          html: messageBodyHtml,
          text: messageBodyText,
        });

        if (emailResult.success) {
          sendStatus = 'enviado';
        } else {
          sendStatus = 'fallido';
          sendError = emailResult.error || 'Error desconocido al enviar email.';
          allNotificationsSentOrSimulatedSuccessfully = false;
        }
      } else {
        console.log(`SIMULACIÓN EMAIL (credenciales no configuradas) para ${giver.name} (${giver.contact}): Asignado: ${receiver.name}`);
        sendStatus = 'no_configurado';
      }
    } else if (notificationMethod === 'sms') { // 'sms' es para WhatsApp
      messageSubjectOrType = `Notificación WhatsApp: ${eventTitle}`;
      messageBodyText = `Hola ${giver.name}, para el Amigo Invisible "${eventTitle}", tu asignación es: *${receiver.name}*. ${eventDescription ? `Detalles: ${eventDescription}` : ''}`;
      messageBodyHtml = `<p>Giver: ${giver.name}, Event: ${eventTitle}, Receiver: ${receiver.name}</p><p>Descripción (si la plantilla la usa): ${eventDescription}</p>`;


      if (whatsAppConfigured) {
        const templateParams = {
          name: giver.name,
          title: eventTitle,
          friend: receiver.name,
        };
        const waResult = await sendWhatsAppMessage(giver.contact, templateParams);
        if (waResult.success) {
          sendStatus = 'enviado';
          messageBodyText = `Mensaje de WhatsApp (usando plantilla '${WHATSAPP_TEMPLATE_NAME}') enviado a ${giver.name} (${giver.contact}). Asignado: ${receiver.name}.`;
        } else {
          sendStatus = 'fallido';
          sendError = waResult.error || 'Error desconocido al enviar WhatsApp.';
          allNotificationsSentOrSimulatedSuccessfully = false;
           messageBodyText = `FALLO al enviar WhatsApp a ${giver.name} (${giver.contact}). Error: ${sendError}`;
        }
      } else {
        console.log(`SIMULACIÓN WHATSAPP (API no configurada) para ${giver.name} (${giver.contact}): Asignado: ${receiver.name}. Plantilla: ${WHATSAPP_TEMPLATE_NAME || 'No definida'}. Params: {{name: ${giver.name}, title: ${eventTitle}, friend: ${receiver.name}}}`);
        messageBodyText = `SIMULACIÓN: Hola ${giver.name}, para el Amigo Invisible "${eventTitle}", tu asignación es: *${receiver.name}*.`;
        sendStatus = 'simulado_whatsapp';
      }
    } else {
      messageSubjectOrType = "Error de notificación";
      messageBodyText = "Método de notificación no reconocido.";
      sendStatus = 'fallido';
      sendError = 'Método de notificación desconocido.';
      allNotificationsSentOrSimulatedSuccessfully = false;
    }

    assignmentsLog.push({
      giverName: giver.name,
      giverContact: giver.contact,
      receiverName: receiver.name,
      messageSubjectOrType,
      messageBodyHtml,
      messageBodyText,
      sendStatus,
      sendError,
      contactType: notificationMethod,
    });
  }

  let responseMessage: string;
  if (notificationMethod === 'email' && !emailServiceConfigured) {
    responseMessage = "¡Sorteo realizado! Las credenciales de correo no están configuradas. Los correos se han simulado en la consola del servidor.";
  } else if (notificationMethod === 'sms' && !whatsAppConfigured) { // WhatsApp
    responseMessage = "¡Sorteo realizado! La API de WhatsApp no está configurada. Los mensajes se han simulado en la consola del servidor.";
  } else if (notificationMethod === 'sms' && whatsAppConfigured && !allNotificationsSentOrSimulatedSuccessfully) {
     responseMessage = "Sorteo realizado, pero hubo problemas al enviar algunos mensajes de WhatsApp. Revisa los detalles."
  } else if (notificationMethod === 'sms' && whatsAppConfigured && allNotificationsSentOrSimulatedSuccessfully) {
     responseMessage = "¡Sorteo realizado con éxito! Se han enviado los mensajes de WhatsApp."
  }
   else if (allNotificationsSentOrSimulatedSuccessfully) {
    responseMessage = `¡Sorteo de Amigo Invisible realizado con éxito! Notificaciones procesadas.`;
  } else {
    responseMessage = `Sorteo realizado. Hubo problemas con algunas notificaciones. Revisa los detalles en el log de envíos o la consola del servidor.`;
  }

  return {
    success: true,
    message: responseMessage,
    assignmentsLog,
  };
}
