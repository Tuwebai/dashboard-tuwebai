-- Script para verificar la tabla de notificaciones
-- Ejecutar en Supabase SQL Editor

-- Verificar que la tabla existe
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'notifications' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verificar las políticas de notificaciones
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE schemaname = 'public' 
    AND tablename = 'notifications'
ORDER BY policyname;

-- Insertar una notificación de prueba
INSERT INTO public.notifications (
    user_id,
    title,
    message,
    type,
    project_id,
    read
) VALUES (
    '00000000-0000-0000-0000-000000000000', -- Reemplazar con un user_id real
    'Notificación de prueba',
    'Esta es una notificación de prueba para verificar el sistema',
    'message',
    '00000000-0000-0000-0000-000000000000', -- Reemplazar con un project_id real
    false
);

-- Verificar que se insertó correctamente
SELECT * FROM public.notifications ORDER BY created_at DESC LIMIT 5;
