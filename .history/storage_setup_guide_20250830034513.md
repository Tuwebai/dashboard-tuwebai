# 🚀 Guía Completa para Configurar Supabase Storage

## 📋 Pasos para Solucionar el Acceso a Imágenes

### **Paso 1: Verificar Configuración del Bucket**

1. Ve a **Supabase Dashboard** → **Storage**
2. Busca el bucket `project-files`
3. **IMPORTANTE**: Asegúrate de que esté marcado como **"Public"**

### **Paso 2: Configurar Políticas RLS**

1. Ve a **SQL Editor** en Supabase
2. Ejecuta el script `fix_storage_access.sql` como **superuser**
3. Si no tienes permisos de superuser, ejecuta esto manualmente:

```sql
-- Habilitar RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas conflictivas
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view objects" ON storage.objects;

-- Crear política de acceso público
CREATE POLICY "Public Access" ON storage.objects
FOR SELECT USING (
  bucket_id IN (
    SELECT id FROM storage.buckets WHERE public = true
  )
);

-- Hacer el bucket público
UPDATE storage.buckets 
SET public = true 
WHERE name = 'project-files';
```

### **Paso 3: Verificar Políticas Creadas**

Ejecuta este query para verificar:

```sql
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
```

### **Paso 4: Verificar Configuración del Bucket**

```sql
SELECT 
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets 
WHERE name = 'project-files';
```

**Debe mostrar:**
- `public: true`
- `name: project-files`

### **Paso 5: Probar Acceso Directo**

1. Copia una URL de imagen del dashboard
2. Pégala en una nueva pestaña del navegador
3. **Debe cargar la imagen directamente**

### **Paso 6: Verificar en el Código**

Si todo está configurado correctamente, la imagen debería cargar. Si no:

1. **Verifica la consola del navegador** para errores CORS
2. **Verifica Network tab** para ver si la imagen se está descargando
3. **Verifica que la URL sea exactamente correcta**

## 🔧 Solución de Problemas Comunes

### **Error: "Access Denied"**
- El bucket no está marcado como público
- Las políticas RLS están bloqueando el acceso

### **Error: "File Not Found"**
- La ruta del archivo es incorrecta
- El archivo no existe en Storage

### **Error: CORS**
- Las políticas de Storage no están configuradas correctamente
- El bucket no es público

## ✅ Verificación Final

Después de aplicar todos los pasos:

1. **La imagen debe cargar en el modal de vista previa**
2. **No debe haber errores en la consola del navegador**
3. **La URL debe ser accesible directamente en el navegador**

## 🚨 Si Nada Funciona

1. **Verifica que seas superuser** en Supabase
2. **Revisa los logs** de Supabase para errores
3. **Contacta al soporte** de Supabase si persiste el problema

---

**Nota**: Este problema es típicamente de **configuración de permisos**, no del código. Una vez configurado correctamente, las imágenes deberían cargar sin problemas.
