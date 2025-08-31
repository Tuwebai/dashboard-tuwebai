-- =====================================================
-- OTORGAR PERMISOS DE STORAGE DIRECTAMENTE
-- =====================================================
-- Este script otorga permisos de lectura a usuarios anónimos y autenticados

-- 1. VERIFICAR PERMISOS ACTUALES
SELECT 
    'CURRENT PERMISSIONS' as section,
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.role_table_grants 
WHERE table_name = 'objects' 
AND table_schema = 'storage'
AND grantee IN ('anon', 'authenticated')
ORDER BY grantee, privilege_type;

-- 2. OTORGAR PERMISOS DE LECTURA A ANON
GRANT SELECT ON storage.objects TO anon;

-- 3. OTORGAR PERMISOS DE LECTURA A AUTHENTICATED
GRANT SELECT ON storage.objects TO authenticated;

-- 4. OTORGAR PERMISOS DE ESCRITURA A AUTHENTICATED
GRANT INSERT ON storage.objects TO authenticated;
GRANT UPDATE ON storage.objects TO authenticated;
GRANT DELETE ON storage.objects TO authenticated;

-- 5. VERIFICAR QUE SE OTORGARON LOS PERMISOS
SELECT 
    'PERMISSIONS AFTER GRANT' as section,
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
AND grantee IN ('anon', 'authenticated')
ORDER BY grantee, privilege_type;

-- 6. VERIFICAR QUE LAS POLÍTICAS ESTÁN ACTIVAS
SELECT 
    'POLICY STATUS AFTER PERMISSIONS' as section,
    schemaname,
    tablename,
    policyname,
    cmd,
    CASE 
        WHEN qual IS NOT NULL THEN '✅ ACTIVE'
        ELSE '❌ INACTIVE'
    END as policy_status
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage'
ORDER BY policyname;

-- 7. TEST DE ACCESO DIRECTO
SELECT 
    'ACCESS TEST' as section,
    COUNT(*) as total_files,
    COUNT(CASE WHEN bucket_id = 'project-files' THEN 1 END) as project_files
FROM storage.objects;

-- =====================================================
-- RESULTADO ESPERADO:
-- =====================================================
-- ✅ anon tiene SELECT (lectura)
-- ✅ authenticated tiene SELECT, INSERT, UPDATE, DELETE
-- ✅ Políticas están activas
-- ✅ Imágenes se pueden cargar
-- =====================================================
