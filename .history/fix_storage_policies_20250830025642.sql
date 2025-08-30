-- Script para configurar las políticas de Storage correctamente
-- Ejecutar en la consola SQL de Supabase

-- 1. Habilitar RLS en el bucket si no está habilitado
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 2. Eliminar políticas existentes que puedan estar causando problemas
DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to read" ON storage.objects;
DROP POLICY IF EXISTS "Allow project members to read files" ON storage.objects;

-- 3. Crear política para permitir lectura de archivos a usuarios autenticados
CREATE POLICY "Allow authenticated users to read files" ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = (SELECT id FROM storage.buckets WHERE name = 'project-files'));

-- 4. Crear política para permitir subida de archivos a usuarios autenticados
CREATE POLICY "Allow authenticated users to upload files" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = (SELECT id FROM storage.buckets WHERE name = 'project-files'));

-- 5. Crear política para permitir actualización de archivos propios
CREATE POLICY "Allow users to update own files" ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = (SELECT id FROM storage.buckets WHERE name = 'project-files'))
  WITH CHECK (bucket_id = (SELECT id FROM storage.buckets WHERE name = 'project-files'));

-- 6. Crear política para permitir eliminación de archivos propios
CREATE POLICY "Allow users to delete own files" ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = (SELECT id FROM storage.buckets WHERE name = 'project-files'));

-- 7. Verificar que las políticas se crearon correctamente
SELECT 
  bucket_id,
  name,
  definition,
  operation
FROM storage.policies 
WHERE bucket_id = (SELECT id FROM storage.buckets WHERE name = 'project-files')
ORDER BY operation;

-- 8. Verificar que el bucket está configurado como público para lectura
UPDATE storage.buckets 
SET public = true 
WHERE name = 'project-files';

-- 9. Verificar la configuración final del bucket
SELECT 
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets 
WHERE name = 'project-files';
