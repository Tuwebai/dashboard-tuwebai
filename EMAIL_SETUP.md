# Configuración de EmailJS para Tickets de Soporte - Plan Gratuito

## 📧 Configuración con Plan Gratuito (2 Templates)

**¡Perfecto!** Con el plan gratuito de EmailJS puedes tener hasta 2 templates. Te explico cómo configurarlo de manera eficiente:

### 1. Crear cuenta en EmailJS
1. Ve a [emailjs.com](https://www.emailjs.com/)
2. Haz clic en "Sign Up" y crea tu cuenta
3. Verifica tu email

### 2. Configurar Email Service
1. En el dashboard de EmailJS, ve a **"Email Services"**
2. Haz clic en **"Add New Service"**
3. Selecciona tu proveedor de email (Gmail, Outlook, etc.)
4. Conecta tu cuenta de email
5. **Copia el Service ID** (ej: `service_abc123`)

### 3. Obtener User ID
1. En el dashboard, ve a **"Account"** → **"API Keys"**
2. **Copia tu "Public Key"** (es tu User ID)
3. Se ve algo como: `user_abc123def456`

### 4. Crear 2 Templates Eficientes

#### **Template 1: Template Principal (Para todo)**
- **Template ID:** `template_support_ticket`
- **Subject:** `{{subject}}`
- **Content:** Usar el template unificado de `unifiedEmailTemplate.ts`

#### **Template 2: Template Secundario (Opcional)**
- **Template ID:** `template_ticket_confirmation`
- **Subject:** `{{subject}}`
- **Content:** Puedes usar el mismo template o uno simplificado

### 5. Actualizar Configuración
Edita el archivo `src/lib/emailConfig.ts`:

```typescript
export const EMAIL_CONFIG = {
  SERVICE_ID: 'tu_service_id_aqui', // ← Tu Service ID real
  TEMPLATES: {
    MAIN_TEMPLATE: 'template_support_ticket', // ← Tu template principal
    SECONDARY_TEMPLATE: 'template_ticket_confirmation' // ← Tu segundo template (opcional)
  },
  USER_ID: 'tu_user_id_aqui', // ← Tu User ID real
  EMAILS: {
    SUPPORT: 'admin@tuweb-ai.com',
    SYSTEM: 'noreply@tuweb-ai.com'
  }
};
```

## 🎯 Estrategia con 2 Templates

### **Opción 1: Un Solo Template (Recomendado)**
- Usar **1 template** para todos los tipos de emails
- Diferenciar con variables: `email_type`, `header_title`, etc.
- Más simple y eficiente

### **Opción 2: Dos Templates Especializados**
- **Template 1:** Para admin (nuevo ticket + resumen)
- **Template 2:** Para cliente (confirmación + respuesta)

## 🚀 Funcionalidades Implementadas

### ✅ Envío Automático con 2 Templates
- **Al Admin:** Nuevo ticket de soporte
- **Al Cliente:** Confirmación de recepción
- **Respuestas:** Respuesta del admin al cliente
- **Resúmenes:** Resumen diario (usando template principal)

### ✅ Templates Premium Adaptados
- **Diseño profesional** con gradientes
- **Responsive** para todos los dispositivos
- **Variables dinámicas** para personalización
- **Compatibilidad** con plan gratuito

## 📋 Flujo Optimizado

1. **Cliente crea ticket** → Email al admin (template principal)
2. **Confirmación al cliente** → Email al cliente (template principal)
3. **Admin responde** → Email de respuesta (template principal)
4. **Resumen diario** → Email al admin (template principal)

## 🎨 Características Premium Mantenidas

### ✨ Diseño Profesional
- **Gradientes modernos** en headers
- **Tipografía elegante** (Segoe UI)
- **Colores corporativos** consistentes
- **Espaciado profesional** y responsive

### 🎯 Funcionalidades Avanzadas
- **Badges de prioridad** con colores
- **Iconos descriptivos** para cada sección
- **Información estructurada** y fácil de leer
- **Botones de acción** integrados

## 🔧 Configuración Alternativa

Si quieres usar ambos templates:

### Template 1: Para Admin
```html
<!-- Template para admin con gradiente azul/púrpura -->
<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
  <h1>🎫 Nuevo Ticket de Soporte</h1>
  <!-- Contenido para admin -->
</div>
```

### Template 2: Para Cliente
```html
<!-- Template para cliente con gradiente verde -->
<div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%);">
  <h1>✅ Ticket Recibido</h1>
  <!-- Contenido para cliente -->
</div>
```

## 📞 Contacto de Soporte

- **Email:** admin@tuweb-ai.com
- **Teléfono:** +5493571416044
- **Horarios:** Lunes a Viernes 9:00 - 18:00

## 🎯 Ventajas del Plan Gratuito

### ✅ Funcionalidad Completa
- Envío de emails automático
- Templates premium
- Manejo de errores
- Logging detallado

### ✅ Optimización
- Un solo template para todo
- Menos configuración
- Más fácil de mantener
- Funciona perfectamente

---

**Nota:** Con solo 2 templates puedes tener un sistema de emails completamente funcional y profesional. ¡El plan gratuito es suficiente para la mayoría de casos de uso! 