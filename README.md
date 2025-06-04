# Secret Santa Sorter 🎁

¡Organiza tus intercambios de Amigo Invisible (o Secret Santa) de forma fácil, rápida y divertida! Esta aplicación web te permite gestionar participantes, definir reglas de exclusión y enviar las asignaciones por correo electrónico de manera automática.

## Características Principales

*   Entrada ilimitada de participantes (nombre y correo electrónico).
*   Definición de título y descripción para el evento.
*   Algoritmo de asignación aleatoria inteligente que asegura que nadie se auto-regale.
*   Posibilidad de añadir reglas de exclusión (participantes que no deben regalarse entre sí).
*   Envío (o simulación) de correos electrónicos a cada participante con su asignación y los detalles del evento.
*   Interfaz de usuario moderna y festiva construida con ShadCN UI y Tailwind CSS.

## Tecnologías Utilizadas

*   [Next.js](https://nextjs.org/) (App Router)
*   [React](https://react.dev/)
*   [TypeScript](https://www.typescriptlang.org/)
*   [Tailwind CSS](https://tailwindcss.com/)
*   [ShadCN UI](https://ui.shadcn.com/)
*   [Nodemailer](https://nodemailer.com/) (para el envío de correos)
*   [Lucide Icons](https://lucide.dev/)

## Requisitos Previos

Antes de comenzar, asegúrate de tener instalado lo siguiente:

*   [Node.js](https://nodejs.org/) (versión 18.x o superior recomendada)
*   [npm](https://www.npmjs.com/), [yarn](https://yarnpkg.com/), o [pnpm](https://pnpm.io/) (gestor de paquetes)

## Instalación y Ejecución

Sigue estos pasos para configurar y ejecutar el proyecto localmente:

1.  **Clona el repositorio:**
    ```bash
    git clone https://github.com/TU_USUARIO/TU_REPOSITORIO.git
    ```
    (Reemplaza `https://github.com/TU_USUARIO/TU_REPOSITORIO.git` con la URL de tu repositorio)

2.  **Navega al directorio del proyecto:**
    ```bash
    cd secret-santa-sorter 
    # O el nombre del directorio donde clonaste el proyecto
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
    Copia el archivo de ejemplo `.env.local.example` a un nuevo archivo llamado `.env.local`:
    ```bash
    cp .env.local.example .env.local
    ```
    Luego, edita el archivo `.env.local` y añade tus credenciales de Gmail. Es **altamente recomendable** usar una "Contraseña de aplicación" de Google en lugar de tu contraseña principal:
    ```env
    EMAIL_USER="tu_correo@gmail.com"
    EMAIL_PASS="tu_contraseña_de_aplicacion_de_16_digitos"
    ```
    Si no configuras estas variables, la aplicación no podrá enviar correos reales y simulará el envío mostrando los detalles en la consola del servidor.

5.  **Ejecuta el servidor de desarrollo:**
    ```bash
    npm run dev
    # o si usas yarn:
    # yarn dev
    # o si usas pnpm:
    # pnpm dev
    ```
    La aplicación estará disponible en [http://localhost:9002](http://localhost:9002).

## Despliegue

Este proyecto está configurado para ser desplegado fácilmente con [Firebase App Hosting](https://firebase.google.com/docs/hosting). Consulta la documentación de Firebase para más detalles sobre el despliegue.

---

Este proyecto fue creado con [Firebase Studio](https://firebase.google.com/studio) y desarrollado con la ayuda de IA.
