# Configuración de Tablas de Colaboración

## Problema
El sistema de colaboración está intentando acceder a tablas que no existen en la base de datos de Supabase:
- `project_messages` - Para mensajes del chat
- `project_tasks` - Para gestión de tareas
- `project_files` - Para archivos compartidos

## Solución

### Paso 1: Crear las Tablas Básicas
1. Ve a **Supabase Dashboard** → **SQL Editor**
2. Copia y pega el contenido de `create_collaboration_tables.sql` (versión simplificada)
3. Ejecuta el script

### Paso 2: Crear el Bucket de Storage
1. En el mismo **SQL Editor**
2. Copia y pega el contenido de `create_storage_bucket.sql` (versión simplificada)
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
- **Versión Simplificada**: Los scripts se han simplificado para evitar errores de columnas inexistentes
- **Sin RLS**: Las tablas se crean sin Row Level Security para facilitar el desarrollo
- **Sin Políticas**: Se eliminaron las políticas de seguridad complejas que causaban errores
- **Funcionalidad Básica**: El sistema funcionará correctamente con esta configuración básica
- **En Producción**: Considera habilitar RLS y políticas de acceso más tarde

## Próximos Pasos
1. Ejecuta los scripts SQL simplificados
2. Prueba la funcionalidad de colaboración
3. Verifica que no aparezcan errores 404
4. Testea el envío de mensajes, creación de tareas y subida de archivos

## Solución de Problemas
Si sigues viendo errores:
1. **Error 42703**: Asegúrate de usar los scripts simplificados
2. **Error 404**: Verifica que las tablas se crearon correctamente
3. **Error 400**: Asegúrate de que el bucket de storage existe
4. **Verificación**: Revisa que aparezcan las 3 tablas en Table Editor

## Archivos de Scripts
- `create_collaboration_tables.sql` - **USAR ESTE** (versión simplificada)
- `create_storage_bucket.sql` - **USAR ESTE** (versión simplificada)
- `create_simple_collaboration_tables.sql` - Alternativa más básica
- `create_simple_storage_bucket.sql` - Alternativa más básica
