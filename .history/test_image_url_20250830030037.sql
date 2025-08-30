-- Script para probar la generación de URLs de imágenes
-- Ejecutar en la consola SQL de Supabase

-- 1. Verificar que el archivo existe en la base de datos
SELECT 
  id,
  name,
  path,
  type,
  mime_type,
  size,
  created_at
FROM project_files 
WHERE name LIKE '%LOGO%' OR name LIKE '%jpg%' OR name LIKE '%png%'
ORDER BY created_at DESC
LIMIT 5;

-- 2. Verificar que el archivo existe en Storage
SELECT 
  name,
  bucket_id,
  owner,
  size,
  created_at
FROM storage.objects 
WHERE bucket_id = (SELECT id FROM storage.buckets WHERE name = 'project-files')
  AND (name LIKE '%LOGO%' OR name LIKE '%jpg%' OR name LIKE '%png%')
ORDER BY created_at DESC
LIMIT 5;

-- 3. Verificar la configuración del bucket
SELECT 
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets 
WHERE name = 'project-files';

-- 4. Verificar las políticas de SELECT
SELECT 
  name,
  operation,
  definition,
  target_roles
FROM storage.policies 
WHERE bucket_id = (SELECT id FROM storage.buckets WHERE name = 'project-files')
  AND operation = 'SELECT';

-- 5. Generar URL de ejemplo (reemplazar 'ruta/archivo.jpg' con una ruta real)
-- SELECT 
--   CONCAT(
--     'https://xebnhwjzchrsbhzbtlsg.supabase.co/storage/v1/object/public/project-files/',
--     name
--   ) as public_url,
--   name as file_name,
--   size
-- FROM storage.objects 
-- WHERE bucket_id = (SELECT id FROM storage.buckets WHERE name = 'project-files')
--   AND (name LIKE '%LOGO%' OR name LIKE '%jpg%' OR name LIKE '%png%')
-- LIMIT 3;
