-- =====================================================
-- VERIFICAR FUNCIÓN DE SUBIDA DE ARCHIVOS
-- =====================================================
-- Este script verifica cómo se están subiendo los archivos

-- 1. VERIFICAR ARCHIVOS EN STORAGE
SELECT 
    'STORAGE FILES' as section,
    id,
    name,
    bucket_id,
    owner,
    created_at,
    updated_at,
    metadata,
    CASE 
        WHEN name LIKE '%.jpg' OR name LIKE '%.jpeg' THEN 'JPEG'
        WHEN name LIKE '%.png' THEN 'PNG'
        WHEN name LIKE '%.webp' THEN 'WEBP'
        WHEN name LIKE '%.gif' THEN 'GIF'
        ELSE 'OTHER'
    END as expected_type,
    CASE 
        WHEN metadata->>'mimetype' LIKE 'image/%' THEN '✅ IMAGE'
        WHEN metadata->>'mimetype' = 'application/json' THEN '❌ JSON'
        ELSE '❓ UNKNOWN'
    END as actual_type
FROM storage.objects 
WHERE bucket_id = 'project-files'
ORDER BY created_at DESC;

-- 2. VERIFICAR METADATA DE ARCHIVOS
SELECT 
    'FILE METADATA' as section,
    name,
    metadata,
    CASE 
        WHEN metadata IS NULL THEN '❌ NO METADATA'
        WHEN metadata = '{}' THEN '⚠️ EMPTY METADATA'
        WHEN metadata->>'mimetype' IS NULL THEN '❌ NO MIMETYPE'
        ELSE '✅ HAS MIMETYPE'
    END as metadata_status
FROM storage.objects 
WHERE bucket_id = 'project-files'
AND (name LIKE '%.jpg' OR name LIKE '%.png' OR name LIKE '%.webp')
ORDER BY created_at DESC;

-- 3. VERIFICAR POLÍTICAS DE SUBIDA
SELECT 
    'UPLOAD POLICIES' as section,
    policyname,
    cmd,
    roles,
    qual,
    with_check,
    CASE 
        WHEN qual IS NOT NULL THEN '✅ ACTIVE'
        ELSE '❌ INACTIVE'
    END as policy_status
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
AND cmd = 'INSERT'
ORDER BY policyname;

-- =====================================================
-- RESULTADO ESPERADO:
-- =====================================================
-- ✅ Archivos con tipo MIME correcto (image/jpeg, image/png)
-- ✅ Metadata completa con mimetype
-- ✅ Políticas de INSERT activas
-- =====================================================
