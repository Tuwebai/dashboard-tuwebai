# 🚀 Configuración de MercadoPago para Dashboard TuWebAI

## 📋 Requisitos Previos

- Cuenta de MercadoPago para desarrolladores
- Acceso a la API de MercadoPago
- Token de acceso (Access Token)
- URL de webhook configurada

## 🔑 Configuración de Variables de Entorno

### 1. Crear archivo `.env.local`

```bash
# MercadoPago Configuration
VITE_MERCADOPAGO_ACCESS_TOKEN=your_mercadopago_access_token_here
VITE_MERCADOPAGO_API_URL=https://api.mercadopago.com

# Supabase Configuration (ya configurado)
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### 2. Obtener Access Token de MercadoPago

1. Ve a [MercadoPago Developers](https://www.mercadopago.com.ar/developers)
2. Inicia sesión con tu cuenta
3. Ve a "Tus integraciones" → "Credenciales"
4. Copia el "Access Token" (producción o sandbox)

## 🌐 Configuración de Webhooks

### 1. Configurar URL de Webhook

En tu aplicación de MercadoPago, configura la URL de webhook:

```
https://tu-dominio.com/api/mercadopago/webhook
```

### 2. Eventos a escuchar

- `payment.created`
- `payment.updated`
- `payment.cancelled`
- `payment.rejected`

## 🔧 Implementación en el Dashboard

### 1. Servicio de Sincronización

El dashboard ya incluye:
- ✅ `MercadoPagoSyncService` - Sincronización manual
- ✅ `MercadoPagoWebhookHandler` - Procesamiento de webhooks
- ✅ Componente `PaymentSync` - Interfaz de usuario

### 2. Funcionalidades Implementadas

#### **Sincronización Manual**
- Botón "Sincronizar Pagos" completamente funcional
- Verificación de conexión con MercadoPago
- Estadísticas de sincronización en tiempo real
- Manejo de errores y estados de carga

#### **Sincronización Automática**
- Webhook handler para pagos automáticos
- Creación/actualización automática de pagos
- Mapeo de estados de MercadoPago
- Generación automática de facturas

### 3. Estructura de Datos

#### **Tabla `payments` en Supabase**
```sql
CREATE TABLE payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  userId UUID REFERENCES users(id),
  userEmail TEXT NOT NULL,
  userName TEXT,
  paymentType TEXT,
  amount INTEGER, -- en centavos
  currency TEXT DEFAULT 'ARS',
  status TEXT,
  mercadopagoId TEXT UNIQUE,
  mercadopagoStatus TEXT,
  paymentMethod TEXT,
  installments INTEGER,
  description TEXT,
  features TEXT[],
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  paidAt TIMESTAMP WITH TIME ZONE,
  invoiceUrl TEXT,
  metadata JSONB
);
```

## 🚀 Uso del Sistema

### 1. Sincronización Manual

1. Ve a la página de **Facturación**
2. Verifica el estado de conexión con MercadoPago
3. Haz clic en **"Sincronizar Pagos"**
4. Revisa el resultado y estadísticas

### 2. Sincronización Automática

Los pagos se sincronizan automáticamente cuando:
- Se recibe un webhook de MercadoPago
- El usuario hace clic en "Sincronizar Pagos"
- Se actualiza el estado de un pago existente

## 📊 Monitoreo y Debugging

### 1. Logs de Sincronización

El sistema registra:
- Intentos de sincronización
- Errores y excepciones
- Pagos procesados
- Estados de conexión

### 2. Estadísticas en Tiempo Real

- Total de pagos
- Pagos sincronizados
- Pagos pendientes
- Progreso de sincronización
- Última sincronización

## 🔒 Seguridad

### 1. Verificación de Webhooks

En producción, implementar:
- Verificación de firma HMAC
- Validación de IP de origen
- Rate limiting
- Logging de auditoría

### 2. Manejo de Tokens

- Nunca exponer tokens en el frontend
- Usar variables de entorno
- Rotar tokens regularmente
- Monitorear uso de API

## 🐛 Solución de Problemas

### 1. Error de Conexión

**Síntoma**: Estado "Desconectado"
**Solución**:
- Verificar token de acceso
- Comprobar URL de API
- Revisar permisos de cuenta

### 2. Pagos No Sincronizados

**Síntoma**: Pagos no aparecen en dashboard
**Solución**:
- Verificar webhook configurado
- Revisar logs de error
- Comprobar mapeo de estados

### 3. Errores de API

**Síntoma**: Errores 400/401/403
**Solución**:
- Verificar credenciales
- Comprobar límites de API
- Revisar permisos de cuenta

## 📈 Próximos Pasos

### 1. Mejoras de Producción
- [ ] Implementar verificación de firma HMAC
- [ ] Agregar rate limiting
- [ ] Implementar retry automático
- [ ] Agregar métricas de rendimiento

### 2. Funcionalidades Adicionales
- [ ] Sincronización programada
- [ ] Notificaciones por email
- [ ] Reportes de sincronización
- [ ] Dashboard de administración

## 🚀 Despliegue en Netlify

### 1. Configurar Variables de Entorno

En tu dashboard de Netlify, ve a **Site settings** > **Environment variables** y agrega:

```bash
VITE_MERCADOPAGO_ACCESS_TOKEN=tu_token_aqui
VITE_MERCADOPAGO_API_URL=https://api.mercadopago.com
```

### 2. Verificar Configuración

- Asegúrate de que las variables estén configuradas antes del build
- Las variables con prefijo `VITE_` estarán disponibles en el frontend
- Reinicia el build después de agregar nuevas variables

## 📞 Soporte

Para problemas técnicos:
- Revisar logs del sistema
- Verificar configuración de variables
- Comprobar estado de API de MercadoPago
- Contactar soporte de MercadoPago si es necesario

---

**¡El sistema de sincronización de pagos está completamente implementado y funcional!** 🎉

Solo necesitas configurar las variables de entorno y el webhook para comenzar a usar la sincronización automática.
