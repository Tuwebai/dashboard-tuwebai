-- Script para configurar las políticas de Storage correctamente
-- Ejecutar en la consola SQL de Supabase
-- NOTA: Este script solo verifica y sugiere configuraciones, no modifica directamente

-- 1. Verificar que el bucket 'project-files' existe y está configurado correctamente
SELECT 
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets 
WHERE name = 'project-files';

-- 2. Verificar las políticas del bucket existentes
SELECT 
  bucket_id,
  name,
  definition,
  operation
FROM storage.policies 
WHERE bucket_id = (SELECT id FROM storage.buckets WHERE name = 'project-files')
ORDER BY operation;

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

-- 5. Verificar la configuración final del bucket
SELECT 
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets 
WHERE name = 'project-files';

-- ==========================================
-- INSTRUCCIONES MANUALES PARA CONFIGURAR STORAGE
-- ==========================================

-- Si el bucket no existe o no está configurado correctamente, sigue estos pasos:

-- 1. Ve a la consola de Supabase > Storage
-- 2. Crea un nuevo bucket llamado 'project-files' si no existe
-- 3. En la configuración del bucket:
--    - Marca "Public bucket" como TRUE para permitir acceso público
--    - Establece "File size limit" según tus necesidades (ej: 50MB)
--    - En "Allowed MIME types" puedes dejar vacío para permitir todos

-- 4. Para las políticas de RLS, ve a Storage > Policies y configura:
--    - SELECT: Permitir a usuarios autenticados
--    - INSERT: Permitir a usuarios autenticados  
--    - UPDATE: Permitir solo al propietario del archivo
--    - DELETE: Permitir solo al propietario del archivo

-- 5. Ejemplo de política SELECT (crear desde la interfaz):
--    Nombre: "Allow authenticated users to read files"
--    Target roles: authenticated
--    Using expression: bucket_id = (SELECT id FROM storage.buckets WHERE name = 'project-files')

-- 6. Ejemplo de política INSERT (crear desde la interfaz):
--    Nombre: "Allow authenticated users to upload files"
--    Target roles: authenticated
--    Using expression: bucket_id = (SELECT id FROM storage.buckets WHERE name = 'project-files')

-- 7. Ejemplo de política UPDATE (crear desde la interfaz):
--    Nombre: "Allow users to update own files"
--    Target roles: authenticated
--    Using expression: bucket_id = (SELECT id FROM storage.buckets WHERE name = 'project-files') AND auth.uid() = owner

-- 8. Ejemplo de política DELETE (crear desde la interfaz):
--    Nombre: "Allow users to delete own files"
--    Target roles: authenticated
--    Using expression: bucket_id = (SELECT id FROM storage.buckets WHERE name = 'project-files') AND auth.uid() = owner
