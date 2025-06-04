
'use server';

import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export interface SendEmailResult {
  success: boolean;
  error?: string; // Mensaje de error simplificado para el log, no para el cliente directamente
}

const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;

let transporter: nodemailer.Transporter | null = null;

if (EMAIL_USER && EMAIL_PASS) {
  transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS,
    },
    // Opciones adicionales para mejorar la entregabilidad y evitar problemas de TLS/SSL
    // Es posible que necesites ajustarlas según tu entorno/proveedor de hosting
    // secure: true, // Usar true para el puerto 465, false para otros puertos como 587
    // tls: {
    //   ciphers:'SSLv3'
    // }
  });
} else {
  console.warn(
    'Credenciales de correo (EMAIL_USER, EMAIL_PASS) no configuradas en las variables de entorno. El envío de correos reales estará deshabilitado.'
  );
}

export const sendEmail = async ({ to, subject, html, text }: EmailOptions): Promise<SendEmailResult> => {
  if (!transporter) {
    return { 
      success: false, 
      error: 'Servicio de correo no inicializado debido a falta de credenciales (EMAIL_USER, EMAIL_PASS).' 
    };
  }

  const mailOptions = {
    from: `"Secret Santa Sorter" <${EMAIL_USER}>`,
    to,
    subject,
    text,
    html,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error: any) {
    console.error(`Error al enviar correo a ${to}:`, error);
    // Devolver un mensaje de error genérico para el log, no exponer detalles sensibles
    return { success: false, error: error.message || 'Error desconocido al enviar correo.' };
  }
};
