-- =====================================================
-- MIGRACIÓN: AGREGAR CAMPOS DE CONFIGURACIÓN A USUARIOS
-- =====================================================

-- Agregar campos de configuración general
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS language text DEFAULT 'es',
ADD COLUMN IF NOT EXISTS timezone text DEFAULT 'America/Argentina/Buenos_Aires',
ADD COLUMN IF NOT EXISTS date_format text DEFAULT 'DD/MM/YYYY',
ADD COLUMN IF NOT EXISTS time_format text DEFAULT '24h';

-- Agregar campos de privacidad
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS profile_visibility text DEFAULT 'public',
ADD COLUMN IF NOT EXISTS show_email boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS show_phone boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS allow_analytics boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS allow_cookies boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS two_factor_auth boolean DEFAULT false;

-- Agregar campos de notificaciones
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS push_notifications boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS email_notifications boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS sms_notifications boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS sound_enabled boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS vibration_enabled boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS quiet_hours boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS quiet_hours_start text DEFAULT '22:00',
ADD COLUMN IF NOT EXISTS quiet_hours_end text DEFAULT '08:00',
ADD COLUMN IF NOT EXISTS project_updates boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS payment_reminders boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS support_updates boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS marketing_emails boolean DEFAULT false;

-- Agregar campos de rendimiento
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS auto_save boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS auto_save_interval integer DEFAULT 30,
ADD COLUMN IF NOT EXISTS cache_enabled boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS image_quality text DEFAULT 'high',
ADD COLUMN IF NOT EXISTS animations_enabled boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS low_bandwidth_mode boolean DEFAULT false;

-- Agregar campos de seguridad
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS session_timeout integer DEFAULT 30,
ADD COLUMN IF NOT EXISTS max_login_attempts integer DEFAULT 5,
ADD COLUMN IF NOT EXISTS require_password_change boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS password_expiry_days integer DEFAULT 90,
ADD COLUMN IF NOT EXISTS login_notifications boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS device_management boolean DEFAULT true;

-- Agregar campos adicionales del perfil
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS company text,
ADD COLUMN IF NOT EXISTS position text,
ADD COLUMN IF NOT EXISTS bio text,
ADD COLUMN IF NOT EXISTS location text,
ADD COLUMN IF NOT EXISTS website text,
ADD COLUMN IF NOT EXISTS last_login timestamp with time zone;

-- Crear índices para mejorar el rendimiento de consultas
CREATE INDEX IF NOT EXISTS idx_users_language ON public.users(language);
CREATE INDEX IF NOT EXISTS idx_users_timezone ON public.users(timezone);
CREATE INDEX IF NOT EXISTS idx_users_profile_visibility ON public.users(profile_visibility);

-- Comentarios para documentar los campos
COMMENT ON COLUMN public.users.language IS 'Idioma preferido del usuario';
COMMENT ON COLUMN public.users.timezone IS 'Zona horaria del usuario';
COMMENT ON COLUMN public.users.date_format IS 'Formato de fecha preferido';
COMMENT ON COLUMN public.users.time_format IS 'Formato de hora preferido';
COMMENT ON COLUMN public.users.profile_visibility IS 'Visibilidad del perfil: public, private, friends';
COMMENT ON COLUMN public.users.show_email IS 'Si mostrar el email en el perfil público';
COMMENT ON COLUMN public.users.show_phone IS 'Si mostrar el teléfono en el perfil público';
COMMENT ON COLUMN public.users.allow_analytics IS 'Si permitir analytics del usuario';
COMMENT ON COLUMN public.users.allow_cookies IS 'Si permitir cookies del usuario';
COMMENT ON COLUMN public.users.two_factor_auth IS 'Si la autenticación de dos factores está habilitada';
COMMENT ON COLUMN public.users.push_notifications IS 'Si las notificaciones push están habilitadas';
COMMENT ON COLUMN public.users.email_notifications IS 'Si las notificaciones por email están habilitadas';
COMMENT ON COLUMN public.users.auto_save IS 'Si el guardado automático está habilitado';
COMMENT ON COLUMN public.users.auto_save_interval IS 'Intervalo en segundos para guardado automático';
COMMENT ON COLUMN public.users.session_timeout IS 'Timeout de sesión en minutos';
COMMENT ON COLUMN public.users.max_login_attempts IS 'Máximo número de intentos de login';

-- Verificar que los campos se agregaron correctamente
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
    'allow_analytics', 'allow_cookies', 'two_factor_auth',
    'push_notifications', 'email_notifications', 'auto_save',
    'auto_save_interval', 'session_timeout', 'max_login_attempts'
  )
ORDER BY column_name;
