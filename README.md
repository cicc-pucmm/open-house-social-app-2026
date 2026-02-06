<div align="center">
  <img src="./cicc.png" alt="CICC Logo" width="120" />
</div>

<h1 align="center">OpenHouse 2026 Social App</h1>

<p align="center">
  App social para el evento OpenHouse 2026. Permite a los asistentes tomar fotos, publicarlas, dar likes, comentar, y recibir sus fotos por correo electronico.
</p>

<div align="center">
  <img src="https://img.shields.io/badge/React_Native-1a1a2e?style=for-the-badge&logo=react&logoColor=61DAFB" />
  <img src="https://img.shields.io/badge/Expo-1c1c3a?style=for-the-badge&logo=expo&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeScript-2c3e50?style=for-the-badge&logo=typescript&logoColor=3178C6" />
  <img src="https://img.shields.io/badge/Convex-2a1a3a?style=for-the-badge&logo=convex&logoColor=F3694C" />
  <img src="https://img.shields.io/badge/TailwindCSS-355c5b?style=for-the-badge&logo=tailwind-css&logoColor=38B2AC" />
  <img src="https://img.shields.io/badge/HeroUI_Native-1a1a2e?style=for-the-badge&logo=heroui&logoColor=7C3AED" />
  <img src="https://img.shields.io/badge/Reanimated-2a1a3a?style=for-the-badge&logo=react&logoColor=61DAFB" />
  <img src="https://img.shields.io/badge/Resend-1a1a2e?style=for-the-badge&logo=resend&logoColor=white" />
  <img src="https://img.shields.io/badge/Expo_Router-1c1c3a?style=for-the-badge&logo=expo&logoColor=white" />
  <img src="https://img.shields.io/badge/Uniwind-355c5b?style=for-the-badge&logo=tailwind-css&logoColor=38B2AC" />
</div>

---

## Requisitos Previos

- Node.js >= 18
- pnpm
- Cuenta de [Convex](https://convex.dev)
- Cuenta de [Resend](https://resend.com) (para feature de email)
- Expo Go o dispositivo/simulador

## Instalacion

```bash
# 1. Instalar dependencias
pnpm install

# 2. Configurar Convex
npx convex dev
# Esto te pedira crear un proyecto o conectar a uno existente.
# Se generara automaticamente .env.local con CONVEX_DEPLOYMENT y EXPO_PUBLIC_CONVEX_URL.

# 3. Configurar variable de entorno de Resend en el dashboard de Convex:
#    RESEND_API_KEY=re_xxxxxxxxxxxx
#    O desde la CLI:
npx convex env set RESEND_API_KEY re_xxxxxxxxxxxx

# 4. Iniciar el servidor de desarrollo
npx expo start
```

## Variables de Entorno

| Variable | Donde | Descripcion |
|---|---|---|
| `EXPO_PUBLIC_CONVEX_URL` | `.env.local` | URL del deployment de Convex |
| `CONVEX_DEPLOYMENT` | `.env.local` | Deployment name de Convex |
| `RESEND_API_KEY` | Dashboard Convex | API Key de Resend para envio de correos |

## Estructura del Proyecto

```
├── convex/                  # Backend Convex
│   ├── schema.ts            # Esquema de la base de datos
│   ├── users.ts             # Funciones de usuarios
│   ├── posts.ts             # CRUD de publicaciones
│   ├── likes.ts             # Toggle de likes
│   ├── comments.ts          # Comentarios
│   ├── notifications.ts     # Push notifications (Expo)
│   ├── email.ts             # Envio de emails (Resend)
│   ├── emailActions.ts      # Acciones publicas de email
│   └── convex.config.ts     # Configuracion + componente Resend
├── src/
│   ├── app/                 # Expo Router (file-based routing)
│   │   ├── _layout.tsx      # Root layout (Stack + Providers)
│   │   ├── index.tsx        # Redirect: session check
│   │   ├── session.tsx      # Pantalla de sesion (username, email, phone)
│   │   ├── (tabs)/          # Tab navigator
│   │   │   ├── _layout.tsx  # Tabs config (Inicio, Crear)
│   │   │   ├── feed.tsx     # Feed con sorting (recientes/populares)
│   │   │   └── create.tsx   # Camara + captura + publicar
│   │   └── post/
│   │       └── [id].tsx     # Detalle de publicacion + comentarios
│   ├── components/          # Componentes reutilizables
│   │   ├── PostCard.tsx
│   │   ├── PostCarousel.tsx
│   │   ├── LikeButton.tsx
│   │   ├── CommentItem.tsx
│   │   ├── AdminMenu.tsx
│   │   ├── EmptyState.tsx
│   │   └── LoadingFeed.tsx
│   ├── hooks/
│   │   ├── useSession.ts
│   │   └── usePushNotifications.ts
│   └── lib/
│       ├── constants.ts
│       ├── session.ts
│       └── convex.tsx
├── global.css               # Tailwind + Uniwind + HeroUI + tema
├── metro.config.js
├── app.json
└── package.json
```

## Funcionalidades

### Crear Publicacion
- Camara nativa (frontal/trasera, flash)
- Captura multiples fotos (maximo 10)
- Previsualizacion y opcion de retomar
- Descripcion con limite de 2,200 caracteres
- Las imagenes se redimensionan a 1080px y se comprimen a JPEG 80%

### Feed
- Dos modos de ordenamiento: **Mas Recientes** y **Mas Populares**
- Pull-to-refresh
- Carrusel de fotos con paginacion
- Skeleton loading

### Likes
- Toggle con animacion bounce (Reanimated)
- Contador en tiempo real

### Comentarios
- Lista en tiempo real
- Input fijo en la parte inferior con KeyboardAvoidingView

### Push Notifications
- Notificacion cuando alguien da like o comenta en tu publicacion
- Usa Expo Push Notifications API

### Email
- Despues de publicar, opcion de recibir las fotos por correo
- Template HTML con branding OpenHouse (#00599D)
- Powered by Resend via Convex component

### Administrador
- Usuario `@cicc` tiene privilegios de admin
- Puede eliminar cualquier publicacion o comentario
- Menu contextual con confirmacion

## Admin

El usuario con username `@cicc` es automaticamente administrador. Puede:
- Eliminar cualquier publicacion
- Eliminar cualquier comentario
- Ver menu de acciones en todas las publicaciones y comentarios

## Push Notifications (EAS)

Para que las push notifications funcionen en produccion:

```bash
# Instalar EAS CLI
npm install -g eas-cli

# Configurar proyecto
eas build:configure

# El projectId se obtendra automaticamente
```

## Color Principal

`#00599D` — Se usa en headers, botones primarios, tabs activos, y branding del email.

## Idioma

Toda la interfaz esta en **Espanol**.
