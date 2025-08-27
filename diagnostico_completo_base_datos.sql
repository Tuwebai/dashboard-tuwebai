-- =====================================================
-- DIAGNÓSTICO COMPLETO DE BASE DE DATOS - TUWEBAI
-- =====================================================
-- Este script verifica TODAS las tablas y columnas existentes
-- Úsalo para diagnosticar problemas antes de crear/actualizar tablas

-- =====================================================
-- 1. VERIFICAR EXTENSIONES INSTALADAS
-- =====================================================

SELECT 'EXTENSIONES INSTALADAS' as seccion;
SELECT 
    extname as nombre_extension,
    extversion as version,
    extrelocatable as reubicable
FROM pg_extension 
WHERE extnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
ORDER BY extname;

-- =====================================================
-- 2. LISTAR TODAS LAS TABLAS EXISTENTES
-- =====================================================

SELECT 'TABLAS EXISTENTES' as seccion;
SELECT 
    schemaname,
    tablename,
    tableowner,
    tablespace,
    hasindexes,
    hasrules,
    hastriggers,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- =====================================================
-- 3. VERIFICAR ESTRUCTURA DE CADA TABLA
-- =====================================================

SELECT 'ESTRUCTURA DE TABLAS' as seccion;

-- Función para obtener estructura detallada de una tabla
CREATE OR REPLACE FUNCTION get_table_structure(p_table_name text)
RETURNS TABLE (
    column_name text,
    data_type text,
    is_nullable text,
    column_default text,
    character_maximum_length text,
    numeric_precision text,
    numeric_scale text,
    is_primary_key boolean,
    is_foreign_key boolean,
    foreign_table text,
    foreign_column text
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.column_name::text,
        c.data_type::text,
        c.is_nullable::text,
        c.column_default::text,
        COALESCE(c.character_maximum_length::text, 'N/A'),
        COALESCE(c.numeric_precision::text, 'N/A'),
        COALESCE(c.numeric_scale::text, 'N/A'),
        CASE WHEN pk.column_name IS NOT NULL THEN true ELSE false END as is_primary_key,
        CASE WHEN fk.column_name IS NOT NULL THEN true ELSE false END as is_foreign_key,
        COALESCE(fk.foreign_table_name::text, ''),
        COALESCE(fk.foreign_column_name::text, '')
    FROM information_schema.columns c
    LEFT JOIN (
        SELECT kcu.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu 
            ON tc.constraint_name = kcu.constraint_name
        WHERE tc.constraint_type = 'PRIMARY KEY' 
            AND tc.table_name = p_table_name
    ) pk ON c.column_name = pk.column_name
    LEFT JOIN (
        SELECT 
            kcu.column_name,
            ccu.table_name as foreign_table_name,
            ccu.column_name as foreign_column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu 
            ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage ccu 
            ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY' 
            AND tc.table_name = p_table_name
    ) fk ON c.column_name = fk.column_name
    WHERE c.table_name = p_table_name
    ORDER BY c.ordinal_position;
END;
$$ LANGUAGE plpgsql;

-- Obtener estructura de todas las tablas
DO $$
DECLARE
    table_record RECORD;
BEGIN
    FOR table_record IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
        ORDER BY tablename
    LOOP
        RAISE NOTICE '';
        RAISE NOTICE '=====================================================';
        RAISE NOTICE 'TABLA: %', table_record.tablename;
        RAISE NOTICE '=====================================================';
        
        -- Mostrar estructura de la tabla
        PERFORM column_name, data_type, is_nullable, column_default, 
                character_maximum_length, numeric_precision, numeric_scale,
                is_primary_key, is_foreign_key, foreign_table, foreign_column
        FROM get_table_structure(table_record.tablename);
    END LOOP;
END $$;

-- =====================================================
-- 4. VERIFICAR ÍNDICES EXISTENTES
-- =====================================================

SELECT 'ÍNDICES EXISTENTES' as seccion;
SELECT 
    t.tablename,
    i.indexname,
    i.indexdef,
    i.indexdef as definicion_completa
FROM pg_indexes i
JOIN pg_tables t ON i.tablename = t.tablename
WHERE t.schemaname = 'public'
ORDER BY t.tablename, i.indexname;

-- =====================================================
-- 5. VERIFICAR TRIGGERS EXISTENTES
-- =====================================================

SELECT 'TRIGGERS EXISTENTES' as seccion;
SELECT 
    t.tablename,
    tr.trigger_name,
    tr.event_manipulation,
    tr.action_timing,
    tr.action_statement,
    tr.action_orientation
FROM information_schema.triggers tr
JOIN pg_tables t ON tr.event_object_table = t.tablename
WHERE t.schemaname = 'public'
ORDER BY t.tablename, tr.trigger_name;

-- =====================================================
-- 6. VERIFICAR FUNCIONES EXISTENTES
-- =====================================================

SELECT 'FUNCIONES EXISTENTES' as seccion;
SELECT 
    p.proname as nombre_funcion,
    pg_get_function_result(p.oid) as tipo_retorno,
    pg_get_function_arguments(p.oid) as argumentos,
    l.lanname as lenguaje
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
JOIN pg_language l ON p.prolang = l.oid
WHERE n.nspname = 'public'
ORDER BY p.proname;

-- =====================================================
-- 7. VERIFICAR POLÍTICAS RLS EXISTENTES
-- =====================================================

SELECT 'POLÍTICAS RLS EXISTENTES' as seccion;
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- =====================================================
-- 8. VERIFICAR CONSTRAINTS EXISTENTES
-- =====================================================

SELECT 'CONSTRAINTS EXISTENTES' as seccion;
SELECT 
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.is_deferrable,
    tc.initially_deferred
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
LEFT JOIN information_schema.constraint_column_usage ccu 
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_schema = 'public'
ORDER BY tc.table_name, tc.constraint_name;

-- =====================================================
-- 9. VERIFICAR SECUENCIAS EXISTENTES
-- =====================================================

SELECT 'SECUENCIAS EXISTENTES' as seccion;
SELECT 
    sequence_name,
    data_type,
    start_value,
    minimum_value,
    maximum_value,
    increment,
    cycle_option
FROM information_schema.sequences 
WHERE sequence_schema = 'public'
ORDER BY sequence_name;

-- =====================================================
-- 10. VERIFICAR VISTAS EXISTENTES
-- =====================================================

SELECT 'VISTAS EXISTENTES' as seccion;
SELECT 
    table_name,
    view_definition
FROM information_schema.views 
WHERE table_schema = 'public'
ORDER BY table_name;

-- =====================================================
-- 11. VERIFICAR PERMISOS DE USUARIOS
-- =====================================================

SELECT 'PERMISOS DE USUARIOS' as seccion;
SELECT 
    grantee,
    table_name,
    privilege_type,
    is_grantable
FROM information_schema.table_privileges 
WHERE table_schema = 'public'
ORDER BY grantee, table_name, privilege_type;

-- =====================================================
-- 12. VERIFICAR ESTADO DE RLS EN TABLAS
-- =====================================================

SELECT 'ESTADO DE RLS EN TABLAS' as seccion;
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_habilitado
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- =====================================================
-- 13. VERIFICAR TAMAÑO DE TABLAS
-- =====================================================

SELECT 'TAMAÑO DE TABLAS' as seccion;
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as tamaño_total,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as tamaño_tabla,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) as tamaño_indices
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- =====================================================
-- 14. VERIFICAR ESTADÍSTICAS DE TABLAS
-- =====================================================

SELECT 'ESTADÍSTICAS DE TABLAS' as seccion;
SELECT 
    schemaname,
    tablename,
    n_tup_ins as inserciones,
    n_tup_upd as actualizaciones,
    n_tup_del as eliminaciones,
    n_live_tup as filas_vivas,
    n_dead_tup as filas_muertas,
    last_vacuum,
    last_autovacuum,
    last_analyze,
    last_autoanalyze
FROM pg_stat_user_tables 
ORDER BY schemaname, tablename;

-- =====================================================
-- 15. RESUMEN FINAL
-- =====================================================

SELECT 'RESUMEN FINAL' as seccion;

-- Contar total de elementos
SELECT 
    'TABLAS' as tipo,
    COUNT(*) as cantidad
FROM pg_tables 
WHERE schemaname = 'public'
UNION ALL
SELECT 
    'ÍNDICES' as tipo,
    COUNT(*) as cantidad
FROM pg_indexes 
WHERE schemaname = 'public'
UNION ALL
SELECT 
    'TRIGGERS' as tipo,
    COUNT(*) as cantidad
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
UNION ALL
SELECT 
    'FUNCIONES' as tipo,
    COUNT(*) as cantidad
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
UNION ALL
SELECT 
    'POLÍTICAS RLS' as tipo,
    COUNT(*) as cantidad
FROM pg_policies 
WHERE schemaname = 'public';

-- =====================================================
-- 16. VERIFICAR PROBLEMAS COMUNES
-- =====================================================

SELECT 'VERIFICACIÓN DE PROBLEMAS' as seccion;

-- Verificar tablas sin RLS habilitado
SELECT 
    'TABLAS SIN RLS' as problema,
    tablename as tabla
FROM pg_tables 
WHERE schemaname = 'public' 
    AND NOT rowsecurity
    AND tablename NOT IN ('schema_migrations', 'ar_internal_metadata') -- Tablas del sistema
UNION ALL
-- Verificar tablas sin índices
SELECT 
    'TABLAS SIN ÍNDICES' as problema,
    t.tablename as tabla
FROM pg_tables t
LEFT JOIN pg_indexes i ON t.tablename = i.tablename
WHERE t.schemaname = 'public' 
    AND i.indexname IS NULL
    AND t.tablename NOT IN ('schema_migrations', 'ar_internal_metadata')
UNION ALL
-- Verificar tablas sin políticas RLS
SELECT 
    'TABLAS SIN POLÍTICAS RLS' as problema,
    t.tablename as tabla
FROM pg_tables t
LEFT JOIN pg_policies p ON t.tablename = p.tablename
WHERE t.schemaname = 'public' 
    AND t.rowsecurity = true
    AND p.policyname IS NULL
    AND t.tablename NOT IN ('schema_migrations', 'ar_internal_metadata');

-- =====================================================
-- MENSAJE DE FINALIZACIÓN
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=====================================================';
    RAISE NOTICE '✅ DIAGNÓSTICO COMPLETO FINALIZADO';
    RAISE NOTICE '=====================================================';
    RAISE NOTICE '';
    RAISE NOTICE '📊 Revisa todos los resultados anteriores para:';
    RAISE NOTICE '   • Identificar tablas faltantes';
    RAISE NOTICE '   • Verificar columnas existentes';
    RAISE NOTICE '   • Detectar problemas de estructura';
    RAISE NOTICE '   • Validar políticas RLS';
    RAISE NOTICE '   • Comprobar índices y triggers';
    RAISE NOTICE '';
    RAISE NOTICE '🔧 Con esta información podrás crear el script correcto';
    RAISE NOTICE '';
END $$;
