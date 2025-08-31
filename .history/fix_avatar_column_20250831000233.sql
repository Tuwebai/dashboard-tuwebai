-- Script para verificar y corregir la columna avatar_url en la tabla users
-- Ejecutar en Supabase SQL Editor

-- 1. Verificar la estructura actual de la tabla users
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'users' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Si la columna avatar_url no existe, crearla
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND table_schema = 'public' 
        AND column_name = 'avatar_url'
    ) THEN
        ALTER TABLE public.users ADD COLUMN avatar_url text;
        RAISE NOTICE 'Columna avatar_url agregada a la tabla users';
    ELSE
        RAISE NOTICE 'La columna avatar_url ya existe en la tabla users';
    END IF;
END $$;

-- 3. Verificar que la columna existe
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'users' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. Verificar algunos usuarios de ejemplo
SELECT id, email, full_name, avatar_url, role
FROM public.users
LIMIT 5;

-- 5. Actualizar la vista users_with_roles si es necesario
DROP VIEW IF EXISTS public.users_with_roles;
CREATE OR REPLACE VIEW public.users_with_roles AS
SELECT 
    u.id,
    u.email,
    u.full_name,
    u.role,
    u.created_at,
    u.updated_at,
    u.avatar_url,
    ur.display_name as role_display_name,
    ur.description as role_description,
    ur.permissions as role_permissions
FROM public.users u
LEFT JOIN public.user_roles ur ON u.role = ur.name;

-- 6. Verificar la vista
SELECT * FROM public.users_with_roles LIMIT 5;
