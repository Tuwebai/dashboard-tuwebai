# Configuración de Tablas de Colaboración

## Problema
El sistema de colaboración está intentando acceder a tablas que no existen en la base de datos de Supabase:
- `project_messages` - Para mensajes del chat
- `project_tasks` - Para gestión de tareas
- `project_files` - Para archivos compartidos

## Solución Completa

### Paso 1: Crear las Tablas
1. Ve a **Supabase Dashboard** → **SQL Editor**
2. Copia y pega el contenido de `create_collaboration_tables.sql`
3. Ejecuta el script
4. Verifica que aparezcan las 3 tablas en **Table Editor**

### Paso 2: Crear el Bucket de Storage
1. En el mismo **SQL Editor**
2. Copia y pega el contenido de `create_storage_bucket.sql`
3. Ejecuta el script
4. Verifica que aparezca el bucket en **Storage**

### Paso 3: Crear Políticas de Seguridad
1. En el mismo **SQL Editor**
2. Copia y pega el contenido de `create_collaboration_policies.sql`
3. Ejecuta el script
4. Verifica que las políticas se crearon correctamente

### Paso 4: Verificar la Configuración
Después de ejecutar todos los scripts, deberías ver:
- 3 tablas nuevas en **Table Editor**
- 1 bucket nuevo en **Storage**
- Políticas de seguridad habilitadas
- **Sin errores 404** en la consola del navegador

## Estructura de las Tablas

### project_messages
- `id`: Identificador único
- `project_id`: ID del proyecto
- `text`: Contenido del mensaje
- `sender`: ID del usuario que envía
- `sender_name`: Nombre del remitente
- `role`: 'admin' o 'cliente'
- `timestamp`: Fecha y hora del mensaje

### project_tasks
- `id`: Identificador único
- `project_id`: ID del proyecto
- `title`: Título de la tarea
- `description`: Descripción detallada
- `status`: 'pending', 'in-progress', 'completed', 'cancelled'
- `priority`: 'low', 'medium', 'high', 'urgent'
- `assignee`: ID del usuario asignado
- `due_date`: Fecha de vencimiento

### project_files
- `id`: Identificador único
- `project_id`: ID del proyecto
- `name`: Nombre del archivo
- `url`: URL del archivo en storage
- `size`: Tamaño en bytes
- `type`: Tipo MIME del archivo
- `uploaded_by`: ID del usuario que subió el archivo

## Bucket de Storage
- **Nombre**: `project-files`
- **Público**: Sí
- **Límite por archivo**: 50MB
- **Tipos permitidos**: Imágenes, videos, documentos, archivos comprimidos

## Políticas de Seguridad
- **RLS Habilitado**: Row Level Security activado en todas las tablas
- **Acceso por Proyecto**: Los usuarios solo ven datos de sus proyectos
- **Propietarios de Proyectos**: Pueden gestionar todos los datos de sus proyectos
- **Archivos Seguros**: Acceso controlado al bucket de storage

## Notas Importantes
- **Orden de Ejecución**: Primero tablas, luego bucket, luego políticas
- **Verificación**: Cada paso debe ejecutarse correctamente antes del siguiente
- **Funcionalidad Completa**: El sistema funcionará con todas las características
- **Seguridad**: Las políticas protegen los datos de cada usuario

## Próximos Pasos
1. Ejecuta los 3 scripts en orden
2. Prueba la funcionalidad de colaboración
3. Verifica que no aparezcan errores 404
4. Testea el envío de mensajes, creación de tareas y subida de archivos

## Solución de Problemas
Si sigues viendo errores:
1. **Error 42703**: Las tablas ya están creadas, continúa con el bucket
2. **Error 404**: Verifica que las tablas se crearon correctamente
3. **Error 400**: Asegúrate de que el bucket de storage existe
4. **Error de Permisos**: Ejecuta el script de políticas de seguridad
5. **Verificación**: Revisa que aparezcan las 3 tablas en Table Editor

## Archivos de Scripts (en orden de ejecución)
1. `create_collaboration_tables.sql` - **Crear tablas**
2. `create_storage_bucket.sql` - **Crear bucket de storage**
3. `create_collaboration_policies.sql` - **Crear políticas de seguridad**

## Estado Actual
✅ **Tablas creadas correctamente** - Todas las columnas están presentes
✅ **Estructura válida** - Las tablas tienen la estructura correcta
🔄 **Pendiente**: Crear bucket y políticas de seguridad
