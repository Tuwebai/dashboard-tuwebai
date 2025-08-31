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

-- Obtener un user_id real de la tabla users
SELECT 'User IDs disponibles:' as info;
SELECT id, email, full_name FROM public.users LIMIT 5;

-- Insertar una notificación de prueba (usar un user_id real de la consulta anterior)
-- Reemplaza 'USER_ID_AQUI' con un ID real de la consulta anterior
/*
INSERT INTO public.notifications (
    user_id,
    title,
    message,
    type,
    category,
    metadata
) VALUES (
    'USER_ID_AQUI', -- Reemplazar con un user_id real de la consulta anterior
    'Notificación de prueba',
    'Esta es una notificación de prueba para verificar el sistema',
    'info',
    'project',
    '{"project_id": "00000000-0000-0000-0000-000000000000", "project_name": "Proyecto de prueba", "sender_id": "USER_ID_AQUI", "sender_name": "Usuario de prueba"}'::jsonb
);
*/

-- Verificar que se insertó correctamente
SELECT * FROM public.notifications ORDER BY created_at DESC LIMIT 5;
