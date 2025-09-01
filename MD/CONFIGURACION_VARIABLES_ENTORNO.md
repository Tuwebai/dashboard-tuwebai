# 🔧 CONFIGURACIÓN DE VARIABLES DE ENTORNO

## 📋 **INSTRUCCIONES PARA CONFIGURAR VARIABLES DE ENTORNO**

### **1. CREAR ARCHIVO .env**

Crea un archivo `.env` en la raíz del proyecto con las siguientes variables:

```bash
# Configuración de Supabase
VITE_SUPABASE_URL=https://xebnhwjzchrsbhzbtlsg.supabase.co
VITE_SUPABASE_ANON_KEY=tu_clave_anonima_real_aqui

# Configuración de la aplicación
VITE_APP_NAME=Dashboard TuWebAI
VITE_APP_VERSION=1.0.0
VITE_PUBLIC_URL=http://localhost:8083

# Configuración de desarrollo
VITE_DEV_MODE=true
VITE_DEBUG_MODE=true
```

### **2. OBTENER CLAVE ANÓNIMA DE SUPABASE**

1. Ve a tu proyecto en [Supabase Dashboard](https://supabase.com/dashboard)
2. Navega a **Settings** → **API**
3. Copia la **anon public** key
4. Reemplaza `tu_clave_anonima_real_aqui` con tu clave real

### **3. CONFIGURAR CORS EN SUPABASE**

1. En tu proyecto de Supabase, ve a **Settings** → **API**
2. En la sección **CORS**, agrega:
   - `http://localhost:8083`
   - `https://tu-dominio-de-produccion.com`
   - `*` (solo para desarrollo)

### **4. VERIFICAR CONFIGURACIÓN**

Después de configurar las variables de entorno:

1. Reinicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```

2. Verifica en la consola del navegador que no hay errores de CORS

3. Prueba las funcionalidades que requieren conexión a Supabase

### **5. CONFIGURACIÓN PARA PRODUCCIÓN**

Para producción, configura las variables de entorno en tu plataforma de hosting:

#### **Netlify:**
1. Ve a **Site settings** → **Environment variables**
2. Agrega las variables con el prefijo `VITE_`

#### **Vercel:**
1. Ve a **Settings** → **Environment Variables**
2. Agrega las variables con el prefijo `VITE_`

#### **Otros hosts:**
- Configura las variables de entorno según la documentación de tu proveedor

### **6. SOLUCIÓN DE PROBLEMAS**

#### **Error de CORS:**
- Verifica que la URL esté en la lista de CORS de Supabase
- Asegúrate de que las variables de entorno estén configuradas correctamente

#### **Error de autenticación:**
- Verifica que la clave anónima sea correcta
- Asegúrate de que las políticas RLS estén configuradas en Supabase

#### **Error de conexión:**
- Verifica tu conexión a internet
- Comprueba que el proyecto de Supabase esté activo

### **7. ARCHIVOS IMPORTANTES**

- `.env` - Variables de entorno (NO subir a git)
- `src/config/production.ts` - Configuración de fallback
- `src/lib/supabase.ts` - Cliente de Supabase
- `src/lib/errorHandler.ts` - Manejador de errores

### **8. SEGURIDAD**

⚠️ **IMPORTANTE:**
- Nunca subas el archivo `.env` a git
- Usa claves diferentes para desarrollo y producción
- Rota las claves regularmente
- No compartas las claves en código público

---

## ✅ **VERIFICACIÓN FINAL**

Después de seguir estos pasos, deberías poder:
- ✅ Conectar con Supabase sin errores de CORS
- ✅ Autenticar usuarios correctamente
- ✅ Cargar datos desde la base de datos
- ✅ Ver notificaciones sin errores
- ✅ Usar todas las funcionalidades del dashboard

Si sigues teniendo problemas, revisa la consola del navegador para más detalles del error.
