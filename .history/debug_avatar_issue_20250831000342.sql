-- Script para depurar el problema de la columna avatar
-- Ejecutar en Supabase SQL Editor

-- 1. Verificar la estructura exacta de la tabla users
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    ordinal_position
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Verificar si hay alguna columna llamada 'avatar' (sin _url)
SELECT 
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'public'
AND column_name LIKE '%avatar%';

-- 3. Verificar si hay algún problema con la tabla
SELECT 
    schemaname,
    tablename,
    attname,
    atttypid::regtype as data_type,
    attnotnull as is_not_null,
    attnum
FROM pg_attribute a
JOIN pg_class c ON a.attrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE c.relname = 'users' 
AND n.nspname = 'public'
AND a.attnum > 0
ORDER BY a.attnum;

-- 4. Probar la consulta exacta que está fallando
SELECT id, full_name, email, avatar_url
FROM public.users
WHERE id = '25bda3f3-3d93-4c9f-a09e-0bd0265dd176';

-- 5. Si la consulta falla, verificar el error específico
-- (El error debería aparecer en la consola de Supabase)

-- 6. Verificar si hay algún problema de permisos
SELECT 
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.role_table_grants 
WHERE table_name = 'users' 
AND table_schema = 'public';

-- 7. Verificar si la tabla existe y es accesible
SELECT 
    table_name,
    table_type,
    table_schema
FROM information_schema.tables 
WHERE table_name = 'users' 
AND table_schema = 'public';

-- 8. Verificar si hay algún problema con el esquema
SELECT 
    schema_name,
    schema_owner
FROM information_schema.schemata 
WHERE schema_name = 'public';
