# Neuro Espacio - Backend API

API REST para gestión de citas neuropsicológicas con autenticación JWT, sistema de roles y gestión de disponibilidad.

🌐 **Demo**: [https://neuro-espacio.vercel.app/](https://neuro-espacio.vercel.app/)

## 🚀 Tecnologías

- **Node.js & Express** - Framework backend
- **MongoDB & Mongoose** - Base de datos
- **JWT & Bcrypt** - Autenticación y seguridad
- **CORS** - Cross-Origin Resource Sharing

## 🔧 Instalación

```bash
npm install
```

Configura el archivo `.env`:
```env
PORT=5005
MONGODB_URI=<tu-uri-de-mongodb>
TOKEN_SECRET=<tu-clave-secreta-jwt>
ORIGIN=<url-del-frontend>
```

Inicia el servidor:
```bash
npm run dev  # Desarrollo
npm start    # Producción
```

## 📡 API Endpoints

### Autenticación (`/auth`)
- `POST /signup` - Registro de usuario
- `POST /login` - Inicio de sesión
- `GET /verify` - Verificación de token JWT

### Citas (`/api/citas`) 🔒
- `GET /` - Listar citas propias
- `POST /` - Crear nueva cita
- `GET /:id` - Ver detalles de cita
- `PUT /:id` - Editar cita (48h anticipación)
- `DELETE /:id` - Cancelar cita (48h anticipación)

### Admin (`/api/admin`) 🔐
- `GET /stats` - Estadísticas del dashboard
- `GET /users` - Lista de todos los usuarios
- `GET /users/:userId` - Detalle de usuario
- `PUT /users/:userId` - Editar usuario
- `DELETE /users/:userId` - Eliminar usuario
- `GET /citas` - Todas las citas del sistema
- `PUT /citas/:citaId` - Editar cualquier cita
- `DELETE /citas/:citaId` - Eliminar cualquier cita
- `GET /disponibilidad` - Ver disponibilidad de horarios
- `POST /disponibilidad` - Crear disponibilidad
- `PUT /disponibilidad/:id` - Actualizar disponibilidad
- `DELETE /disponibilidad/:id` - Eliminar disponibilidad

## 👤 Roles

**Usuario (USER)**
- Gestionar citas propias
- Editar/cancelar con 48h de anticipación
- Ver calendario de disponibilidad

**Administrador (ADMIN)**
- Gestión completa de usuarios
- Gestión completa de citas sin restricciones
- Configurar disponibilidad de horarios
- Acceso a estadísticas y métricas
- Panel de control administrativo

## 🔒 Autenticación

JWT en header: `Authorization: Bearer <token>`

## 📧 Contacto

[https://neuro-espacio.vercel.app/](https://neuro-espacio.vercel.app/)
