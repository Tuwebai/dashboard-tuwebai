# Configuración de Tablas de Colaboración

## Problema
El sistema de colaboración está intentando acceder a tablas que no existen en la base de datos de Supabase:
- `project_messages` - Para mensajes del chat
- `project_tasks` - Para gestión de tareas
- `project_files` - Para archivos compartidos

## Solución

### Opción 1: Script Completo (Recomendado)
1. Ve a **Supabase Dashboard** → **SQL Editor**
2. Copia y pega el contenido de `create_collaboration_tables.sql`
3. Ejecuta el script
4. Luego ejecuta `create_storage_bucket.sql`

### Opción 2: Script Muy Simple (Si la Opción 1 falla)
1. Ve a **Supabase Dashboard** → **SQL Editor**
2. Copia y pega el contenido de `create_collaboration_tables_simple.sql`
3. Ejecuta el script
4. Luego ejecuta `create_simple_storage_bucket.sql`

### Paso 2: Crear el Bucket de Storage
1. En el mismo **SQL Editor**
2. Copia y pega el contenido de `create_storage_bucket.sql` (o `create_simple_storage_bucket.sql`)
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
- **Script Completo**: Incluye índices, triggers y optimizaciones
- **Script Simple**: Solo crea las tablas básicas sin extras
- **Sin RLS**: Las tablas se crean sin Row Level Security para facilitar el desarrollo
- **Sin Políticas**: Se eliminaron las políticas de seguridad complejas que causaban errores
- **Funcionalidad Básica**: El sistema funcionará correctamente con esta configuración básica
- **En Producción**: Considera habilitar RLS y políticas de acceso más tarde

## Próximos Pasos
1. Ejecuta los scripts SQL (completo o simple)
2. Prueba la funcionalidad de colaboración
3. Verifica que no aparezcan errores 404
4. Testea el envío de mensajes, creación de tareas y subida de archivos

## Solución de Problemas
Si sigues viendo errores:
1. **Error 42703**: Usa el script simple (`create_collaboration_tables_simple.sql`)
2. **Error 404**: Verifica que las tablas se crearon correctamente
3. **Error 400**: Asegúrate de que el bucket de storage existe
4. **Verificación**: Revisa que aparezcan las 3 tablas en Table Editor

## Archivos de Scripts
- `create_collaboration_tables.sql` - **Script completo** (índices + triggers)
- `create_collaboration_tables_simple.sql` - **Script simple** (solo tablas básicas)
- `create_storage_bucket.sql` - **Bucket completo**
- `create_simple_storage_bucket.sql` - **Bucket simple**

## Recomendación
**Si tienes problemas con el script completo, usa el script simple primero para asegurar que las tablas se crean correctamente.**
