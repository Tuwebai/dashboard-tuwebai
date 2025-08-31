# 🔧 Configuración de Variables de Entorno para MercadoPago

## 📋 Variables Requeridas

### 1. **VITE_MERCADOPAGO_ACCESS_TOKEN** (OBLIGATORIA)
- **Descripción**: Token de acceso para la API de MercadoPago
- **Formato**: String (sin comillas)
- **Ejemplo**: `TEST-1234567890abcdef-1234-5678-90ab-cdef12345678`

### 2. **VITE_MERCADOPAGO_API_URL** (OPCIONAL)
- **Descripción**: URL base de la API de MercadoPago
- **Valor por defecto**: `https://api.mercadopago.com`
- **Solo cambiar si**: Usas un endpoint personalizado

## 🚀 Pasos para Configurar

### **Paso 1: Obtener Token de MercadoPago**

1. Ve a [MercadoPago Developers](https://www.mercadopago.com.ar/developers)
2. Inicia sesión con tu cuenta
3. Ve a **"Tus integraciones"** > **"Credenciales"**
4. Copia el **"Access Token"** (no el Public Key)

### **Paso 2: Configurar en tu archivo .env**

```bash
# MercadoPago Configuration
VITE_MERCADOPAGO_ACCESS_TOKEN=TEST-1234567890abcdef-1234-5678-90ab-cdef12345678
VITE_MERCADOPAGO_API_URL=https://api.mercadopago.com

# Supabase Configuration (ya configurado)
VITE_SUPABASE_URL=tu_url_de_supabase
VITE_SUPABASE_ANON_KEY=tu_clave_anonima_de_supabase
```

### **Paso 3: Reiniciar el Servidor**

```bash
# Detener el servidor (Ctrl+C)
# Volver a ejecutar
npm run dev
```

## 🔍 Verificar Configuración

1. **Abre la página de Facturación**
2. **Verifica el estado de conexión**:
   - ✅ **Conectado**: Verde con "Conectado a MercadoPago"
   - ❌ **Desconectado**: Rojo con mensaje de error

3. **Si está desconectado**:
   - Verifica que el token esté correcto
   - Verifica que no haya espacios extra
   - Verifica que el archivo .env esté en la raíz del proyecto

## 🚨 Solución de Problemas

### **Error: "Token de acceso no configurado"**
- Verifica que `VITE_MERCADOPAGO_ACCESS_TOKEN` esté en tu archivo .env
- Verifica que no haya espacios extra en el valor

### **Error: "No se puede conectar con MercadoPago"**
- Verifica que el token sea válido
- Verifica tu conexión a internet
- Verifica que MercadoPago no esté en mantenimiento

### **Error: "403 Forbidden" en Supabase**
- Ejecuta el script `FIX_PAYMENTS_TABLE.sql` en Supabase
- Verifica que las políticas RLS estén configuradas correctamente

## 📝 Notas Importantes

- **NUNCA** compartas tu Access Token
- **NUNCA** lo subas a GitHub
- El archivo `.env` debe estar en `.gitignore`
- Para producción, usa tokens de producción (no TEST)

## 🔗 Enlaces Útiles

- [Documentación de MercadoPago](https://www.mercadopago.com.ar/developers/es/docs)
- [API de Pagos](https://www.mercadopago.com.ar/developers/es/reference/payments)
- [Webhooks](https://www.mercadopago.com.ar/developers/es/docs/notifications/webhooks)
