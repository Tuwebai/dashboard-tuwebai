-- Script para probar acceso directo a imágenes en Supabase Storage
-- Ejecutar en el SQL Editor de Supabase

-- 1. Verificar que el archivo existe en storage.objects
SELECT 
  id,
  name,
  bucket_id,
  owner,
  created_at,
  updated_at,
  metadata
FROM storage.objects 
WHERE name LIKE '%unnamed%' 
  AND bucket_id = 'project-files'
ORDER BY created_at DESC;

-- 2. Verificar que el archivo existe en project_files
SELECT 
  id,
  name,
  path,
  type,
  size,
  created_at,
  project_id
FROM project_files 
WHERE name LIKE '%unnamed%' 
  AND project_id = 'c3f8c57c-af05-40b9-8dce-c061f178a93a'
ORDER BY created_at DESC;

-- 3. Verificar configuración del bucket
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types,
  created_at
FROM storage.buckets 
WHERE name = 'project-files';

-- 4. Verificar políticas RLS activas
SELECT 
  policyname,
  cmd,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
  AND cmd = 'SELECT'
ORDER BY policyname;

-- 5. Generar URL de prueba exacta
SELECT 
  'https://xebnhwjzchrsbhzbtlsg.supabase.co/storage/v1/object/public/project-files/' || 
  pf.path as test_url,
  pf.name,
  pf.path,
  pf.type,
  pf.size,
  pf.created_at
FROM project_files pf
WHERE pf.name LIKE '%unnamed%' 
  AND pf.project_id = 'c3f8c57c-af05-40b9-8dce-c061f178a93a'
ORDER BY pf.created_at DESC
LIMIT 1;

-- 6. Verificar si hay archivos duplicados o conflictos de nombres
SELECT 
  name,
  COUNT(*) as count,
  array_agg(path) as paths,
  array_agg(id) as ids
FROM project_files 
WHERE project_id = 'c3f8c57c-af05-40b9-8dce-c061f178a93a'
  AND name LIKE '%unnamed%'
GROUP BY name
HAVING COUNT(*) > 1;

-- 7. Verificar permisos del usuario actual
SELECT 
  current_user,
  session_user,
  current_database(),
  current_schema,
  current_setting('role');

-- 8. Verificar si el bucket tiene archivos
SELECT 
  COUNT(*) as total_files,
  COUNT(DISTINCT name) as unique_names,
  MIN(created_at) as oldest_file,
  MAX(created_at) as newest_file
FROM storage.objects 
WHERE bucket_id = 'project-files';

-- 9. Verificar si hay problemas de permisos específicos
SELECT 
  grantee,
  privilege_type,
  is_grantable,
  table_name,
  table_schema
FROM information_schema.role_table_grants 
WHERE table_name = 'objects' 
  AND table_schema = 'storage'
  AND grantee IN ('public', 'authenticated', 'anon');

-- 10. Verificar configuración de RLS
SELECT 
  schemaname,
  tablename,
  rowsecurity,
  hasindexes,
  hasrules,
  hastriggers
FROM pg_tables 
WHERE tablename = 'objects' 
  AND schemaname = 'storage';
