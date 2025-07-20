# Configuración EmailJS con Solo 2 Templates (Plan Gratuito)

## 🎯 **Configuración Optimizada para Plan Gratuito**

Como EmailJS gratuito solo permite 2 templates, hemos optimizado el sistema para usar:
- **1 Template Principal** para la mayoría de emails
- **1 Template Secundario** para confirmaciones

## 📧 **Configuración de Templates**

### **Template 1: Principal (MAIN_TEMPLATE)**
- **Template ID:** `template_support_ticket`
- **Uso:** Tickets al admin, respuestas, resúmenes diarios
- **Variables disponibles:**
  - `{{to_email}}` - Email del destinatario
  - `{{subject}}` - Asunto del email
  - `{{email_type}}` - Tipo de email (support_ticket, ticket_response, daily_summary)
  - `{{html_content}}` - Contenido HTML completo
  - `{{client_email}}` - Email del cliente
  - `{{ticket_subject}}` - Asunto del ticket
  - `{{ticket_message}}` - Mensaje del ticket
  - `{{ticket_priority}}` - Prioridad del ticket
  - `{{ticket_date}}` - Fecha del ticket

### **Template 2: Secundario (SECONDARY_TEMPLATE)**
- **Template ID:** `template_ticket_confirmation`
- **Uso:** Confirmaciones a clientes
- **Variables disponibles:**
  - `{{to_email}}` - Email del destinatario
  - `{{subject}}` - Asunto del email
  - `{{email_type}}` - Tipo de email (ticket_confirmation)
  - `{{html_content}}` - Contenido HTML completo
  - `{{ticket_id}}` - ID del ticket
  - `{{ticket_subject}}` - Asunto del ticket
  - `{{support_email}}` - Email de soporte

## 🔧 **Configuración en EmailJS**

### **Paso 1: Crear Template Principal**
1. Ve a **"Email Templates"** en EmailJS
2. Haz clic en **"Create New Template"**
3. **Template ID:** `template_support_ticket`
4. **Subject:** `{{subject}}`
5. **Content:** 
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{subject}}</title>
</head>
<body>
    {{html_content}}
</body>
</html>
```

### **Paso 2: Crear Template Secundario**
1. Haz clic en **"Create New Template"**
2. **Template ID:** `template_ticket_confirmation`
3. **Subject:** `{{subject}}`
4. **Content:** 
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{subject}}</title>
</head>
<body>
    {{html_content}}
</body>
</html>
```

## 📋 **Configuración Actualizada**

Tu configuración ya está lista en `src/lib/emailConfig.ts`:

```typescript
export const EMAIL_CONFIG = {
  SERVICE_ID: 'service_flqnerp',
  TEMPLATES: {
    MAIN_TEMPLATE: 'template_support_ticket',
    SECONDARY_TEMPLATE: 'template_ticket_confirmation'
  },
  USER_ID: 'bPdFsDkAPp5dXKALy',
  EMAILS: {
    SUPPORT: 'admin@tuweb-ai.com',
    SYSTEM: 'noreply@tuweb-ai.com'
  }
};
```

## 🚀 **Cómo Funciona**

### **Flujo de Emails:**
1. **Cliente crea ticket** → Template Principal → Admin
2. **Confirmación al cliente** → Template Secundario → Cliente
3. **Admin responde** → Template Principal → Cliente
4. **Resumen diario** → Template Principal → Admin

### **Diferenciación por Tipo:**
- El sistema usa la variable `{{email_type}}` para diferenciar
- Cada tipo de email tiene su propio HTML premium
- El template solo necesita mostrar `{{html_content}}`

## ✅ **Ventajas de esta Configuración**

### **Para Plan Gratuito:**
- ✅ **Solo 2 templates** necesarios
- ✅ **Todos los tipos de email** funcionan
- ✅ **Templates premium** completos
- ✅ **Fácil mantenimiento**

### **Funcionalidades Mantenidas:**
- ✅ Emails al admin con gradiente azul/púrpura
- ✅ Confirmaciones al cliente con gradiente verde
- ✅ Respuestas del admin con gradiente azul
- ✅ Resúmenes diarios con gradiente púrpura

## 🎨 **Templates Premium Incluidos**

Todos los templates premium están en `src/lib/emailTemplates.ts`:
- **SUPPORT_TICKET_ADMIN** - Para admin (azul/púrpura)
- **TICKET_CONFIRMATION_CLIENT** - Para cliente (verde)
- **TICKET_RESPONSE_CLIENT** - Respuestas (azul)
- **DAILY_SUMMARY_ADMIN** - Resúmenes (púrpura)

## 🔄 **Actualización Automática**

El sistema automáticamente:
1. **Genera el HTML premium** según el tipo de email
2. **Usa el template correcto** (principal o secundario)
3. **Envía con todas las variables** necesarias
4. **Maneja errores** y logging

## 📞 **Contacto**

- **Email:** admin@tuweb-ai.com
- **Teléfono:** +5493571416044

---

**¡Listo! Con solo 2 templates tendrás un sistema de emails premium completo! 🎉** 