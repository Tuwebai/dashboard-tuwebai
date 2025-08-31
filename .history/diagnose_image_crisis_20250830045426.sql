-- =====================================================
-- DIAGNÓSTICO DE CRISIS: IMÁGENES NO SE CARGAN
-- =====================================================
-- Este script identifica EXACTAMENTE por qué fallan las imágenes

-- 1. VERIFICAR QUE EL ARCHIVO EXISTE FÍSICAMENTE
SELECT 
    'FILE EXISTENCE CHECK' as section,
    id,
    name,
    bucket_id,
    owner,
    created_at,
    updated_at,
    last_accessed_at,
    metadata,
    CASE 
        WHEN name LIKE '%tobacco%' THEN '🎯 TARGET FILE'
        WHEN name LIKE '%onemillion%' THEN '🎯 TARGET FILE'
        ELSE '📁 OTHER FILE'
    END as file_status
FROM storage.objects 
WHERE bucket_id = 'project-files' 
AND (name LIKE '%tobacco%' OR name LIKE '%onemillion%')
ORDER BY name;

-- 2. VERIFICAR CONFIGURACIÓN DEL BUCKET
SELECT 
    'BUCKET CONFIGURATION' as section,
    name as bucket_name,
    public as is_public,
    file_size_limit,
    allowed_mime_types,
    CASE 
        WHEN public = true THEN '✅ PUBLIC'
        ELSE '❌ PRIVATE'
    END as access_status
FROM storage.buckets 
WHERE name = 'project-files';

-- 3. VERIFICAR POLÍTICAS RLS ACTIVAS
SELECT 
    'ACTIVE RLS POLICIES' as section,
    schemaname,
    tablename,
    policyname,
    permissive,
    cmd,
    roles,
    qual,
    with_check,
    CASE 
        WHEN qual IS NOT NULL THEN '✅ ACTIVE'
        ELSE '❌ INACTIVE'
    END as policy_status
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage'
ORDER BY policyname;

-- 4. VERIFICAR PERMISOS DE USUARIO ACTUAL
SELECT 
    'CURRENT USER PERMISSIONS' as section,
    usename,
    usecreatedb,
    usesuper,
    CASE 
        WHEN usesuper = true THEN '🔑 SUPERUSER'
        WHEN usecreatedb = true THEN '🔑 CREATEDB'
        ELSE '👤 REGULAR USER'
    END as user_level
FROM pg_user 
WHERE usename = current_user;

-- 5. VERIFICAR QUE RLS ESTÁ ACTIVADO
SELECT 
    'RLS STATUS' as section,
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    CASE 
        WHEN rowsecurity = true THEN '✅ ENABLED'
        ELSE '❌ DISABLED'
    END as rls_status
FROM pg_tables 
WHERE schemaname = 'storage' AND tablename = 'objects';

-- 6. TEST DE ACCESO DIRECTO A ARCHIVO
SELECT 
    'DIRECT ACCESS TEST' as section,
    COUNT(*) as total_files_in_bucket,
    COUNT(CASE WHEN name LIKE '%tobacco%' THEN 1 END) as tobacco_files,
    COUNT(CASE WHEN name LIKE '%onemillion%' THEN 1 END) as onemillion_files,
    COUNT(CASE WHEN name LIKE '%.jpg%' THEN 1 END) as jpg_files,
    COUNT(CASE WHEN name LIKE '%.png%' THEN 1 END) as png_files,
    COUNT(CASE WHEN name LIKE '%.webp%' THEN 1 END) as webp_files
FROM storage.objects 
WHERE bucket_id = 'project-files';

-- 7. VERIFICAR METADATA DE ARCHIVOS
SELECT 
    'FILE METADATA ANALYSIS' as section,
    name,
    metadata,
    CASE 
        WHEN metadata IS NULL THEN '❌ NO METADATA'
        WHEN metadata = '{}' THEN '⚠️ EMPTY METADATA'
        ELSE '✅ HAS METADATA'
    END as metadata_status
FROM storage.objects 
WHERE bucket_id = 'project-files' 
AND (name LIKE '%tobacco%' OR name LIKE '%onemillion%')
LIMIT 5;

-- 8. VERIFICAR PERMISOS DE STORAGE
SELECT 
    'STORAGE PERMISSIONS' as section,
    grantee,
    privilege_type,
    is_grantable,
    CASE 
        WHEN privilege_type = 'SELECT' THEN '📖 READ'
        WHEN privilege_type = 'INSERT' THEN '📝 WRITE'
        WHEN privilege_type = 'UPDATE' THEN '✏️ MODIFY'
        WHEN privilege_type = 'DELETE' THEN '🗑️ DELETE'
        ELSE '❓ UNKNOWN'
    END as permission_type
FROM information_schema.role_table_grants 
WHERE table_name = 'objects' 
AND table_schema = 'storage'
AND grantee IN ('anon', 'authenticated', 'public')
ORDER BY grantee, privilege_type;

-- =====================================================
-- INSTRUCCIONES DE USO:
-- =====================================================
-- 1. Ejecuta este script en Supabase SQL Editor
-- 2. Comparte TODOS los resultados
-- 3. Especialmente importante: FILE EXISTENCE CHECK
-- 4. Y BUCKET CONFIGURATION
-- =====================================================
