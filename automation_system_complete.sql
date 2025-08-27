-- =====================================================
-- SISTEMA DE AUTOMATIZACIÓN COMPLETO - SCRIPT SQL
-- =====================================================
-- Este script configura todas las tablas, políticas RLS y funciones
-- necesarias para el Sistema de Automatización de TuWebAI

-- =====================================================
-- 1. CREAR TABLAS DEL SISTEMA DE AUTOMATIZACIÓN
-- =====================================================

-- Tabla de Workflows de Proyectos
CREATE TABLE IF NOT EXISTS project_workflows (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    project_type VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Tabla de Pasos de Workflow
CREATE TABLE IF NOT EXISTS workflow_steps (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    workflow_id UUID REFERENCES project_workflows(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL,
    order_index INTEGER NOT NULL,
    conditions JSONB,
    actions JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de Ejecuciones de Workflow
CREATE TABLE IF NOT EXISTS workflow_executions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    workflow_id UUID REFERENCES project_workflows(id) ON DELETE CASCADE,
    project_id UUID,
    status VARCHAR(50) DEFAULT 'pending',
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    result JSONB,
    error_message TEXT,
    execution_time_ms INTEGER,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Tabla de Triggers del Sistema
CREATE TABLE IF NOT EXISTS system_triggers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    event_type VARCHAR(100) NOT NULL,
    conditions JSONB,
    actions JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    trigger_count INTEGER DEFAULT 0,
    last_triggered TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Tabla de Tareas Automatizadas
CREATE TABLE IF NOT EXISTS automation_tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(100) NOT NULL,
    script TEXT NOT NULL,
    script_type VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    run_count INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    last_run TIMESTAMP WITH TIME ZONE,
    next_run TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Tabla de Logs de Automatización
CREATE TABLE IF NOT EXISTS automation_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    automation_type VARCHAR(50) NOT NULL,
    automation_id UUID,
    action VARCHAR(255) NOT NULL,
    message TEXT,
    status VARCHAR(50) NOT NULL,
    execution_time_ms INTEGER,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- =====================================================
-- 2. CREAR ÍNDICES PARA OPTIMIZAR CONSULTAS
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_workflows_active ON project_workflows(is_active);
CREATE INDEX IF NOT EXISTS idx_workflows_type ON project_workflows(project_type);
CREATE INDEX IF NOT EXISTS idx_workflow_steps_workflow ON workflow_steps(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_status ON workflow_executions(status);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_workflow ON workflow_executions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_triggers_active ON system_triggers(is_active);
CREATE INDEX IF NOT EXISTS idx_triggers_event_type ON system_triggers(event_type);
CREATE INDEX IF NOT EXISTS idx_tasks_active ON automation_tasks(is_active);
CREATE INDEX IF NOT EXISTS idx_tasks_next_run ON automation_tasks(next_run);
CREATE INDEX IF NOT EXISTS idx_logs_type ON automation_logs(automation_type);
CREATE INDEX IF NOT EXISTS idx_logs_created_at ON automation_logs(created_at);

-- =====================================================
-- 3. CREAR FUNCIONES NECESARIAS
-- =====================================================

-- Función para ejecutar scripts SQL
CREATE OR REPLACE FUNCTION execute_sql_script(script TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSONB;
    start_time TIMESTAMP;
    end_time TIMESTAMP;
BEGIN
    start_time := NOW();
    
    -- Ejecutar el script SQL
    EXECUTE script;
    
    end_time := NOW();
    
    result := jsonb_build_object(
        'success', true,
        'execution_time_ms', EXTRACT(EPOCH FROM (end_time - start_time)) * 1000,
        'message', 'Script ejecutado exitosamente'
    );
    
    RETURN result;
EXCEPTION
    WHEN OTHERS THEN
        result := jsonb_build_object(
            'success', false,
            'error', SQLERRM,
            'execution_time_ms', EXTRACT(EPOCH FROM (NOW() - start_time)) * 1000
        );
        RETURN result;
END;
$$;

-- Función para actualizar timestamp de actualización
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- =====================================================
-- 4. CREAR TRIGGERS PARA ACTUALIZAR TIMESTAMPS
-- =====================================================

CREATE TRIGGER update_workflows_updated_at 
    BEFORE UPDATE ON project_workflows 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_triggers_updated_at 
    BEFORE UPDATE ON system_triggers 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at 
    BEFORE UPDATE ON automation_tasks 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 5. CONFIGURAR POLÍTICAS RLS (ROW LEVEL SECURITY)
-- =====================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE project_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_triggers ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_logs ENABLE ROW LEVEL SECURITY;

-- Políticas para project_workflows
DROP POLICY IF EXISTS "Users can view all workflows" ON project_workflows;
CREATE POLICY "Users can view all workflows" ON project_workflows
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can create workflows" ON project_workflows;
CREATE POLICY "Authenticated users can create workflows" ON project_workflows
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can update their own workflows" ON project_workflows;
CREATE POLICY "Users can update their own workflows" ON project_workflows
    FOR UPDATE USING (auth.uid() = created_by OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Users can delete their own workflows" ON project_workflows;
CREATE POLICY "Users can delete their own workflows" ON project_workflows
    FOR DELETE USING (auth.uid() = created_by OR auth.role() = 'service_role');

-- Políticas para workflow_steps
DROP POLICY IF EXISTS "Users can view workflow steps" ON workflow_steps;
CREATE POLICY "Users can view workflow steps" ON workflow_steps
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can manage workflow steps" ON workflow_steps;
CREATE POLICY "Authenticated users can manage workflow steps" ON workflow_steps
    FOR ALL USING (auth.role() = 'authenticated');

-- Políticas para workflow_executions
DROP POLICY IF EXISTS "Users can view workflow executions" ON workflow_executions;
CREATE POLICY "Users can view workflow executions" ON workflow_executions
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can create workflow executions" ON workflow_executions;
CREATE POLICY "Authenticated users can create workflow executions" ON workflow_executions
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can update workflow executions" ON workflow_executions;
CREATE POLICY "Users can update workflow executions" ON workflow_executions
    FOR UPDATE USING (auth.uid() = created_by OR auth.role() = 'service_role');

-- Políticas para system_triggers
DROP POLICY IF EXISTS "Users can view all triggers" ON system_triggers;
CREATE POLICY "Users can view all triggers" ON system_triggers
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can create triggers" ON system_triggers;
CREATE POLICY "Authenticated users can create triggers" ON system_triggers
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can update their own triggers" ON system_triggers;
CREATE POLICY "Users can update their own triggers" ON system_triggers
    FOR UPDATE USING (auth.uid() = created_by OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Users can delete their own triggers" ON system_triggers;
CREATE POLICY "Users can delete their own triggers" ON system_triggers
    FOR DELETE USING (auth.uid() = created_by OR auth.role() = 'service_role');

-- Políticas para automation_tasks
DROP POLICY IF EXISTS "Users can view all tasks" ON automation_tasks;
CREATE POLICY "Users can view all tasks" ON automation_tasks
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can create tasks" ON automation_tasks;
CREATE POLICY "Authenticated users can create tasks" ON automation_tasks
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can update their own tasks" ON automation_tasks;
CREATE POLICY "Users can update their own tasks" ON automation_tasks
    FOR UPDATE USING (auth.uid() = created_by OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Users can delete their own tasks" ON automation_tasks;
CREATE POLICY "Users can delete their own tasks" ON automation_tasks
    FOR DELETE USING (auth.uid() = created_by OR auth.role() = 'service_role');

-- Políticas para automation_logs
DROP POLICY IF EXISTS "Users can view all logs" ON automation_logs;
CREATE POLICY "Users can view all logs" ON automation_logs
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can create logs" ON automation_logs;
CREATE POLICY "Authenticated users can create logs" ON automation_logs
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- =====================================================
-- 6. SISTEMA LISTO PARA USO
-- =================================================

-- El sistema está configurado y listo para usar
-- Las tablas están vacías y esperando datos reales
-- Las políticas RLS están configuradas para seguridad
-- Las funciones y triggers están listos para funcionar

-- Las tablas están completamente vacías y listas para datos reales

-- =====================================================
-- 7. VERIFICAR CONFIGURACIÓN
-- =====================================================

-- Verificar que las tablas se crearon correctamente
SELECT 
    'project_workflows' as table_name,
    COUNT(*) as record_count
FROM project_workflows
UNION ALL
SELECT 
    'system_triggers' as table_name,
    COUNT(*) as record_count
FROM system_triggers
UNION ALL
SELECT 
    'automation_tasks' as table_name,
    COUNT(*) as record_count
FROM automation_tasks;

-- Verificar políticas RLS
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
WHERE tablename IN ('project_workflows', 'workflow_steps', 'workflow_executions', 'system_triggers', 'automation_tasks', 'automation_logs')
ORDER BY tablename, policyname;

-- =====================================================
-- 8. MENSAJE DE CONFIRMACIÓN
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Sistema de Automatización configurado exitosamente!';
    RAISE NOTICE '📊 Tablas creadas: project_workflows, workflow_steps, workflow_executions, system_triggers, automation_tasks, automation_logs';
    RAISE NOTICE '🔒 Políticas RLS configuradas para todas las tablas';
    RAISE NOTICE '⚡ Función execute_sql_script creada para ejecutar tareas SQL';
    RAISE NOTICE '📝 Tablas vacías y listas para datos reales';
    RAISE NOTICE '🚀 El sistema está listo para usar!';
END $$;
