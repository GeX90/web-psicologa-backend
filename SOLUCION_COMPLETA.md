# 🔧 SOLUCIÓN COMPLETA - Error CORS y Backend

## 📊 ESTADO ACTUAL

### ✅ Backend - Código CORRECTO
- ✅ Configuración de CORS implementada correctamente
- ✅ Manejo de peticiones OPTIONS (preflight)
- ✅ Sin errores de sintaxis
- ✅ Código desplegado en Git

### ✅ Frontend - Código CORRECTO
- ✅ `withCredentials: true` en todas las peticiones axios
- ✅ Manejo de errores con optional chaining (`error.response?.data`)
- ✅ Sin errores de sintaxis
- ✅ Código desplegado en Git

### ❌ Vercel Backend - FALTAN VARIABLES DE ENTORNO
**Este es el problema principal que causa todos los errores**

---

## 🎯 PROBLEMA RAÍZ

El backend en Vercel está fallando con:
```
RangeError: express-jwt: `secret` is a required option
Node.js process exited with exit status: 1
```

Esto causa que:
1. ❌ El servidor no inicie correctamente
2. ❌ Las peticiones fallen con `ERR_FAILED`
3. ❌ Los headers CORS no se envíen (porque el código ni siquiera se ejecuta)
4. ❌ El login y signup no funcionen

---

## 🔑 SOLUCIÓN: Configurar Variables de Entorno en Vercel

### Paso 1: Accede a Vercel Dashboard
1. Ve a: **https://vercel.com/dashboard**
2. Busca tu proyecto: **`neuro-espacio-project-backend`**
3. Haz clic en el proyecto

### Paso 2: Configurar Variables de Entorno

1. En el menú lateral, haz clic en **⚙️ Settings**
2. Luego haz clic en **Environment Variables** (en el menú izquierdo)
3. Agrega las siguientes **3 variables**:

---

#### Variable 1: TOKEN_SECRET ⭐ OBLIGATORIA

```
Name:         TOKEN_SECRET
Value:        tu-secreto-jwt-super-seguro-123456789
Environments: ✓ Production  ✓ Preview  ✓ Development
```

**¿Qué valor poner?**
- Una cadena aleatoria y larga (mínimo 32 caracteres)
- Ejemplo: `miSuperSecretoJWT2025Ultra!Seguro#999`
- O genera uno aleatorio: https://randomkeygen.com/ (usa "CodeIgniter Encryption Keys")

---

#### Variable 2: MONGODB_URI ⭐ OBLIGATORIA

```
Name:         MONGODB_URI
Value:        mongodb+srv://usuario:password@cluster.mongodb.net/neuro-espacio?retryWrites=true&w=majority
Environments: ✓ Production  ✓ Preview  ✓ Development
```

**¿Cómo obtener tu URI?**
1. Ve a https://cloud.mongodb.com/
2. Selecciona tu cluster
3. Click en "Connect" → "Connect your application"
4. Copia la URI y reemplaza `<password>` con tu contraseña real

---

#### Variable 3: ORIGIN ⚠️ RECOMENDADA

```
Name:         ORIGIN
Value:        https://beatrizdemergelinapsicologa.vercel.app
Environments: ✓ Production
```

**¿Para qué sirve?**
- Define el origen permitido para CORS
- Ayuda a que el backend sepa de dónde vienen las peticiones legítimas

---

### Paso 3: Guardar y Redeploy

1. Después de agregar las 3 variables, haz clic en **Save**
2. Ve a la pestaña **Deployments** (arriba)
3. Encuentra el último deployment
4. Haz clic en los **3 puntos (...)** a la derecha
5. Selecciona **Redeploy**
6. Confirma haciendo clic en **Redeploy** nuevamente

---

### Paso 4: Esperar el Redespliegue (1-2 minutos)

Verás un indicador de progreso. Espera a que aparezca:
- ✅ **Ready** (con check verde) = ¡Éxito!
- ❌ **Failed** = Revisa los logs

---

### Paso 5: Limpiar Caché del Navegador

**MUY IMPORTANTE antes de probar:**

1. Abre tu navegador
2. Presiona `Ctrl + Shift + Delete` (Windows) o `Cmd + Shift + Delete` (Mac)
3. Selecciona:
   - ✅ Cookies y otros datos de sitios
   - ✅ Archivos e imágenes almacenados en caché
4. Haz clic en **Borrar datos**

---

### Paso 6: Probar el Login/Signup

1. Ve a: https://beatrizdemergelinapsicologa.vercel.app
2. Intenta **crear una cuenta nueva** o **iniciar sesión**
3. **Debería funcionar sin errores** ✅

---

## 🔍 VERIFICAR QUE FUNCIONÓ

### Logs de Vercel (para confirmar)

1. En Vercel Dashboard → Tu proyecto backend
2. Ve a **Logs** (pestaña superior)
3. Selecciona **Runtime Logs**
4. Deberías ver logs como:

```
✓ Conexión inicial a MongoDB exitosa
Request from origin: https://beatrizdemergelinapsicologa.vercel.app
Request method: POST
Request path: /auth/login
```

**NO deberías ver:**
```
❌ RangeError: express-jwt: `secret` is a required option
❌ FUNCTION_INVOCATION_FAILED
```

---

## 📋 CHECKLIST COMPLETO

Marca cada paso conforme lo completes:

- [ ] Acceder a Vercel Dashboard
- [ ] Ir a Settings → Environment Variables
- [ ] Agregar variable `TOKEN_SECRET`
- [ ] Agregar variable `MONGODB_URI`
- [ ] Agregar variable `ORIGIN`
- [ ] Guardar las variables
- [ ] Ir a Deployments
- [ ] Redeploy el último deployment
- [ ] Esperar a que aparezca "Ready" ✅
- [ ] Limpiar caché del navegador
- [ ] Probar login en https://beatrizdemergelinapsicologa.vercel.app
- [ ] ✅ **¡FUNCIONA!**

---

## ❓ SI AÚN NO FUNCIONA

### Error: "User not found" o "Invalid credentials"
- ✅ Esto es BUENO - significa que el backend YA está funcionando
- Solución: Crea una nueva cuenta con el formulario de Registro

### Error: Sigue apareciendo CORS
1. Verifica que las variables estén bien guardadas en Vercel
2. Asegúrate de haber hecho Redeploy
3. Espera 2-3 minutos (a veces Vercel tarda)
4. Limpia la caché del navegador de nuevo
5. Revisa los Runtime Logs en Vercel

### Error: FUNCTION_INVOCATION_FAILED
- ❌ Significa que las variables NO están configuradas correctamente
- Revisa que `TOKEN_SECRET` y `MONGODB_URI` estén bien escritas
- Asegúrate de que `MONGODB_URI` tiene tu contraseña correcta
- Haz Redeploy de nuevo

---

## 📞 COMANDOS ÚTILES (Opcional)

### Verificar variables localmente
```bash
cd c:\Users\epicv\documents\ironhack2025\web-psicología\web-psicología-backend
cat .env.example
```

### Ver logs del backend en Vercel
https://vercel.com/dashboard → Proyecto → Logs → Runtime Logs

---

## ✅ RESUMEN

**El código está 100% correcto.** Solo falta configurar las variables de entorno en Vercel.

Una vez hagas eso, todo funcionará perfectamente.

**Tiempo estimado:** 5-10 minutos
