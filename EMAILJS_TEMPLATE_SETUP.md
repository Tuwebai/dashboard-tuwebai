# Configuración del Template de EmailJS - Variables Individuales

## 🎯 **Problema Solucionado**

**❌ Antes:** Se enviaba HTML completo con `${data.client_email}` sin procesar
**✅ Ahora:** Se envían variables individuales que EmailJS puede procesar

## 📧 **Configuración del Template en EmailJS**

### **Paso 1: Editar tu Template Principal**
1. Ve a **"Email Templates"** en EmailJS
2. Edita el template `template_support_ticket`
3. Usa las siguientes variables directamente:

### **Variables Disponibles en el Template:**
```html
<!-- Variables principales -->
{{from_email}} - Email que ENVÍA
{{to_email}} - Email que RECIBE
{{subject}} - Asunto del email
{{email_type}} - Tipo de email

<!-- Variables del ticket -->
{{ticket_subject}} - Asunto del ticket
{{ticket_message}} - Mensaje del ticket
{{client_email}} - Email del cliente
{{ticket_priority}} - Prioridad del ticket
{{ticket_date}} - Fecha del ticket
{{ticket_id}} - ID del ticket
{{support_email}} - Email de soporte
{{priority_color}} - Color de prioridad

<!-- Variables para respuestas -->
{{admin_response}} - Respuesta del admin
{{admin_name}} - Nombre del admin
{{response_date}} - Fecha de respuesta

<!-- Variables para resumen -->
{{total_tickets}} - Total de tickets
{{new_tickets}} - Tickets nuevos
{{resolved_tickets}} - Tickets resueltos
{{pending_tickets}} - Tickets pendientes
{{date}} - Fecha del resumen
```

### **Paso 2: Ejemplo de Template HTML**
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{subject}}</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background: #f8fafc; }
        .container { max-width: 600px; margin: 0 auto; background: white; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 300; }
        .header p { color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px; }
        .content { padding: 40px 30px; }
        .card { background: #f8f9fa; border-radius: 12px; padding: 25px; margin: 20px 0; border-left: 4px solid {{priority_color}}; }
        .field { margin-bottom: 20px; }
        .field-label { font-weight: 600; color: #374151; margin-bottom: 5px; font-size: 14px; }
        .field-value { color: #6b7280; line-height: 1.6; }
        .priority-badge { display: inline-block; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; background: {{priority_color}}; color: white; }
        .message-box { background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-top: 10px; }
        .footer { background: #1f2937; color: white; padding: 30px; text-align: center; }
        .logo { font-size: 24px; font-weight: bold; color: #667eea; }
        .action-btn { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; font-weight: 500; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎫 Nuevo Ticket de Soporte</h1>
            <p>Se ha creado un nuevo ticket que requiere tu atención</p>
        </div>
        
        <div class="content">
            <div class="card">
                <div class="field">
                    <div class="field-label">📧 Cliente</div>
                    <div class="field-value">{{client_email}}</div>
                </div>
                
                <div class="field">
                    <div class="field-label">📝 Asunto</div>
                    <div class="field-value">{{ticket_subject}}</div>
                </div>
                
                <div class="field">
                    <div class="field-label">💬 Mensaje</div>
                    <div class="message-box">{{ticket_message}}</div>
                </div>
                
                <div class="field">
                    <div class="field-label">⚡ Prioridad</div>
                    <div class="field-value">
                        <span class="priority-badge">{{ticket_priority}}</span>
                    </div>
                </div>
                
                <div class="field">
                    <div class="field-label">📅 Fecha de Creación</div>
                    <div class="field-value">{{ticket_date}}</div>
                </div>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
                <a href="https://tuweb-ai.com/admin/support" class="action-btn">Ver en Panel de Admin</a>
            </div>
        </div>
        
        <div class="footer">
            <div class="logo">TuWebAI</div>
            <p>Sistema de Soporte Técnico</p>
            <p style="font-size: 12px; opacity: 0.8;">Este es un email automático del sistema de soporte</p>
        </div>
    </div>
</body>
</html>
```

## 🔄 **Flujo de Variables**

### **1. Cliente crea ticket:**
- `{{from_email}}` = email del cliente
- `{{to_email}}` = admin@tuweb-ai.com
- `{{ticket_subject}}` = asunto del ticket
- `{{ticket_message}}` = mensaje del ticket
- `{{client_email}}` = email del cliente
- `{{ticket_priority}}` = prioridad (ALTA, MEDIA, BAJA)
- `{{ticket_date}}` = fecha formateada
- `{{priority_color}}` = color según prioridad

### **2. Confirmación al cliente:**
- `{{from_email}}` = tuwebai@gmail.com
- `{{to_email}}` = email del cliente
- `{{ticket_id}}` = ID del ticket
- `{{ticket_subject}}` = asunto del ticket
- `{{support_email}}` = admin@tuweb-ai.com

## ✅ **Configuración Actualizada**

Tu configuración en `src/lib/emailConfig.ts`:
```typescript
export const EMAIL_CONFIG = {
  SERVICE_ID: 'service_flqnerp',
  TEMPLATES: {
    MAIN_TEMPLATE: 'template_support_ticket',
    SECONDARY_TEMPLATE: 'template_ticket_confirmation'
  },
  USER_ID: 'bPdFsDkAPp5dXKALy',
  EMAILS: {
    SUPPORT: 'admin@tuweb-ai.com',     // ← RECIBE los tickets
    FROM_EMAIL: 'tuwebai@gmail.com',   // ← ENVÍA confirmaciones y respuestas
    SYSTEM: 'noreply@tuweb-ai.com'
  }
};
```

## 🧪 **Cómo Probar**

1. **Actualiza tu template** en EmailJS con el HTML de arriba
2. **Ve a la página de Soporte** (`/soporte`)
3. **Usa el botón "Probar Sistema de Emails"**
4. **Verifica que las variables se reemplacen correctamente**

## 📋 **Verificación**

### **Para verificar que funciona:**
- ✅ Las variables `{{client_email}}` se reemplazan con el email real
- ✅ Las variables `{{ticket_subject}}` se reemplazan con el asunto real
- ✅ Las variables `{{ticket_message}}` se reemplazan con el mensaje real
- ✅ No aparecen caracteres `${data.xxx}` en el email

---

**¡Ahora las variables se procesarán correctamente en EmailJS!** 🎉 