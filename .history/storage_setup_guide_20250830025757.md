# Guía de Configuración de Storage en Supabase

## Problema Identificado
El error `ERROR: 42501: must be owner of table objects` indica que no tienes permisos de propietario en las tablas de Storage de Supabase. Esto es normal y esperado.

## Solución: Configuración desde la Interfaz Web

### Paso 1: Acceder a Storage
1. Ve a tu proyecto de Supabase
2. En el menú lateral, haz clic en **Storage**
3. Verifica que existe el bucket `project-files`

### Paso 2: Crear Bucket (si no existe)
1. Haz clic en **"New bucket"**
2. Nombre: `project-files`
3. Marca **"Public bucket"** como ✅ TRUE
4. **File size limit**: 50MB (o el límite que prefieras)
5. **Allowed MIME types**: Deja vacío para permitir todos
6. Haz clic en **"Create bucket"**

### Paso 3: Configurar Políticas RLS
1. En Storage, haz clic en el bucket `project-files`
2. Ve a la pestaña **"Policies"**
3. Haz clic en **"New Policy"**

#### Política 1: Lectura (SELECT)
- **Policy name**: `Allow authenticated users to read files`
- **Target roles**: `authenticated`
- **Policy definition**:
  ```sql
  (bucket_id = (SELECT id FROM storage.buckets WHERE name = 'project-files'))
  ```
- Haz clic en **"Review"** y luego **"Save policy"**

#### Política 2: Subida (INSERT)
- **Policy name**: `Allow authenticated users to upload files`
- **Target roles**: `authenticated`
- **Policy definition**:
  ```sql
  (bucket_id = (SELECT id FROM storage.buckets WHERE name = 'project-files'))
  ```
- Haz clic en **"Review"** y luego **"Save policy"**

#### Política 3: Actualización (UPDATE)
- **Policy name**: `Allow users to update own files`
- **Target roles**: `authenticated`
- **Policy definition**:
  ```sql
  (bucket_id = (SELECT id FROM storage.buckets WHERE name = 'project-files') AND auth.uid() = owner)
  ```
- Haz clic en **"Review"** y luego **"Save policy"**

#### Política 4: Eliminación (DELETE)
- **Policy name**: `Allow users to delete own files`
- **Target roles**: `authenticated`
- **Policy definition**:
  ```sql
  (bucket_id = (SELECT id FROM storage.buckets WHERE name = 'project-files') AND auth.uid() = owner)
  ```
- Haz clic en **"Review"** y luego **"Save policy"**

### Paso 4: Verificar Configuración
1. Ejecuta el script `diagnose_storage.sql` en la consola SQL
2. Verifica que todas las políticas estén configuradas correctamente
3. Verifica que el bucket esté marcado como público

## Verificación de la Configuración

### Script de Diagnóstico
Ejecuta este script en la consola SQL para verificar:

```sql
-- Verificar bucket
SELECT name, public FROM storage.buckets WHERE name = 'project-files';

-- Verificar políticas
SELECT name, operation FROM storage.policies 
WHERE bucket_id = (SELECT id FROM storage.buckets WHERE name = 'project-files');

-- Verificar archivos
SELECT COUNT(*) FROM storage.objects 
WHERE bucket_id = (SELECT id FROM storage.buckets WHERE name = 'project-files');
```

### Resultados Esperados
- ✅ Bucket `project-files` existe y es público
- ✅ 4 políticas configuradas (SELECT, INSERT, UPDATE, DELETE)
- ✅ Al menos algunos archivos en el bucket

## Solución de Problemas Comunes

### Problema: "Bucket no existe"
**Solución**: Crear el bucket desde Storage > New bucket

### Problema: "Bucket no es público"
**Solución**: En la configuración del bucket, marcar "Public bucket" como TRUE

### Problema: "No hay políticas configuradas"
**Solución**: Crear las 4 políticas siguiendo el Paso 3

### Problema: "Usuario no autenticado"
**Solución**: Verificar que la aplicación esté autenticando correctamente

### Problema: "Error de permisos en la aplicación"
**Solución**: Verificar que las variables de entorno estén configuradas:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Prueba de Funcionamiento

1. **Subir archivo**: Intenta subir una imagen desde la aplicación
2. **Ver vista previa**: Haz clic en una imagen para ver si se muestra
3. **Verificar consola**: Revisa la consola del navegador para errores
4. **Verificar Network**: En DevTools, verifica las peticiones a Storage

## Notas Importantes

- **No uses SQL directo** para modificar Storage en Supabase
- **Siempre usa la interfaz web** para configurar políticas
- **Las políticas se aplican inmediatamente** después de guardarlas
- **El bucket debe ser público** para que las URLs funcionen
- **Los usuarios deben estar autenticados** para acceder a Storage

## Contacto de Soporte

Si sigues teniendo problemas después de seguir esta guía:
1. Ejecuta `diagnose_storage.sql` y comparte los resultados
2. Verifica que todas las políticas estén configuradas
3. Revisa los logs de la aplicación en la consola del navegador
