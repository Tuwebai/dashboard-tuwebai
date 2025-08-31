-- Script de prueba para verificar la consulta de avatares
-- Ejecutar en Supabase SQL Editor

-- 1. Verificar que la tabla users existe y tiene la estructura correcta
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Verificar que hay usuarios en la tabla
SELECT COUNT(*) as total_users FROM public.users;

-- 3. Verificar algunos usuarios específicos (reemplazar con IDs reales)
-- Usuario Juan López
SELECT id, email, full_name, avatar_url, role
FROM public.users 
WHERE email = 'juanchilopezpachao7@gmail.com';

-- Usuario TuWebAI AutomatizateAR (reemplazar con el ID real)
SELECT id, email, full_name, avatar_url, role
FROM public.users 
WHERE id = '25bda3f3-3d93-4c9f-a09e-0bd0265dd176';

-- 4. Probar la consulta que está fallando
SELECT id, full_name, email, avatar_url
FROM public.users
WHERE id = '25bda3f3-3d93-4c9f-a09e-0bd0265dd176';

-- 5. Verificar si hay algún problema con la tabla
SELECT 
    schemaname,
    tablename,
    attname,
    atttypid::regtype as data_type,
    attnotnull as is_not_null
FROM pg_attribute a
JOIN pg_class c ON a.attrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE c.relname = 'users' 
AND n.nspname = 'public'
AND a.attnum > 0
ORDER BY a.attnum;

-- 6. Verificar si hay algún problema de permisos
SELECT 
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.role_table_grants 
WHERE table_name = 'users' 
AND table_schema = 'public';
