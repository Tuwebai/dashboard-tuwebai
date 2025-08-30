-- Script para probar el acceso a archivos en Supabase Storage
-- Ejecutar en la consola SQL de Supabase

-- 1. Verificar que el bucket 'project-files' existe y está configurado correctamente
SELECT 
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets 
WHERE name = 'project-files';

-- 2. Verificar las políticas del bucket
SELECT 
  bucket_id,
  name,
  definition,
  operation
FROM storage.policies 
WHERE bucket_id = (SELECT id FROM storage.buckets WHERE name = 'project-files');

-- 3. Verificar que hay archivos en el bucket
SELECT 
  name,
  bucket_id,
  owner,
  created_at,
  updated_at,
  last_accessed_at,
  metadata
FROM storage.objects 
WHERE bucket_id = (SELECT id FROM storage.buckets WHERE name = 'project-files')
LIMIT 10;

-- 4. Verificar permisos del usuario actual
SELECT 
  auth.uid() as current_user_id,
  auth.role() as current_user_role;

-- 5. Probar acceso a un archivo específico (reemplazar 'ruta/archivo.jpg' con una ruta real)
-- SELECT 
--   name,
--   bucket_id,
--   metadata
-- FROM storage.objects 
-- WHERE bucket_id = (SELECT id FROM storage.buckets WHERE name = 'project-files')
--   AND name LIKE '%ruta/archivo.jpg%';
