# Configuración de Variables de Entorno en Vercel

## ⚠️ ERROR ACTUAL
```
RangeError: express-jwt: `secret` is a required option
```

Este error ocurre porque falta configurar las variables de entorno en Vercel.

## 🔧 Solución

### 1. Ve al Dashboard de Vercel
https://vercel.com/dashboard

### 2. Selecciona tu proyecto backend
`neuro-espacio-project-backend`

### 3. Ve a Settings → Environment Variables

### 4. Agrega estas variables:

#### TOKEN_SECRET (OBLIGATORIO)
- **Name:** `TOKEN_SECRET`
- **Value:** Una cadena aleatoria larga y segura (ejemplo: `miSuperSecreto123JWT456Ultra789Seguro`)
- **Environments:** Production, Preview, Development

#### MONGODB_URI (OBLIGATORIO)
- **Name:** `MONGODB_URI`
- **Value:** Tu URI de MongoDB Atlas
- **Ejemplo:** `mongodb+srv://usuario:contraseña@cluster.mongodb.net/neuro-espacio?retryWrites=true&w=majority`
- **Environments:** Production, Preview, Development

#### ORIGIN (OPCIONAL - Recomendado)
- **Name:** `ORIGIN`
- **Value:** `https://beatrizdemergelinapsicologa.vercel.app`
- **Environments:** Production

### 5. Redeploy el Proyecto

Después de agregar las variables:
1. Ve a **Deployments**
2. Click en los 3 puntos (...) del último deployment
3. Click en **Redeploy**
4. Espera 1-2 minutos

## ✅ Verificar

Una vez redesplegado, el login debería funcionar sin errores.

Si estás usando el archivo `.env` local, puedes copiarlo desde `.env.example`:
```bash
cp .env.example .env
# Luego edita .env con tus valores reales
```

## 📌 Nota Importante

El archivo `.env` NO se sube a Vercel por seguridad (.gitignore). Por eso debes configurar las variables directamente en el dashboard de Vercel.
