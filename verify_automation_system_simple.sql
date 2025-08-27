-- =====================================================
-- VERIFICACIÓN SIMPLE DEL SISTEMA DE AUTOMATIZACIÓN
-- =====================================================
-- Script simplificado para verificar que todo esté funcionando

-- =====================================================
-- 1. VERIFICAR TABLAS
-- =================================================

SELECT 'Verificando tablas...' as status;

-- Verificar cada tabla individualmente
SELECT 
    'project_workflows' as tabla,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'project_workflows') 
        THEN '✅ EXISTE' 
        ELSE '❌ NO EXISTE' 
    END as estado
UNION ALL
SELECT 
    'workflow_steps' as tabla,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'workflow_steps') 
        THEN '✅ EXISTE' 
        ELSE '❌ NO EXISTE' 
    END as estado
UNION ALL
SELECT 
    'workflow_executions' as tabla,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'workflow_executions') 
        THEN '✅ EXISTE' 
        ELSE '❌ NO EXISTE' 
    END as estado
UNION ALL
SELECT 
    'system_triggers' as tabla,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'system_triggers') 
        THEN '✅ EXISTE' 
        ELSE '❌ NO EXISTE' 
    END as estado
UNION ALL
SELECT 
    'automation_tasks' as tabla,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'automation_tasks') 
        THEN '✅ EXISTE' 
        ELSE '❌ NO EXISTE' 
    END as estado
UNION ALL
SELECT 
    'automation_logs' as tabla,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'automation_logs') 
        THEN '✅ EXISTE' 
        ELSE '❌ NO EXISTE' 
    END as estado;

-- =====================================================
-- 2. VERIFICAR POLÍTICAS RLS
-- =================================================

SELECT 'Verificando políticas RLS...' as status;

SELECT 
    tablename,
    policyname,
    cmd,
    CASE 
        WHEN cmd = 'SELECT' THEN '🔍 Lectura'
        WHEN cmd = 'INSERT' THEN '➕ Inserción'
        WHEN cmd = 'UPDATE' THEN '✏️ Actualización'
        WHEN cmd = 'DELETE' THEN '🗑️ Eliminación'
        ELSE cmd
    END as tipo_permiso
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN (
    'project_workflows', 
    'workflow_steps', 
    'workflow_executions', 
    'system_triggers', 
    'automation_tasks', 
    'automation_logs'
)
ORDER BY tablename, cmd;

-- =====================================================
-- 3. VERIFICAR FUNCIONES
-- =================================================

SELECT 'Verificando funciones...' as status;

SELECT 
    proname as funcion,
    CASE 
        WHEN proname = 'execute_sql_script' THEN '✅ EXISTE'
        WHEN proname = 'update_updated_at_column' THEN '✅ EXISTE'
        ELSE '❓ DESCONOCIDA'
    END as estado
FROM pg_proc 
WHERE proname IN ('execute_sql_script', 'update_updated_at_column');

-- =====================================================
-- 4. VERIFICAR TRIGGERS
-- =================================================

SELECT 'Verificando triggers...' as status;

SELECT 
    t.tgname as trigger,
    c.relname as tabla,
    CASE 
        WHEN t.tgname LIKE 'update_%_updated_at' THEN '✅ TIMESTAMP'
        ELSE '🔧 OTRO'
    END as tipo
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public' 
AND t.tgname LIKE 'update_%_updated_at';

-- =====================================================
-- 5. VERIFICAR ESTADO DE LAS TABLAS
-- =================================================

SELECT 'Verificando estado de las tablas...' as status;

-- Contar registros en cada tabla (deberían estar vacías inicialmente)
SELECT 
    'project_workflows' as tabla,
    COUNT(*) as registros,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ VACÍA (correcto)'
        ELSE '⚠️ CON DATOS'
    END as estado
FROM project_workflows
UNION ALL
-- Contar triggers
SELECT 
    'system_triggers' as tabla,
    COUNT(*) as registros,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ VACÍA (correcto)'
        ELSE '⚠️ CON DATOS'
    END as estado
FROM system_triggers
UNION ALL
-- Contar tareas
SELECT 
    'automation_tasks' as tabla,
    COUNT(*) as registros,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ VACÍA (correcto)'
        ELSE '⚠️ CON DATOS'
    END as estado
FROM automation_tasks;

-- =====================================================
-- 6. VERIFICAR ÍNDICES
-- =================================================

SELECT 'Verificando índices...' as status;

SELECT 
    indexname as indice,
    tablename as tabla,
    CASE 
        WHEN indexname LIKE 'idx_%' THEN '✅ OPTIMIZACIÓN'
        ELSE '🔧 OTRO'
    END as tipo
FROM pg_indexes 
WHERE schemaname = 'public' 
AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- =====================================================
-- 7. PRUEBA DE FUNCIONALIDAD
-- =================================================

SELECT 'Probando funcionalidad...' as status;

-- Intentar insertar un log de prueba
DO $$
DECLARE
    log_id UUID;
BEGIN
    -- Insertar log de prueba
    INSERT INTO automation_logs (
        automation_type, 
        action, 
        message, 
        status
    ) VALUES (
        'test', 
        'Verificación del sistema', 
        'Prueba de inserción exitosa', 
        'success'
    ) RETURNING id INTO log_id;
    
    -- Mostrar confirmación
    RAISE NOTICE '✅ Prueba de inserción exitosa - Log ID: %', log_id;
    
    -- Limpiar log de prueba
    DELETE FROM automation_logs WHERE id = log_id;
    RAISE NOTICE '🧹 Log de prueba eliminado correctamente';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING '⚠️ Error en prueba de inserción: %', SQLERRM;
END $$;

-- =====================================================
-- 8. RESUMEN FINAL
-- =================================================

SELECT 'RESUMEN DE VERIFICACIÓN' as titulo;

-- Contar total de elementos verificados
SELECT 
    'TABLAS' as categoria,
    COUNT(*) as total,
    '6 esperadas' as esperado
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'project_workflows', 
    'workflow_steps', 
    'workflow_executions', 
    'system_triggers', 
    'automation_tasks', 
    'automation_logs'
)
UNION ALL
SELECT 
    'POLÍTICAS RLS' as categoria,
    COUNT(*) as total,
    '20+ esperadas' as esperado
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN (
    'project_workflows', 
    'workflow_steps', 
    'workflow_executions', 
    'system_triggers', 
    'automation_tasks', 
    'automation_logs'
)
UNION ALL
SELECT 
    'FUNCIONES' as categoria,
    COUNT(*) as total,
    '2 esperadas' as esperado
FROM pg_proc 
WHERE proname IN ('execute_sql_script', 'update_updated_at_column')
UNION ALL
SELECT 
    'TRIGGERS' as categoria,
    COUNT(*) as total,
    '3+ esperados' as esperado
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public' 
AND t.tgname LIKE 'update_%_updated_at';

-- =====================================================
-- 9. MENSAJE FINAL
-- =================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=====================================================';
    RAISE NOTICE '🔍 VERIFICACIÓN COMPLETADA DEL SISTEMA DE AUTOMATIZACIÓN';
    RAISE NOTICE '=====================================================';
    RAISE NOTICE '';
    RAISE NOTICE '📊 Si ves ✅ en todas las verificaciones, el sistema está funcionando correctamente';
    RAISE NOTICE '⚠️ Si ves ⚠️ o ❌, revisa los mensajes de error arriba';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 ¡Tu Sistema de Automatización está listo para usar!';
    RAISE NOTICE '';
END $$;
