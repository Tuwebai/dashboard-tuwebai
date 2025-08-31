# 🔧 MIGRACIÓN DE CONFIGURACIÓN DE USUARIOS

## 📋 Descripción

Este archivo contiene la migración necesaria para agregar campos de configuración a la tabla `users` en Supabase, permitiendo que la página de Configuración funcione correctamente.

## 🚀 Cómo Aplicar la Migración

### Opción 1: SQL Editor de Supabase (Recomendado)

1. Ve a tu proyecto de Supabase
2. Navega a **SQL Editor**
3. Crea un nuevo query
4. Copia y pega el contenido de `MIGRACION_CONFIGURACION_USUARIOS.sql`
5. Ejecuta el query

### Opción 2: Supabase CLI

```bash
# Si tienes Supabase CLI instalado
supabase db push --db-url "tu-url-de-supabase"
```

### Opción 3: Migración Manual

Si prefieres hacerlo paso a paso, puedes ejecutar cada sección por separado:

```sql
-- 1. Configuración general
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS language text DEFAULT 'es',
ADD COLUMN IF NOT EXISTS timezone text DEFAULT 'America/Argentina/Buenos_Aires',
ADD COLUMN IF NOT EXISTS date_format text DEFAULT 'DD/MM/YYYY',
ADD COLUMN IF NOT EXISTS time_format text DEFAULT '24h';

-- 2. Privacidad
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS profile_visibility text DEFAULT 'public',
ADD COLUMN IF NOT EXISTS show_email boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS show_phone boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS allow_analytics boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS allow_cookies boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS two_factor_auth boolean DEFAULT false;

-- Y así sucesivamente...
```

## ✅ Campos Agregados

### Configuración General
- `language`: Idioma preferido (es, en, etc.)
- `timezone`: Zona horaria del usuario
- `date_format`: Formato de fecha preferido
- `time_format`: Formato de hora preferido (12h/24h)

### Privacidad
- `profile_visibility`: Visibilidad del perfil (public, private, friends)
- `show_email`: Mostrar email en perfil público
- `show_phone`: Mostrar teléfono en perfil público
- `allow_analytics`: Permitir analytics
- `allow_cookies`: Permitir cookies
- `two_factor_auth`: Autenticación de dos factores

### Notificaciones
- `push_notifications`: Notificaciones push
- `email_notifications`: Notificaciones por email
- `sms_notifications`: Notificaciones por SMS
- `sound_enabled`: Sonidos habilitados
- `vibration_enabled`: Vibración habilitada
- `quiet_hours`: Horas silenciosas
- `quiet_hours_start`: Inicio de horas silenciosas
- `quiet_hours_end`: Fin de horas silenciosas
- `project_updates`: Actualizaciones de proyectos
- `payment_reminders`: Recordatorios de pagos
- `support_updates`: Actualizaciones de soporte
- `marketing_emails`: Emails de marketing

### Rendimiento
- `auto_save`: Guardado automático
- `auto_save_interval`: Intervalo de guardado automático
- `cache_enabled`: Cache habilitado
- `image_quality`: Calidad de imagen
- `animations_enabled`: Animaciones habilitadas
- `low_bandwidth_mode`: Modo de bajo ancho de banda

### Seguridad
- `session_timeout`: Timeout de sesión en minutos
- `max_login_attempts`: Máximo intentos de login
- `require_password_change`: Requerir cambio de contraseña
- `password_expiry_days`: Días de expiración de contraseña
- `login_notifications`: Notificaciones de login
- `device_management`: Gestión de dispositivos

### Perfil Extendido
- `phone`: Teléfono del usuario
- `company`: Empresa del usuario
- `position`: Cargo del usuario
- `bio`: Biografía del usuario
- `location`: Ubicación del usuario
- `website`: Sitio web del usuario
- `last_login`: Último login del usuario

## 🔍 Verificación

Después de aplicar la migración, puedes verificar que los campos se agregaron correctamente:

```sql
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND table_schema = 'public'
  AND column_name IN (
    'language', 'timezone', 'date_format', 'time_format',
    'profile_visibility', 'show_email', 'show_phone',
    'allow_analytics', 'allow_cookies', 'two_factor_auth'
  )
ORDER BY column_name;
```

## ⚠️ Notas Importantes

1. **Backup**: Siempre haz un backup de tu base de datos antes de aplicar migraciones
2. **Testing**: Prueba la migración en un entorno de desarrollo primero
3. **Downtime**: Esta migración no requiere downtime, se ejecuta en vivo
4. **Valores por Defecto**: Todos los campos tienen valores por defecto apropiados
5. **Compatibilidad**: Los campos existentes no se ven afectados

## 🎯 Resultado Esperado

Después de aplicar esta migración:
- ✅ La página de Configuración funcionará correctamente
- ✅ Los usuarios podrán guardar sus preferencias
- ✅ La función `updateUserSettings` funcionará sin errores
- ✅ Todas las configuraciones se guardarán en la base de datos

## 🆘 Solución de Problemas

Si encuentras algún error:

1. **Verifica permisos**: Asegúrate de tener permisos de administrador en Supabase
2. **Revisa logs**: Consulta los logs de Supabase para errores específicos
3. **Rollback**: Si es necesario, puedes revertir los cambios con `DROP COLUMN`

## 📞 Soporte

Si tienes problemas con la migración, consulta:
- Documentación de Supabase
- Foros de la comunidad
- Soporte técnico de TuWebAI
