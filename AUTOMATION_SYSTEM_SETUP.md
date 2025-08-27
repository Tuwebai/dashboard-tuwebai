# 🚀 SISTEMA DE AUTOMATIZACIÓN COMPLETO - TUWEBAI

## 📋 Descripción
Este sistema implementa un completo motor de automatización para TuWebAI, incluyendo workflows, triggers, tareas automatizadas y un sistema de logs integrado.

## 🗄️ Base de Datos Requerida
- **Supabase** (PostgreSQL 15+)
- **Extensiones**: `uuid-ossp` (para UUIDs)

## 📁 Archivos del Sistema

### 1. `automation_system_complete.sql`
Script principal que configura todo el sistema:
- ✅ Crea todas las tablas necesarias
- ✅ Configura políticas RLS (Row Level Security)
- ✅ Crea funciones y triggers
- ✅ Configura tablas vacías para datos reales
- ✅ Configura índices de optimización

### 2. `verify_automation_system.sql`
Script de verificación que comprueba:
- ✅ Existencia de todas las tablas
- ✅ Configuración de políticas RLS
- ✅ Funciones y triggers
- ✅ Estado de tablas
- ✅ Prueba de funcionalidad

## 🚀 Instalación Paso a Paso

### Paso 1: Ejecutar el Script Principal
1. Ve a tu **Supabase Dashboard**
2. Navega a **SQL Editor**
3. Copia y pega el contenido de `automation_system_complete.sql`
4. Haz clic en **"Run"** (o presiona `Ctrl + Enter`)

**⚠️ IMPORTANTE**: Asegúrate de estar en la base de datos correcta (Production)

### Paso 2: Verificar la Instalación
1. En el mismo **SQL Editor**
2. Copia y pega el contenido de `verify_automation_system.sql`
3. Ejecuta el script
4. Deberías ver mensajes de confirmación con ✅

### Paso 3: Verificar en la Interfaz Web
1. Ve a tu dashboard de TuWebAI
2. Navega a **Sistema de Automatización**
3. Verifica que puedas ver las estadísticas
4. Prueba crear un workflow, trigger o tarea

## 🏗️ Estructura del Sistema

### Tablas Principales

| Tabla | Descripción | Funcionalidad |
|-------|-------------|---------------|
| `project_workflows` | Workflows de proyectos | Define flujos de trabajo automatizados |
| `workflow_steps` | Pasos de cada workflow | Pasos individuales con condiciones y acciones |
| `workflow_executions` | Ejecuciones de workflows | Historial y estado de ejecuciones |
| `system_triggers` | Triggers del sistema | Eventos que disparan acciones automáticas |
| `automation_tasks` | Tareas programadas | Tareas que se ejecutan en intervalos |
| `automation_logs` | Logs del sistema | Registro de todas las actividades |

### Funciones del Sistema

| Función | Descripción |
|---------|-------------|
| `execute_sql_script()` | Ejecuta scripts SQL de forma segura |
| `update_updated_at_column()` | Actualiza timestamps automáticamente |

## 🔒 Seguridad (RLS)

El sistema implementa **Row Level Security** completo:

- **Lectura**: Todos los usuarios autenticados pueden ver workflows, triggers y tareas
- **Escritura**: Solo usuarios autenticados pueden crear elementos
- **Modificación**: Solo el creador o usuarios con rol `service_role` pueden modificar
- **Eliminación**: Solo el creador o usuarios con rol `service_role` pueden eliminar

## 🎯 Funcionalidades Principales

### 1. Workflows de Proyectos
- ✅ Crear workflows personalizados
- ✅ Definir pasos con condiciones
- ✅ Ejecutar workflows manualmente
- ✅ Seguimiento de ejecuciones

### 2. Triggers del Sistema
- ✅ Triggers basados en eventos
- ✅ Acciones automáticas
- ✅ Condiciones personalizables
- ✅ Activación/desactivación

### 3. Tareas Automatizadas
- ✅ Tareas programadas (diarias, semanales, mensuales)
- ✅ Ejecución de scripts SQL
- ✅ Seguimiento de éxito/error
- ✅ Programación automática

### 4. Sistema de Logs
- ✅ Registro de todas las actividades
- ✅ Diferentes tipos de log (success, error, warning)
- ✅ Metadatos de ejecución
- ✅ Historial completo

## 🛠️ Uso del Sistema

### Crear un Workflow
1. Ve a **Sistema de Automatización** → **Workflows**
2. Haz clic en **"+ Nuevo Workflow"**
3. Completa el formulario:
   - **Nombre**: Nombre descriptivo
   - **Descripción**: Explicación del workflow
   - **Tipo de Proyecto**: Categoría del proyecto
   - **Activo**: Estado inicial

### Crear un Trigger
1. Ve a **Triggers**
2. Haz clic en **"+ Nuevo Trigger"**
3. Configura:
   - **Nombre**: Nombre del trigger
   - **Evento**: Tipo de evento que lo activa
   - **Acciones**: Qué hacer cuando se active

### Crear una Tarea
1. Ve a **Tareas**
2. Haz clic en **"+ Nueva Tarea"**
3. Define:
   - **Nombre**: Nombre de la tarea
   - **Tipo**: Frecuencia de ejecución
   - **Script**: Código SQL a ejecutar
   - **Tipo de Script**: SQL, JavaScript, Shell

## 🔍 Solución de Problemas

### Error: "new row violates row-level security policy"
**Causa**: Las políticas RLS están bloqueando la inserción
**Solución**: Verifica que el usuario esté autenticado y tenga permisos

### Error: "Could not find the function execute_sql_script"
**Causa**: La función no se creó correctamente
**Solución**: Ejecuta nuevamente `automation_system_complete.sql`

### Error: "Failed to load resource: 403/406"
**Causa**: Problemas de permisos o políticas RLS
**Solución**: Verifica que las políticas estén configuradas correctamente

### Error: "LogsTab is not defined"
**Causa**: Problema en el componente React
**Solución**: Verifica que el componente esté importado correctamente

## 📊 Verificación del Sistema

### Comandos de Verificación Rápidos

```sql
-- Verificar tablas
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%workflow%' OR table_name LIKE '%trigger%' OR table_name LIKE '%automation%';

-- Verificar políticas RLS
SELECT tablename, policyname FROM pg_policies 
WHERE tablename IN ('project_workflows', 'system_triggers', 'automation_tasks');

-- Verificar funciones
SELECT proname FROM pg_proc 
WHERE proname IN ('execute_sql_script', 'update_updated_at_column');
```

### Estado Esperado
- ✅ **6 tablas** creadas
- ✅ **20+ políticas RLS** configuradas
- ✅ **2 funciones** creadas
- ✅ **3+ triggers** configurados
- ✅ **10+ índices** creados
- ✅ **Tablas vacías** y listas para datos reales

## 🚀 Próximos Pasos

1. **Configurar el sistema** ejecutando los scripts SQL
2. **Verificar la instalación** con el script de verificación
3. **Probar la funcionalidad** en la interfaz web
4. **Crear workflows personalizados** para tu flujo de trabajo
5. **Configurar triggers** para automatizar procesos
6. **Programar tareas** para mantenimiento automático

## 📞 Soporte

Si encuentras problemas:
1. Verifica que todos los scripts se ejecutaron correctamente
2. Revisa la consola del navegador para errores
3. Ejecuta el script de verificación para diagnosticar
4. Verifica que las políticas RLS estén configuradas

---

**🎉 ¡Tu Sistema de Automatización está listo para optimizar tu flujo de trabajo!**
