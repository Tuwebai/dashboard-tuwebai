# Configuración de Tablas de Colaboración

## Problema
El sistema de colaboración está intentando acceder a tablas que no existen en la base de datos de Supabase:
- `project_messages` - Para mensajes del chat
- `project_tasks` - Para gestión de tareas
- `project_files` - Para archivos compartidos

## Solución

### Paso 1: Crear las Tablas Básicas
1. Ve a **Supabase Dashboard** → **SQL Editor**
2. Copia y pega el contenido de `create_simple_collaboration_tables.sql`
3. Ejecuta el script

### Paso 2: Crear el Bucket de Storage
1. En el mismo **SQL Editor**
2. Copia y pega el contenido de `create_simple_storage_bucket.sql`
3. Ejecuta el script

### Paso 3: Verificar la Configuración
Después de ejecutar ambos scripts, deberías ver:
- 3 tablas nuevas en **Table Editor**
- 1 bucket nuevo en **Storage**

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

## Notas Importantes
- Las tablas se crean sin restricciones de seguridad complejas para facilitar el desarrollo
- En producción, considera habilitar RLS (Row Level Security) y políticas de acceso
- El bucket de storage permite acceso público a los archivos
- Los archivos se organizan por proyecto: `project-files/{project_id}/{filename}`

## Próximos Pasos
1. Ejecuta los scripts SQL
2. Prueba la funcionalidad de colaboración
3. Verifica que no aparezcan errores 404
4. Testea el envío de mensajes, creación de tareas y subida de archivos

## Solución de Problemas
Si sigues viendo errores 404:
1. Verifica que las tablas se crearon correctamente
2. Asegúrate de que el bucket de storage existe
3. Revisa la consola del navegador para errores específicos
4. Verifica que el usuario tenga permisos en Supabase
