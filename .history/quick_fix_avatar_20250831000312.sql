-- Script rápido para corregir la columna avatar_url
-- Ejecutar en Supabase SQL Editor

-- 1. Agregar la columna avatar_url si no existe
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avatar_url text;

-- 2. Verificar que se agregó
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'public' 
AND column_name = 'avatar_url';

-- 3. Probar la consulta que estaba fallando
SELECT id, full_name, email, avatar_url
FROM public.users
WHERE id = '25bda3f3-3d93-4c9f-a09e-0bd0265dd176';

-- 4. Verificar que funciona para todos los usuarios
SELECT id, email, full_name, avatar_url
FROM public.users
LIMIT 10;
