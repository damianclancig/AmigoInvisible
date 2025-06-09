
# Amigo Invisible 🎁

¡Organiza tus intercambios de Amigo Invisible de forma fácil, rápida y divertida! Esta aplicación web te permite gestionar participantes, definir reglas de exclusión y enviar las asignaciones por correo electrónico o WhatsApp de manera automática (WhatsApp requiere configuración adicional).

## Características Principales

*   Entrada ilimitada de participantes (nombre y contacto).
*   Opción de notificación por Email o WhatsApp.
*   Definición de título y descripción para el evento.
*   Algoritmo de asignación aleatoria inteligente que asegura que nadie se auto-regale.
*   Posibilidad de añadir reglas de exclusión (participantes que no deben regalarse entre sí).
*   Envío de correos electrónicos a cada participante con su asignación y los detalles del evento.
*   Integración (opcional) con la API Cloud de WhatsApp de Meta para enviar notificaciones por WhatsApp.
*   Interfaz de usuario moderna y festiva construida con ShadCN UI y Tailwind CSS.

## Tecnologías Utilizadas

*   [Next.js](https://nextjs.org/) (App Router)
*   [React](https://react.dev/)
*   [TypeScript](https://www.typescriptlang.org/)
*   [Tailwind CSS](https://tailwindcss.com/)
*   [ShadCN UI](https://ui.shadcn.com/)
*   [Nodemailer](https://nodemailer.com/) (para el envío de correos)
*   API Cloud de WhatsApp (integración opcional)
*   [Lucide Icons](https://lucide.dev/)

## Requisitos Previos

Antes de comenzar, asegúrate de tener instalado lo siguiente:

*   [Node.js](https://nodejs.org/) (versión 18.x o superior recomendada)
*   [npm](https://www.npmjs.com/), [yarn](https://yarnpkg.com/), o [pnpm](https://pnpm.io/) (gestor de paquetes)

## Instalación y Ejecución

Sigue estos pasos para configurar y ejecutar el proyecto localmente:

1.  **Clona el repositorio:**
    ```bash
    git clone https://github.com/damianclancig/AmigoInvisible.git
    ```

2.  **Navega al directorio del proyecto:**
    ```bash
    cd AmigoInvisible
    ```

3.  **Instala las dependencias:**
    ```bash
    npm install
    # o si usas yarn:
    # yarn install
    # o si usas pnpm:
    # pnpm install
    ```

4.  **Configura las variables de entorno:**
    Copia el archivo de ejemplo `.env.local.example` (si no existe, crea uno) a un nuevo archivo llamado `.env.local`:
    ```bash
    cp .env.local.example .env.local 
    # O crea .env.local manualmente
    ```
    Luego, edita el archivo `.env.local` y añade tus credenciales.

    **Para envío de Emails (Gmail):**
    Es **altamente recomendable** usar una "Contraseña de aplicación" de Google en lugar de tu contraseña principal.
    ```env
    EMAIL_USER="tu_correo@gmail.com"
    EMAIL_PASS="tu_contraseña_de_aplicacion_de_16_digitos"
    ```
    Si no configuras estas variables, la aplicación no podrá enviar correos reales y simulará el envío mostrando los detalles en la consola del servidor.

    **Para envío de WhatsApp (API Cloud de Meta - Opcional):**
    Si deseas habilitar el envío real de mensajes de WhatsApp, necesitarás configurar la API Cloud de WhatsApp en la plataforma de Meta for Developers. Esto incluye:
    *   Crear una App en Meta for Developers y configurar el producto WhatsApp.
    *   Añadir y verificar un número de teléfono.
    *   Crear y obtener la aprobación de una **plantilla de mensaje**. La aplicación está preparada para usar una plantilla con 3 variables en el cuerpo: `{{1}}` (nombre del que recibe), `{{2}}` (título del evento), `{{3}}` (nombre del asignado). Ejemplo de cuerpo de plantilla: `Hola {{1}}, para el evento de Amigo Invisible "{{2}}", tu asignación es: *{{3}}*. ¡Felices regalos!`
    *   Generar un token de acceso permanente.

    Añade las siguientes variables a tu `.env.local`:
    ```env
    # Variables para la API Cloud de WhatsApp (Opcional)
    WHATSAPP_ACCESS_TOKEN="TU_TOKEN_DE_ACCESO_PERMANENTE_DE_META"
    WHATSAPP_PHONE_NUMBER_ID="ID_DE_TU_NUMERO_DE_TELEFONO_REGISTRADO_EN_META"
    WHATSAPP_TEMPLATE_NAME="nombre_de_tu_plantilla_aprobada_en_meta" 
    WHATSAPP_TEMPLATE_LANGUAGE_CODE="codigo_de_idioma_de_tu_plantilla" # ej: es_AR, en_US, es
    ```
    Si estas variables no están configuradas, el envío por WhatsApp se simulará en la consola del servidor. **Importante:** Asegúrate de que los números de teléfono de los participantes se ingresen con el código de país (ej: `+5491123456789`). La API de Meta espera los números sin el `+` inicial para la llamada (ej: `5491123456789`), la aplicación intenta formatearlo, pero es bueno tenerlo en cuenta.

5.  **Ejecuta el servidor de desarrollo:**
    ```bash
    npm run dev
    # o si usas yarn:
    # yarn dev
    # o si usas pnpm:
    # pnpm dev
    ```
    La aplicación estará disponible en [http://localhost:9002](http://localhost:9002) (o el puerto que hayas configurado).

## Despliegue

Este proyecto está configurado para ser desplegado fácilmente con [Firebase App Hosting](https://firebase.google.com/docs/app-hosting). Recuerda configurar las variables de entorno necesarias en tu backend de App Hosting para el envío de correos y/o mensajes de WhatsApp en producción.

---

Este proyecto fue creado con [Firebase Studio](https://firebase.google.com/studio) y desarrollado con la ayuda de IA.
