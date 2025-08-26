-- ===========================================
-- SOLUCIÓN DEFINITIVA PARA VISTA PREVIA DE IMÁGENES
-- ===========================================
-- EJECUTAR ESTE SCRIPT EN EL SQL EDITOR DE SUPABASE

-- 1. VERIFICAR QUE EL BUCKET EXISTE
SELECT * FROM storage.buckets WHERE id = 'project-files';

-- 2. SI NO EXISTE, CREARLO (descomenta la línea siguiente si no existe)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('project-files', 'project-files', true);

-- 3. ELIMINAR TODAS LAS POLÍTICAS EXISTENTES DEL BUCKET project-files
DROP POLICY IF EXISTS "Allow authenticated users to upload files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to download files" ON storage.objects;
DROP POLICY IF EXISTS "Allow public access to download files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete files" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to download files from their projects" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to upload files to their projects" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update files in their projects" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete files from their projects" ON storage.objects;

-- 4. CREAR POLÍTICAS SIMPLIFICADAS Y FUNCIONALES
-- Política para INSERT (subir archivos) - Solo usuarios autenticados
CREATE POLICY "Allow authenticated users to upload files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'project-files');

-- Política para SELECT (descargar/vista previa) - ACCESO PÚBLICO TOTAL
CREATE POLICY "Allow public access to download files"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'project-files');

-- Política para UPDATE (actualizar archivos) - Solo usuarios autenticados
CREATE POLICY "Allow authenticated users to update files"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'project-files')
WITH CHECK (bucket_id = 'project-files');

-- Política para DELETE (eliminar archivos) - Solo usuarios autenticados
CREATE POLICY "Allow authenticated users to delete files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'project-files');

-- 5. VERIFICAR QUE EL BUCKET ESTÁ CONFIGURADO COMO PÚBLICO
UPDATE storage.buckets 
SET public = true 
WHERE id = 'project-files';

-- 6. VERIFICAR LAS POLÍTICAS CREADAS
SELECT
  policyname,
  cmd,
  permissive,
  roles
FROM pg_policies
WHERE tablename = 'objects' AND schemaname = 'storage'
ORDER BY policyname;

-- 7. VERIFICAR LA CONFIGURACIÓN DEL BUCKET
SELECT id, name, public FROM storage.buckets WHERE id = 'project-files';

-- 8. MENSAJE DE CONFIRMACIÓN
SELECT '✅ SOLUCIÓN APLICADA: Políticas de storage corregidas para vista previa pública' as status;
