-- Script de diagnóstico para Storage de Supabase
-- Ejecutar en la consola SQL de Supabase
-- Solo operaciones de lectura (sin modificar nada)

-- ==========================================
-- DIAGNÓSTICO DEL BUCKET
-- ==========================================

-- 1. Verificar si el bucket 'project-files' existe
SELECT 
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Bucket existe'
    ELSE '❌ Bucket NO existe'
  END as bucket_status,
  COUNT(*) as bucket_count
FROM storage.buckets 
WHERE name = 'project-files';

-- 2. Si existe, mostrar configuración del bucket
SELECT 
  name,
  public,
  file_size_limit,
  allowed_mime_types,
  created_at
FROM storage.buckets 
WHERE name = 'project-files';

-- ==========================================
-- DIAGNÓSTICO DE POLÍTICAS
-- ==========================================

-- 3. Verificar políticas existentes
SELECT 
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Hay políticas configuradas'
    ELSE '❌ NO hay políticas configuradas'
  END as policies_status,
  COUNT(*) as policies_count
FROM storage.policies 
WHERE bucket_id = (SELECT id FROM storage.buckets WHERE name = 'project-files');

-- 4. Mostrar políticas existentes
SELECT 
  name as policy_name,
  operation,
  definition,
  CASE 
    WHEN operation = 'SELECT' THEN '🔍 Lectura'
    WHEN operation = 'INSERT' THEN '📤 Subida'
    WHEN operation = 'UPDATE' THEN '✏️ Actualización'
    WHEN operation = 'DELETE' THEN '🗑️ Eliminación'
    ELSE operation
  END as operation_description
FROM storage.policies 
WHERE bucket_id = (SELECT id FROM storage.buckets WHERE name = 'project-files')
ORDER BY operation;

-- ==========================================
-- DIAGNÓSTICO DE ARCHIVOS
-- ==========================================

-- 5. Verificar si hay archivos en el bucket
SELECT 
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Hay archivos en el bucket'
    ELSE '❌ NO hay archivos en el bucket'
  END as files_status,
  COUNT(*) as files_count
FROM storage.objects 
WHERE bucket_id = (SELECT id FROM storage.buckets WHERE name = 'project-files');

-- 6. Mostrar algunos archivos de ejemplo (si existen)
SELECT 
  name as file_name,
  size,
  owner,
  created_at,
  CASE 
    WHEN name LIKE '%.jpg' OR name LIKE '%.jpeg' OR name LIKE '%.png' OR name LIKE '%.gif' THEN '🖼️ Imagen'
    WHEN name LIKE '%.pdf' OR name LIKE '%.doc' OR name LIKE '%.txt' THEN '📄 Documento'
    WHEN name LIKE '%.js' OR name LIKE '%.ts' OR name LIKE '%.html' OR name LIKE '%.css' THEN '💻 Código'
    ELSE '📁 Otro'
  END as file_type
FROM storage.objects 
WHERE bucket_id = (SELECT id FROM storage.buckets WHERE name = 'project-files')
ORDER BY created_at DESC
LIMIT 5;

-- ==========================================
-- DIAGNÓSTICO DE PERMISOS
-- ==========================================

-- 7. Verificar usuario actual y permisos
SELECT 
  auth.uid() as current_user_id,
  auth.role() as current_user_role,
  CASE 
    WHEN auth.uid() IS NOT NULL THEN '✅ Usuario autenticado'
    ELSE '❌ Usuario NO autenticado'
  END as auth_status;

-- ==========================================
-- RESUMEN DEL DIAGNÓSTICO
-- ==========================================

-- 8. Resumen de problemas comunes
SELECT 
  'DIAGNÓSTICO COMPLETO' as section,
  'Revisa los resultados anteriores para identificar problemas:' as instruction;

-- 9. Problemas comunes y soluciones
SELECT 
  'PROBLEMAS COMUNES:' as problem_type,
  '❌ Bucket no existe' as problem,
  'Solución: Crear bucket "project-files" en Storage' as solution
UNION ALL
SELECT 
  'PROBLEMAS COMUNES:' as problem_type,
  '❌ Bucket no es público' as problem,
  'Solución: Marcar "Public bucket" como TRUE' as solution
UNION ALL
SELECT 
  'PROBLEMAS COMUNES:' as problem_type,
  '❌ No hay políticas configuradas' as problem,
  'Solución: Crear políticas desde Storage > Policies' as solution
UNION ALL
SELECT 
  'PROBLEMAS COMUNES:' as problem_type,
  '❌ Usuario no autenticado' as problem,
  'Solución: Verificar autenticación en la aplicación' as solution;
