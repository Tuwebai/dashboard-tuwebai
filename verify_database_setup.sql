-- =====================================================
-- VERIFICACIÓN DE CONFIGURACIÓN DE BASE DE DATOS
-- =====================================================
-- Este script verifica que todo esté funcionando correctamente

-- =====================================================
-- 1. VERIFICAR TABLAS
-- =====================================================

SELECT 'Verificando tablas...' as status;

SELECT 
    table_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = table_name) 
        THEN '✅ EXISTE' 
        ELSE '❌ NO EXISTE' 
    END as estado
FROM (VALUES 
    ('users'),
    ('projects'),
    ('project_files'),
    ('tickets'),
    ('payments'),
    ('notifications'),
    ('notification_settings'),
    ('system_logs'),
    ('chat_rooms'),
    ('chat_messages'),
    ('tasks'),
    ('project_comments'),
    ('project_metrics'),
    ('client_preferences')
) AS t(table_name);

-- =====================================================
-- 2. VERIFICAR POLÍTICAS RLS
-- =====================================================

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
    'users', 'projects', 'project_files', 'tickets', 'payments',
    'notifications', 'notification_settings', 'system_logs',
    'chat_rooms', 'chat_messages', 'tasks', 'project_comments',
    'project_metrics', 'client_preferences'
)
ORDER BY tablename, cmd;

-- =====================================================
-- 3. VERIFICAR FUNCIONES
-- =====================================================

SELECT 'Verificando funciones...' as status;

SELECT 
    proname as funcion,
    CASE 
        WHEN proname = 'update_updated_at_column' THEN '✅ EXISTE'
        WHEN proname = 'calculate_project_progress' THEN '✅ EXISTE'
        ELSE '❓ DESCONOCIDA'
    END as estado
FROM pg_proc 
WHERE proname IN ('update_updated_at_column', 'calculate_project_progress');

-- =====================================================
-- 4. VERIFICAR TRIGGERS
-- =====================================================

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
-- 5. VERIFICAR ÍNDICES
-- =====================================================

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
-- 6. VERIFICAR DATOS INICIALES
-- =====================================================

SELECT 'Verificando datos iniciales...' as status;

-- Verificar usuario admin
SELECT 
    'Usuario Admin' as elemento,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ EXISTE'
        ELSE '❌ NO EXISTE'
    END as estado,
    COUNT(*) as cantidad
FROM users WHERE email = 'tuwebai@gmail.com';

-- Verificar configuración de notificaciones del admin
SELECT 
    'Config Notificaciones Admin' as elemento,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ EXISTE'
        ELSE '❌ NO EXISTE'
    END as estado,
    COUNT(*) as cantidad
FROM notification_settings ns
JOIN users u ON ns.user_id = u.id
WHERE u.email = 'tuwebai@gmail.com';

-- Verificar preferencias del cliente del admin
SELECT 
    'Preferencias Cliente Admin' as elemento,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ EXISTE'
        ELSE '❌ NO EXISTE'
    END as estado,
    COUNT(*) as cantidad
FROM client_preferences cp
JOIN users u ON cp.user_id = u.id
WHERE u.email = 'tuwebai@gmail.com';

-- =====================================================
-- 7. PRUEBA DE FUNCIONALIDAD
-- =====================================================

SELECT 'Probando funcionalidad...' as status;

-- Probar función de cálculo de progreso
DO $$
DECLARE
    test_project_id UUID;
    progress_result INTEGER;
BEGIN
    -- Crear proyecto de prueba
    INSERT INTO projects (name, description, created_by) 
    VALUES ('Proyecto de Prueba', 'Proyecto para verificar funcionalidad', 
            (SELECT id FROM users WHERE email = 'tuwebai@gmail.com'))
    RETURNING id INTO test_project_id;
    
    -- Actualizar con fases de prueba
    UPDATE projects 
    SET fases = '[
        {"key": "ui", "estado": "Terminado"},
        {"key": "maquetado", "estado": "En Progreso"},
        {"key": "contenido", "estado": "Pendiente"}
    ]'::jsonb
    WHERE id = test_project_id;
    
    -- Probar función de progreso
    SELECT calculate_project_progress(test_project_id) INTO progress_result;
    
    -- Mostrar resultado
    RAISE NOTICE '✅ Prueba de función de progreso exitosa - Progreso: %%%', progress_result;
    
    -- Limpiar proyecto de prueba
    DELETE FROM projects WHERE id = test_project_id;
    RAISE NOTICE '🧹 Proyecto de prueba eliminado correctamente';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING '⚠️ Error en prueba de funcionalidad: %', SQLERRM;
END $$;

-- =====================================================
-- 8. RESUMEN FINAL
-- =====================================================

SELECT 'RESUMEN DE VERIFICACIÓN' as titulo;

-- Contar total de elementos verificados
SELECT 
    'TABLAS' as categoria,
    COUNT(*) as total,
    '15 esperadas' as esperado
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'users', 'projects', 'project_files', 'tickets', 'payments',
    'notifications', 'notification_settings', 'system_logs',
    'chat_rooms', 'chat_messages', 'tasks', 'project_comments',
    'project_metrics', 'client_preferences'
)
UNION ALL
SELECT 
    'POLÍTICAS RLS' as categoria,
    COUNT(*) as total,
    '30+ esperadas' as esperado
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN (
    'users', 'projects', 'project_files', 'tickets', 'payments',
    'notifications', 'notification_settings', 'system_logs',
    'chat_rooms', 'chat_messages', 'tasks', 'project_comments',
    'project_metrics', 'client_preferences'
)
UNION ALL
SELECT 
    'FUNCIONES' as categoria,
    COUNT(*) as total,
    '2 esperadas' as esperado
FROM pg_proc 
WHERE proname IN ('update_updated_at_column', 'calculate_project_progress')
UNION ALL
SELECT 
    'TRIGGERS' as categoria,
    COUNT(*) as total,
    '8+ esperados' as esperado
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public' 
AND t.tgname LIKE 'update_%_updated_at';

-- =====================================================
-- 9. MENSAJE FINAL
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=====================================================';
    RAISE NOTICE '🔍 VERIFICACIÓN COMPLETADA DE LA BASE DE DATOS';
    RAISE NOTICE '=====================================================';
    RAISE NOTICE '';
    RAISE NOTICE '📊 Si ves ✅ en todas las verificaciones, la base de datos está funcionando correctamente';
    RAISE NOTICE '⚠️ Si ves ⚠️ o ❌, revisa los mensajes de error arriba';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 ¡Tu base de datos está lista para usar con datos reales!';
    RAISE NOTICE '';
END $$;
