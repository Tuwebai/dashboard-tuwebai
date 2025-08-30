-- Script de diagnóstico completo para acceso a imágenes en Supabase Storage
-- Ejecutar en el SQL Editor de Supabase

-- 1. Verificar configuración del bucket
SELECT 
  name as bucket_name,
  public as is_public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets 
WHERE name = 'project-files';

-- 2. Verificar políticas RLS del bucket
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage';

-- 3. Verificar archivos en storage.objects
SELECT 
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
ORDER BY created_at DESC
LIMIT 10;

-- 4. Verificar archivos en la tabla project_files
SELECT 
  id,
  name,
  path,
  type,
  size,
  created_at,
  project_id
FROM project_files 
WHERE project_id = 'c3f8c57c-af05-40b9-8dce-c061f178a93a'
ORDER BY created_at DESC
LIMIT 10;

-- 5. Verificar permisos del usuario actual
SELECT 
  current_user,
  session_user,
  current_database(),
  current_schema;

-- 6. Verificar si el bucket tiene políticas SELECT
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
  AND cmd = 'SELECT';

-- 7. Verificar permisos directos en storage.objects
SELECT 
  grantee,
  privilege_type,
  is_grantable
FROM information_schema.role_table_grants 
WHERE table_name = 'objects' 
  AND table_schema = 'storage';

-- 8. Generar URLs de prueba para verificar acceso
SELECT 
  'https://xebnhwjzchrsbhzbtlsg.supabase.co/storage/v1/object/public/project-files/' || 
  pf.path as public_url,
  pf.name,
  pf.path,
  pf.type,
  pf.size
FROM project_files pf
WHERE pf.project_id = 'c3f8c57c-af05-40b9-8dce-c061f178a93a'
  AND pf.name LIKE '%.jpg'
ORDER BY pf.created_at DESC
LIMIT 5;

-- 9. Verificar si hay archivos duplicados o conflictos
SELECT 
  name,
  COUNT(*) as count,
  array_agg(path) as paths
FROM project_files 
WHERE project_id = 'c3f8c57c-af05-40b9-8dce-c061f178a93a'
GROUP BY name
HAVING COUNT(*) > 1;

-- 10. Verificar configuración de RLS en storage.objects
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'objects' 
  AND schemaname = 'storage';
