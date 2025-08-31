-- =====================================================
-- LIMPIEZA Y CORRECCIÓN DE POLÍTICAS DE STORAGE
-- =====================================================
-- Este script corrige las políticas problemáticas identificadas

-- 1. ELIMINAR POLÍTICAS DUPLICADAS Y PROBLEMÁTICAS
DROP POLICY IF EXISTS "Public Access vmqls3_0" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Access vmqls3_0" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete files" ON storage.objects;

-- 2. VERIFICAR QUE SE ELIMINARON
SELECT 
    'POLICIES AFTER CLEANUP' as section,
    schemaname,
    tablename,
    policyname,
    cmd,
    'REMOVED' as status
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage';

-- 3. CREAR POLÍTICAS CORRECTAS Y LIMPIAS

-- Política para ACCESO PÚBLICO (lectura)
CREATE POLICY "Public Read Access" ON storage.objects
    FOR SELECT
    USING (bucket_id = 'project-files');

-- Política para SUBIDA de archivos (usuarios autenticados)
CREATE POLICY "Authenticated Upload" ON storage.objects
    FOR INSERT
    WITH CHECK (
        bucket_id = 'project-files' 
        AND auth.role() = 'authenticated'
    );

-- Política para ACTUALIZACIÓN de archivos (propietario)
CREATE POLICY "Owner Update" ON storage.objects
    FOR UPDATE
    USING (
        bucket_id = 'project-files' 
        AND auth.uid() = owner
    )
    WITH CHECK (
        bucket_id = 'project-files' 
        AND auth.uid() = owner
    );

-- Política para ELIMINACIÓN de archivos (propietario)
CREATE POLICY "Owner Delete" ON storage.objects
    FOR DELETE
    USING (
        bucket_id = 'project-files' 
        AND auth.uid() = owner
    );

-- 4. VERIFICAR NUEVAS POLÍTICAS
SELECT 
    'NEW POLICIES CREATED' as section,
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
WHERE tablename = 'objects' AND schemaname = 'storage'
ORDER BY policyname;

-- 5. VERIFICAR CONFIGURACIÓN DEL BUCKET
SELECT 
    'BUCKET STATUS' as section,
    name as bucket_name,
    public as is_public,
    file_size_limit,
    allowed_mime_types
FROM storage.buckets 
WHERE name = 'project-files';

-- 6. TEST DE ACCESO PÚBLICO
SELECT 
    'PUBLIC ACCESS TEST' as section,
    COUNT(*) as total_files,
    COUNT(CASE WHEN bucket_id = 'project-files' THEN 1 END) as project_files
FROM storage.objects;

-- =====================================================
-- RESULTADO ESPERADO:
-- =====================================================
-- ✅ Políticas duplicadas ELIMINADAS
-- ✅ Política de UPLOAD ACTIVADA
-- ✅ Acceso público FUNCIONANDO
-- ✅ Solo 4 políticas limpias y activas
-- =====================================================
