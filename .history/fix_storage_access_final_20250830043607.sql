-- =====================================================
-- SCRIPT FINAL PARA CORREGIR ACCESO A STORAGE
-- =====================================================
-- Este script corrige la configuración de Supabase Storage
-- para permitir acceso público a las imágenes

-- 1. VERIFICAR CONFIGURACIÓN ACTUAL
SELECT 
    'BUCKET CONFIGURATION' as section,
    name as bucket_name,
    public as is_public,
    file_size_limit,
    allowed_mime_types
FROM storage.buckets 
WHERE name = 'project-files';

-- 2. VERIFICAR POLÍTICAS ACTUALES
SELECT 
    'CURRENT POLICIES' as section,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage';

-- 3. VERIFICAR PERMISOS DE USUARIO
SELECT 
    'USER PERMISSIONS' as section,
    usename,
    usecreatedb,
    usesuper
FROM pg_user 
WHERE usename = current_user;

-- 4. CORREGIR CONFIGURACIÓN DEL BUCKET
-- Hacer el bucket público
UPDATE storage.buckets 
SET public = true 
WHERE name = 'project-files';

-- 5. ELIMINAR POLÍTICAS RESTRICTIVAS EXISTENTES
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view objects" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own folder objects" ON storage.objects;

-- 6. CREAR POLÍTICA DE ACCESO PÚBLICO
CREATE POLICY "Public Access" ON storage.objects
    FOR SELECT
    USING (bucket_id = 'project-files');

-- 7. VERIFICAR QUE LA POLÍTICA SE CREÓ
SELECT 
    'NEW POLICY CREATED' as section,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Public Access';

-- 8. VERIFICAR CONFIGURACIÓN FINAL
SELECT 
    'FINAL CONFIGURATION' as section,
    name as bucket_name,
    public as is_public,
    file_size_limit,
    allowed_mime_types
FROM storage.buckets 
WHERE name = 'project-files';

-- 9. TEST DE ACCESO A ARCHIVO ESPECÍFICO
SELECT 
    'FILE ACCESS TEST' as section,
    id,
    name,
    bucket_id,
    owner,
    created_at,
    updated_at,
    last_accessed_at,
    metadata
FROM storage.objects 
WHERE bucket_id = 'project-files' 
AND name LIKE '%onemillion%'
LIMIT 5;

-- 10. VERIFICAR QUE LAS POLÍTICAS ESTÁN ACTIVAS
SELECT 
    'POLICY STATUS' as section,
    schemaname,
    tablename,
    policyname,
    permissive,
    cmd,
    CASE 
        WHEN qual IS NOT NULL THEN 'ACTIVE'
        ELSE 'INACTIVE'
    END as status
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage';

-- =====================================================
-- INSTRUCCIONES DE USO:
-- =====================================================
-- 1. Ejecuta este script en tu base de datos de Supabase
-- 2. Verifica que no haya errores de permisos
-- 3. Reinicia tu aplicación
-- 4. Prueba la vista previa de la imagen
-- =====================================================
