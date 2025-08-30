-- Script para corregir acceso a Supabase Storage
-- Ejecutar en el SQL Editor de Supabase como superuser

-- 1. Habilitar RLS en storage.objects si no está habilitado
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 2. Eliminar políticas existentes que puedan estar causando conflictos
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view objects" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own folder objects" ON storage.objects;

-- 3. Crear política para acceso público a archivos (para buckets públicos)
CREATE POLICY "Public Access" ON storage.objects
FOR SELECT USING (
  bucket_id IN (
    SELECT id FROM storage.buckets WHERE public = true
  )
);

-- 4. Crear política para usuarios autenticados
CREATE POLICY "Authenticated users can view objects" ON storage.objects
FOR SELECT USING (
  auth.role() = 'authenticated'
);

-- 5. Crear política para usuarios autenticados pueden subir archivos
CREATE POLICY "Authenticated users can insert objects" ON storage.objects
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated'
);

-- 6. Crear política para usuarios autenticados pueden actualizar sus archivos
CREATE POLICY "Users can update own objects" ON storage.objects
FOR UPDATE USING (
  auth.uid()::text = owner
);

-- 7. Crear política para usuarios autenticados pueden eliminar sus archivos
CREATE POLICY "Users can delete own objects" ON storage.objects
FOR DELETE USING (
  auth.uid()::text = owner
);

-- 8. Verificar que el bucket project-files sea público
UPDATE storage.buckets 
SET public = true 
WHERE name = 'project-files';

-- 9. Verificar políticas creadas
SELECT 
  policyname,
  cmd,
  permissive,
  roles,
  qual
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
ORDER BY policyname;

-- 10. Verificar configuración del bucket
SELECT 
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets 
WHERE name = 'project-files';
