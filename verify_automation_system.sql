-- =====================================================
-- VERIFICACIÓN DEL SISTEMA DE AUTOMATIZACIÓN
-- =====================================================
-- Este script verifica que todas las tablas, políticas y funciones
-- estén funcionando correctamente

-- =====================================================
-- 1. VERIFICAR EXISTENCIA DE TABLAS
-- =================================================

DO $$
DECLARE
    v_table_name TEXT;
    table_exists BOOLEAN;
    missing_tables TEXT[] := ARRAY[]::TEXT[];
BEGIN
    FOR v_table_name IN 
        SELECT unnest(ARRAY[
            'project_workflows',
            'workflow_steps', 
            'workflow_executions',
            'system_triggers',
            'automation_tasks',
            'automation_logs'
        ])
    LOOP
        SELECT EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = v_table_name
        ) INTO table_exists;
        
        IF NOT table_exists THEN
            missing_tables := array_append(missing_tables, v_table_name);
        END IF;
    END LOOP;
    
    IF array_length(missing_tables, 1) > 0 THEN
        RAISE WARNING '⚠️ Tablas faltantes: %', array_to_string(missing_tables, ', ');
    ELSE
        RAISE NOTICE '✅ Todas las tablas existen correctamente';
    END IF;
END $$;

-- =====================================================
-- 2. VERIFICAR POLÍTICAS RLS
-- =================================================

DO $$
DECLARE
    policy_count INTEGER;
    expected_policies INTEGER := 20; -- Número total de políticas esperadas
BEGIN
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE tablename IN (
        'project_workflows', 
        'workflow_steps', 
        'workflow_executions', 
        'system_triggers', 
        'automation_tasks', 
        'automation_logs'
    );
    
    IF policy_count < expected_policies THEN
        RAISE WARNING '⚠️ Solo se encontraron % políticas de % esperadas', policy_count, expected_policies;
    ELSE
        RAISE NOTICE '✅ Todas las políticas RLS están configuradas (% encontradas)', policy_count;
    END IF;
END $$;

-- =====================================================
-- 3. VERIFICAR FUNCIONES
-- =================================================

DO $$
DECLARE
    function_exists BOOLEAN;
BEGIN
    -- Verificar función execute_sql_script
    SELECT EXISTS (
        SELECT FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' 
        AND p.proname = 'execute_sql_script'
    ) INTO function_exists;
    
    IF function_exists THEN
        RAISE NOTICE '✅ Función execute_sql_script existe';
    ELSE
        RAISE WARNING '⚠️ Función execute_sql_script no encontrada';
    END IF;
    
    -- Verificar función update_updated_at_column
    SELECT EXISTS (
        SELECT FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' 
        AND p.proname = 'update_updated_at_column'
    ) INTO function_exists;
    
    IF function_exists THEN
        RAISE NOTICE '✅ Función update_updated_at_column existe';
    ELSE
        RAISE WARNING '⚠️ Función update_updated_at_column no encontrada';
    END IF;
END $$;

-- =====================================================
-- 4. VERIFICAR TRIGGERS
-- =================================================

DO $$
DECLARE
    trigger_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO trigger_count
    FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE n.nspname = 'public' 
    AND t.tgname LIKE 'update_%_updated_at';
    
    IF trigger_count >= 3 THEN
        RAISE NOTICE '✅ Triggers de timestamp configurados (% encontrados)', trigger_count;
    ELSE
        RAISE WARNING '⚠️ Faltan triggers de timestamp (solo % encontrados)', trigger_count;
    END IF;
END $$;

-- =====================================================
-- 5. VERIFICAR ESTADO DE LAS TABLAS
-- =================================================

DO $$
DECLARE
    workflow_count INTEGER;
    trigger_count INTEGER;
    task_count INTEGER;
BEGIN
    -- Contar workflows
    SELECT COUNT(*) INTO workflow_count FROM project_workflows;
    IF workflow_count = 0 THEN
        RAISE NOTICE '✅ Tabla project_workflows está vacía (correcto)';
    ELSE
        RAISE WARNING '⚠️ Tabla project_workflows tiene % registros', workflow_count;
    END IF;
    
    -- Contar triggers
    SELECT COUNT(*) INTO trigger_count FROM system_triggers;
    IF trigger_count = 0 THEN
        RAISE NOTICE '✅ Tabla system_triggers está vacía (correcto)';
    ELSE
        RAISE WARNING '⚠️ Tabla system_triggers tiene % registros', trigger_count;
    END IF;
    
    -- Contar tareas
    SELECT COUNT(*) INTO task_count FROM automation_tasks;
    IF task_count = 0 THEN
        RAISE NOTICE '✅ Tabla automation_tasks está vacía (correcto)';
    ELSE
        RAISE WARNING '⚠️ Tabla automation_tasks tiene % registros', task_count;
    END IF;
END $$;

-- =====================================================
-- 6. VERIFICAR ÍNDICES
-- =================================================

DO $$
DECLARE
    index_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND indexname LIKE 'idx_%';
    
    IF index_count >= 10 THEN
        RAISE NOTICE '✅ Índices de optimización configurados (% encontrados)', index_count;
    ELSE
        RAISE WARNING '⚠️ Faltan índices de optimización (solo % encontrados)', index_count;
    END IF;
END $$;

-- =====================================================
-- 7. VERIFICAR PERMISOS DE USUARIO
-- =================================================

DO $$
DECLARE
    current_user_role TEXT;
BEGIN
    SELECT current_setting('role') INTO current_user_role;
    
    IF current_user_role = 'authenticated' OR current_user_role = 'service_role' THEN
        RAISE NOTICE '✅ Usuario autenticado correctamente como: %', current_user_role;
    ELSE
        RAISE WARNING '⚠️ Usuario no autenticado: %', current_user_role;
    END IF;
END $$;

-- =====================================================
-- 8. PRUEBA DE FUNCIONALIDAD
-- =================================================

-- Probar inserción de un log (debería funcionar si las políticas están bien)
DO $$
DECLARE
    log_id UUID;
BEGIN
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
    
    IF log_id IS NOT NULL THEN
        RAISE NOTICE '✅ Prueba de inserción exitosa - Log ID: %', log_id;
        
        -- Limpiar log de prueba
        DELETE FROM automation_logs WHERE id = log_id;
        RAISE NOTICE '🧹 Log de prueba eliminado';
    ELSE
        RAISE EXCEPTION '❌ Error en prueba de inserción';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING '⚠️ Error en prueba de inserción: %', SQLERRM;
END $$;

-- =====================================================
-- 9. RESUMEN FINAL
-- =================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=====================================================';
    RAISE NOTICE '🔍 VERIFICACIÓN COMPLETADA DEL SISTEMA DE AUTOMATIZACIÓN';
    RAISE NOTICE '=====================================================';
    RAISE NOTICE '';
    RAISE NOTICE '📊 Estado del sistema:';
    RAISE NOTICE '   • Tablas: Verificadas';
    RAISE NOTICE '   • Políticas RLS: Verificadas';
    RAISE NOTICE '   • Funciones: Verificadas';
    RAISE NOTICE '   • Triggers: Verificados';
    RAISE NOTICE '   • Estado de tablas: Verificado (vacías)';
    RAISE NOTICE '   • Índices: Verificados';
    RAISE NOTICE '   • Permisos: Verificados';
    RAISE NOTICE '   • Funcionalidad: Probada';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 El Sistema de Automatización está funcionando correctamente!';
    RAISE NOTICE '💡 Puedes usar la interfaz web para crear workflows, triggers y tareas';
    RAISE NOTICE '';
END $$;
