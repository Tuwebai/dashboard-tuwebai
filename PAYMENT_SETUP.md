# 🏦 Sistema de Pagos - Configuración Completa

## 📋 **Configuración de Mercado Pago**

### **1. Crear cuenta en Mercado Pago**
1. Ve a [mercadopago.com](https://mercadopago.com)
2. Crea una cuenta de desarrollador
3. Accede al [Panel de Desarrolladores](https://www.mercadopago.com.ar/developers)

### **2. Obtener credenciales**
1. Ve a "Tus integraciones" > "Credenciales"
2. Copia tu **Public Key** y **Access Token**
3. Para pruebas usa las credenciales de **TEST**

### **3. Configurar variables de entorno**
Crea un archivo `.env.local` en la raíz del proyecto:

```env
# Mercado Pago Configuration
VITE_MERCADOPAGO_PUBLIC_KEY=TEST-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
VITE_MERCADOPAGO_ACCESS_TOKEN=TEST-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# API Configuration
VITE_API_URL=https://tuweb-ai.com/api
VITE_WEBHOOK_URL=https://tuweb-ai.com/api/webhooks/mercadopago

# Dashboard Configuration
VITE_DASHBOARD_URL=https://dashboard.tuweb-ai.com
VITE_MAIN_SITE_URL=https://tuweb-ai.com
```

## 🔗 **Integración con tuweb-ai.com**

### **1. Configurar webhook en Mercado Pago**
1. Ve a "Tus integraciones" > "Notificaciones"
2. Agrega la URL: `https://tuweb-ai.com/api/webhooks/mercadopago`
3. Selecciona eventos: `payment.created`, `payment.updated`

### **2. Configurar en tuweb-ai.com**
Agrega este código en tu página principal:

```javascript
// En tuweb-ai.com - después del login exitoso
function redirectToDashboard() {
  const user = getCurrentUser(); // Tu función de usuario
  if (user) {
    // Redirigir al dashboard con token
    const dashboardUrl = `https://dashboard.tuweb-ai.com?token=${user.token}`;
    window.location.href = dashboardUrl;
  }
}

// En el avatar/menú de usuario
function showUserMenu() {
  return `
    <div class="user-menu">
      <div class="user-info">
        <img src="${user.avatar}" alt="${user.name}" />
        <span>${user.name}</span>
      </div>
      <div class="menu-options">
        <a href="/perfil">Mi Perfil</a>
        <a href="/proyectos">Mis Proyectos</a>
        <a href="https://dashboard.tuweb-ai.com" target="_blank">
          🎛️ Panel de Control
        </a>
        <a href="/logout">Cerrar Sesión</a>
      </div>
    </div>
  `;
}
```

### **3. API para sincronización**
Crea un endpoint en tuweb-ai.com:

```php
// api/payments/{email}.php
<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: https://dashboard.tuweb-ai.com');

$email = $_GET['email'];
$apiKey = $_SERVER['HTTP_AUTHORIZATION'];

// Validar API key
if ($apiKey !== 'Bearer ' . $_ENV['API_KEY']) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

// Obtener pagos de la base de datos
$payments = getPaymentsByEmail($email);

echo json_encode($payments);
?>
```

## 🚀 **Funcionalidades Implementadas**

### **✅ Sistema Completo de Pagos**
- ✅ **Integración Mercado Pago** completa
- ✅ **Webhooks** para notificaciones en tiempo real
- ✅ **Sincronización** con tuweb-ai.com
- ✅ **Historial** de pagos completo
- ✅ **Facturas** automáticas
- ✅ **Estados** de pago en tiempo real

### **✅ Tipos de Pago Disponibles**
1. **Sitio Web** - $999.00 ARS
2. **E-commerce** - $1,999.00 ARS  
3. **Personalizado** - $2,999.00 ARS

### **✅ Características Incluidas**
- ✅ **Diseño responsive** para todos los dispositivos
- ✅ **Notificaciones** en tiempo real
- ✅ **Descarga** de facturas
- ✅ **Sincronización** automática
- ✅ **Panel de administración** para ver todos los pagos

## 🔧 **Configuración del Dashboard**

### **1. Actualizar configuración**
En `src/lib/mercadopago.ts`:

```typescript
export const MERCADOPAGO_CONFIG = {
  PUBLIC_KEY: import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY,
  ACCESS_TOKEN: import.meta.env.VITE_MERCADOPAGO_ACCESS_TOKEN,
  WEBHOOK_URL: import.meta.env.VITE_WEBHOOK_URL,
  SUCCESS_URL: `${import.meta.env.VITE_DASHBOARD_URL}/facturacion?status=success`,
  PENDING_URL: `${import.meta.env.VITE_DASHBOARD_URL}/facturacion?status=pending`,
  FAILURE_URL: `${import.meta.env.VITE_DASHBOARD_URL}/facturacion?status=failure`,
};
```

### **2. Configurar Firestore**
Asegúrate de que las reglas de Firestore permitan acceso a la colección `payments`:

```javascript
// firestore.rules
match /payments/{paymentId} {
  allow read, write: if request.auth != null;
}
```

## 📱 **Flujo de Usuario**

### **1. Desde tuweb-ai.com**
1. Usuario se registra/inicia sesión
2. Ve el botón "Panel de Control" en su avatar
3. Hace clic y es redirigido al dashboard
4. Puede ver su historial de pagos sincronizado

### **2. Desde el Dashboard**
1. Usuario accede a "Facturación y Pagos"
2. Ve botón "Sincronizar Pagos" para conectar con tuweb-ai.com
3. Puede crear nuevos pagos directamente
4. Ve historial completo y descarga facturas

### **3. Proceso de Pago**
1. Usuario selecciona tipo de servicio
2. Es redirigido a Mercado Pago
3. Completa el pago
4. Webhook actualiza el estado en tiempo real
5. Factura se genera automáticamente

## 🛠️ **Mantenimiento**

### **Verificar webhooks**
```bash
# Verificar logs de webhooks
firebase functions:log --only webhookHandler
```

### **Sincronizar pagos manualmente**
En el dashboard, usar el botón "Sincronizar Pagos" en la página de facturación.

### **Monitorear pagos**
En el panel de administración, sección "Pagos" para ver todos los pagos del sistema.

## 🔒 **Seguridad**

- ✅ **Autenticación** requerida para todos los endpoints
- ✅ **Validación** de webhooks de Mercado Pago
- ✅ **API keys** para sincronización entre sitios
- ✅ **HTTPS** obligatorio para producción
- ✅ **Rate limiting** en webhooks

## 📞 **Soporte**

Si tienes problemas con la configuración:

1. Verifica las credenciales de Mercado Pago
2. Revisa los logs de Firestore
3. Confirma que los webhooks estén configurados
4. Verifica las variables de entorno

¡El sistema está listo para producción! 🎉 