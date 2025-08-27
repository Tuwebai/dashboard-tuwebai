-- =====================================================
-- SISTEMA DE AUTOMATIZACIÓN COMPLETO - SETUP COMPLETO
-- =====================================================

-- Verificar si las tablas existen y crearlas si no
DO $$ 
BEGIN
    -- Crear tabla de workflows para proyectos
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'project_workflows') THEN
        CREATE TABLE project_workflows (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR(255) NOT NULL,
            description TEXT,
            project_type VARCHAR(100),
            is_active BOOLEAN DEFAULT true,
            created_by UUID REFERENCES auth.users(id),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        RAISE NOTICE 'Tabla project_workflows creada';
    END IF;

    -- Crear tabla de pasos del workflow
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'workflow_steps') THEN
        CREATE TABLE workflow_steps (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            workflow_id UUID REFERENCES project_workflows(id) ON DELETE CASCADE,
            name VARCHAR(255) NOT NULL,
            type VARCHAR(100) NOT NULL CHECK (type IN ('approval', 'notification', 'status_change', 'email', 'assignment', 'condition')),
            order_index INTEGER NOT NULL,
            conditions JSONB DEFAULT '{}',
            actions JSONB DEFAULT '{}',
            timeout_seconds INTEGER DEFAULT 3600,
            retry_count INTEGER DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        RAISE NOTICE 'Tabla workflow_steps creada';
    END IF;

    -- Crear tabla de triggers del sistema
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'system_triggers') THEN
        CREATE TABLE system_triggers (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR(255) NOT NULL,
            description TEXT,
            event_type VARCHAR(100) NOT NULL CHECK (event_type IN (
                'project_created', 'project_status_changed', 'project_deadline_approaching',
                'ticket_created', 'ticket_priority_changed', 'ticket_status_changed',
                'payment_received', 'payment_failed', 'user_registered', 'user_role_changed'
            )),
            conditions JSONB DEFAULT '{}',
            actions JSONB DEFAULT '{}',
            is_active BOOLEAN DEFAULT true,
            schedule VARCHAR(100), -- Cron expression
            last_triggered TIMESTAMP WITH TIME ZONE,
            trigger_count INTEGER DEFAULT 0,
            created_by UUID REFERENCES auth.users(id),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        RAISE NOTICE 'Tabla system_triggers creada';
    END IF;

    -- Crear tabla de tareas automatizadas
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'automation_tasks') THEN
        CREATE TABLE automation_tasks (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR(255) NOT NULL,
            description TEXT,
            type VARCHAR(50) NOT NULL CHECK (type IN ('daily', 'weekly', 'monthly', 'on_event', 'custom')),
            script TEXT,
            script_type VARCHAR(50) DEFAULT 'sql', -- sql, javascript, shell
            parameters JSONB DEFAULT '{}',
            last_run TIMESTAMP WITH TIME ZONE,
            next_run TIMESTAMP WITH TIME ZONE,
            run_count INTEGER DEFAULT 0,
            success_count INTEGER DEFAULT 0,
            error_count INTEGER DEFAULT 0,
            last_error TEXT,
            is_active BOOLEAN DEFAULT true,
            created_by UUID REFERENCES auth.users(id),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        RAISE NOTICE 'Tabla automation_tasks creada';
    END IF;

    -- Crear tabla de pipelines CI/CD
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'ci_cd_pipelines') THEN
        CREATE TABLE ci_cd_pipelines (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR(255) NOT NULL,
            description TEXT,
            project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
            repository_url VARCHAR(500),
            branch VARCHAR(100) DEFAULT 'main',
            stages JSONB DEFAULT '[]',
            triggers JSONB DEFAULT '[]',
            status VARCHAR(50) DEFAULT 'idle' CHECK (status IN ('idle', 'running', 'success', 'failed', 'cancelled')),
            current_stage VARCHAR(100),
            started_at TIMESTAMP WITH TIME ZONE,
            completed_at TIMESTAMP WITH TIME ZONE,
            duration_seconds INTEGER,
            is_active BOOLEAN DEFAULT true,
            created_by UUID REFERENCES auth.users(id),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        RAISE NOTICE 'Tabla ci_cd_pipelines creada';
    END IF;

    -- Crear tabla de ejecuciones de workflows
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'workflow_executions') THEN
        CREATE TABLE workflow_executions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            workflow_id UUID REFERENCES project_workflows(id) ON DELETE CASCADE,
            project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
            status VARCHAR(50) DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'cancelled')),
            current_step_id UUID REFERENCES workflow_steps(id),
            step_results JSONB DEFAULT '[]',
            started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            completed_at TIMESTAMP WITH TIME ZONE,
            duration_seconds INTEGER,
            error_message TEXT,
            created_by UUID REFERENCES auth.users(id)
        );
        RAISE NOTICE 'Tabla workflow_executions creada';
    END IF;

    -- Crear tabla de logs de automatización
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'automation_logs') THEN
        CREATE TABLE automation_logs (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            automation_type VARCHAR(50) NOT NULL CHECK (automation_type IN ('workflow', 'trigger', 'task', 'pipeline')),
            automation_id UUID NOT NULL,
            action VARCHAR(100) NOT NULL,
            status VARCHAR(50) NOT NULL CHECK (status IN ('success', 'error', 'warning', 'info')),
            message TEXT,
            details JSONB DEFAULT '{}',
            execution_time_ms INTEGER,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        RAISE NOTICE 'Tabla automation_logs creada';
    END IF;

    -- Crear tabla de reportes programados
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'scheduled_reports') THEN
        CREATE TABLE scheduled_reports (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR(255) NOT NULL,
            description TEXT,
            template_id VARCHAR(100),
            schedule VARCHAR(100) NOT NULL, -- Cron expression
            recipients JSONB DEFAULT '[]',
            format VARCHAR(20) DEFAULT 'pdf' CHECK (format IN ('pdf', 'excel', 'html', 'csv')),
            parameters JSONB DEFAULT '{}',
            last_generated TIMESTAMP WITH TIME ZONE,
            next_generation TIMESTAMP WITH TIME ZONE,
            generation_count INTEGER DEFAULT 0,
            is_active BOOLEAN DEFAULT true,
            created_by UUID REFERENCES auth.users(id),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        RAISE NOTICE 'Tabla scheduled_reports creada';
    END IF;

END $$;

-- =====================================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- =====================================================

-- Índices para workflows
CREATE INDEX IF NOT EXISTS idx_project_workflows_active ON project_workflows(is_active);
CREATE INDEX IF NOT EXISTS idx_project_workflows_type ON project_workflows(project_type);
CREATE INDEX IF NOT EXISTS idx_project_workflows_created_by ON project_workflows(created_by);

-- Índices para pasos de workflow
CREATE INDEX IF NOT EXISTS idx_workflow_steps_workflow_id ON workflow_steps(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_steps_order ON workflow_steps(workflow_id, order_index);

-- Índices para triggers
CREATE INDEX IF NOT EXISTS idx_system_triggers_event_type ON system_triggers(event_type);
CREATE INDEX IF NOT EXISTS idx_system_triggers_active ON system_triggers(is_active);
CREATE INDEX IF NOT EXISTS idx_system_triggers_schedule ON system_triggers(schedule);

-- Índices para tareas automatizadas
CREATE INDEX IF NOT EXISTS idx_automation_tasks_type ON automation_tasks(type);
CREATE INDEX IF NOT EXISTS idx_automation_tasks_next_run ON automation_tasks(next_run);
CREATE INDEX IF NOT EXISTS idx_automation_tasks_active ON automation_tasks(is_active);

-- Índices para pipelines
CREATE INDEX IF NOT EXISTS idx_ci_cd_pipelines_project_id ON ci_cd_pipelines(project_id);
CREATE INDEX IF NOT EXISTS idx_ci_cd_pipelines_status ON ci_cd_pipelines(status);
CREATE INDEX IF NOT EXISTS idx_ci_cd_pipelines_active ON ci_cd_pipelines(is_active);

-- Índices para ejecuciones
CREATE INDEX IF NOT EXISTS idx_workflow_executions_workflow_id ON workflow_executions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_project_id ON workflow_executions(project_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_status ON workflow_executions(status);

-- Índices para logs
CREATE INDEX IF NOT EXISTS idx_automation_logs_type ON automation_logs(automation_type);
CREATE INDEX IF NOT EXISTS idx_automation_logs_automation_id ON automation_logs(automation_id);
CREATE INDEX IF NOT EXISTS idx_automation_logs_created_at ON automation_logs(created_at);

-- Índices para reportes programados
CREATE INDEX IF NOT EXISTS idx_scheduled_reports_schedule ON scheduled_reports(schedule);
CREATE INDEX IF NOT EXISTS idx_scheduled_reports_next_generation ON scheduled_reports(next_generation);
CREATE INDEX IF NOT EXISTS idx_scheduled_reports_active ON scheduled_reports(active);

-- =====================================================
-- POLÍTICAS RLS (ROW LEVEL SECURITY)
-- =====================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE project_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_triggers ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE ci_cd_pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_reports ENABLE ROW LEVEL SECURITY;

-- Políticas para workflows
DROP POLICY IF EXISTS "Users can view workflows" ON project_workflows;
CREATE POLICY "Users can view workflows" ON project_workflows
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admins can manage workflows" ON project_workflows;
CREATE POLICY "Admins can manage workflows" ON project_workflows
  FOR ALL USING (auth.role() = 'admin');

-- Políticas para pasos de workflow
DROP POLICY IF EXISTS "Users can view workflow steps" ON workflow_steps;
CREATE POLICY "Users can view workflow steps" ON workflow_steps
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admins can manage workflow steps" ON workflow_steps;
CREATE POLICY "Admins can manage workflow steps" ON workflow_steps
  FOR ALL USING (auth.role() = 'admin');

-- Políticas para triggers
DROP POLICY IF EXISTS "Users can view triggers" ON system_triggers;
CREATE POLICY "Users can view triggers" ON system_triggers
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admins can manage triggers" ON system_triggers;
CREATE POLICY "Admins can manage triggers" ON system_triggers
  FOR ALL USING (auth.role() = 'admin');

-- Políticas para tareas automatizadas
DROP POLICY IF EXISTS "Users can view automation tasks" ON automation_tasks;
CREATE POLICY "Users can view automation tasks" ON automation_tasks
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admins can manage automation tasks" ON automation_tasks;
CREATE POLICY "Admins can manage automation tasks" ON automation_tasks
  FOR ALL USING (auth.role() = 'admin');

-- Políticas para pipelines
DROP POLICY IF EXISTS "Users can view pipelines" ON ci_cd_pipelines;
CREATE POLICY "Users can view pipelines" ON ci_cd_pipelines
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admins can manage pipelines" ON ci_cd_pipelines;
CREATE POLICY "Admins can manage pipelines" ON ci_cd_pipelines
  FOR ALL USING (auth.role() = 'admin');

-- Políticas para ejecuciones
DROP POLICY IF EXISTS "Users can view workflow executions" ON workflow_executions;
CREATE POLICY "Users can view workflow executions" ON workflow_executions
  FOR SELECT USING (auth.role() = 'authenticated');

-- Políticas para logs
DROP POLICY IF EXISTS "Users can view automation logs" ON automation_logs;
CREATE POLICY "Users can view automation logs" ON automation_logs
  FOR SELECT USING (auth.role() = 'authenticated');

-- Políticas para reportes programados
DROP POLICY IF EXISTS "Users can view scheduled reports" ON scheduled_reports;
CREATE POLICY "Users can view scheduled reports" ON scheduled_reports
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admins can manage scheduled reports" ON scheduled_reports;
CREATE POLICY "Admins can manage scheduled reports" ON scheduled_reports
  FOR ALL USING (auth.role() = 'admin');

-- =====================================================
-- FUNCIONES Y TRIGGERS
-- =====================================================

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
DROP TRIGGER IF EXISTS update_project_workflows_updated_at ON project_workflows;
CREATE TRIGGER update_project_workflows_updated_at 
  BEFORE UPDATE ON project_workflows 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_system_triggers_updated_at ON system_triggers;
CREATE TRIGGER update_system_triggers_updated_at 
  BEFORE UPDATE ON system_triggers 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_automation_tasks_updated_at ON automation_tasks;
CREATE TRIGGER update_automation_tasks_updated_at 
  BEFORE UPDATE ON automation_tasks 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_ci_cd_pipelines_updated_at ON ci_cd_pipelines;
CREATE TRIGGER update_ci_cd_pipelines_updated_at 
  BEFORE UPDATE ON ci_cd_pipelines 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_scheduled_reports_updated_at ON scheduled_reports;
CREATE TRIGGER update_scheduled_reports_updated_at 
  BEFORE UPDATE ON scheduled_reports 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Función para calcular next_run de tareas
CREATE OR REPLACE FUNCTION calculate_next_run()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.type = 'daily' THEN
    NEW.next_run = NOW() + INTERVAL '1 day';
  ELSIF NEW.type = 'weekly' THEN
    NEW.next_run = NOW() + INTERVAL '1 week';
  ELSIF NEW.type = 'monthly' THEN
    NEW.next_run = NOW() + INTERVAL '1 month';
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para calcular next_run
DROP TRIGGER IF EXISTS calculate_automation_task_next_run ON automation_tasks;
CREATE TRIGGER calculate_automation_task_next_run 
  BEFORE INSERT ON automation_tasks 
  FOR EACH ROW EXECUTE FUNCTION calculate_next_run();

-- =====================================================
-- DATOS DE EJEMPLO REALES
-- =====================================================

-- Insertar workflow de ejemplo para proyectos web
INSERT INTO project_workflows (name, description, project_type) VALUES 
('Workflow Básico de Proyecto Web', 'Flujo estándar para proyectos de desarrollo web', 'web_development')
ON CONFLICT DO NOTHING;

-- Insertar pasos del workflow
INSERT INTO workflow_steps (workflow_id, name, type, order_index, actions) 
SELECT 
  w.id,
  'Aprobación Inicial del Cliente',
  'approval',
  1,
  '{"action": "notify_team", "message": "Nuevo proyecto requiere aprobación del cliente", "recipients": ["team"], "priority": "high"}'
FROM project_workflows w 
WHERE w.name = 'Workflow Básico de Proyecto Web'
ON CONFLICT DO NOTHING;

INSERT INTO workflow_steps (workflow_id, name, type, order_index, actions) 
SELECT 
  w.id,
  'Asignación de Desarrollador',
  'assignment',
  2,
  '{"action": "assign_developer", "message": "Asignar desarrollador al proyecto", "role": "developer", "auto_assign": true}'
FROM project_workflows w 
WHERE w.name = 'Workflow Básico de Proyecto Web'
ON CONFLICT DO NOTHING;

INSERT INTO workflow_steps (workflow_id, name, type, order_index, actions) 
SELECT 
  w.id,
  'Notificación de Inicio',
  'notification',
  3,
  '{"action": "send_email", "message": "Proyecto iniciado exitosamente", "template": "project_start", "recipients": ["client", "team"]}'
FROM project_workflows w 
WHERE w.name = 'Workflow Básico de Proyecto Web'
ON CONFLICT DO NOTHING;

-- Insertar trigger de ejemplo para proyectos creados
INSERT INTO system_triggers (name, description, event_type, actions) VALUES 
('Notificar Proyecto Creado', 'Notifica al equipo cuando se crea un nuevo proyecto', 'project_created', 
 '{"action": "send_notification", "recipients": ["team"], "message": "Nuevo proyecto creado: {project_name}", "priority": "medium", "channel": "slack"}')
ON CONFLICT DO NOTHING;

-- Insertar trigger para tickets de alta prioridad
INSERT INTO system_triggers (name, description, event_type, actions) VALUES 
('Escalar Ticket Alta Prioridad', 'Escala automáticamente tickets de alta prioridad', 'ticket_priority_changed', 
 '{"action": "escalate_ticket", "condition": "priority == high", "escalate_to": "manager", "message": "Ticket escalado por alta prioridad"}')
ON CONFLICT DO NOTHING;

-- Insertar tarea automatizada de backup diario
INSERT INTO automation_tasks (name, description, type, script, script_type) VALUES 
('Backup Diario de Base de Datos', 'Crear backup diario de la base de datos del sistema', 'daily', 
 'SELECT pg_dump_database();', 'sql')
ON CONFLICT DO NOTHING;

-- Insertar tarea de limpieza semanal
INSERT INTO automation_tasks (name, description, type, script, script_type) VALUES 
('Limpieza Semanal de Logs', 'Limpiar logs antiguos para optimizar rendimiento', 'weekly', 
 'DELETE FROM automation_logs WHERE created_at < NOW() - INTERVAL ''30 days'';', 'sql')
ON CONFLICT DO NOTHING;

-- Insertar reporte programado semanal
INSERT INTO scheduled_reports (name, description, schedule, recipients, format) VALUES 
('Reporte Semanal de Proyectos', 'Estado semanal de todos los proyectos activos', '0 8 * * 1', 
 '["admin@tuwebai.com", "manager@tuwebai.com"]', 'pdf')
ON CONFLICT DO NOTHING;

-- =====================================================
-- VERIFICACIÓN FINAL
-- =====================================================

-- Verificar que todas las tablas se crearon correctamente
SELECT 
  schemaname,
  tablename,
  tableowner
FROM pg_tables 
WHERE tablename IN (
  'project_workflows',
  'workflow_steps', 
  'system_triggers',
  'automation_tasks',
  'ci_cd_pipelines',
  'workflow_executions',
  'automation_logs',
  'scheduled_reports'
)
ORDER BY tablename;

-- Mostrar estadísticas de las tablas
SELECT 
  'project_workflows' as table_name,
  COUNT(*) as record_count
FROM project_workflows
UNION ALL
SELECT 
  'workflow_steps' as table_name,
  COUNT(*) as record_count
FROM workflow_steps
UNION ALL
SELECT 
  'system_triggers' as table_name,
  COUNT(*) as record_count
FROM system_triggers
UNION ALL
SELECT 
  'automation_tasks' as table_name,
  COUNT(*) as record_count
FROM automation_tasks
UNION ALL
SELECT 
  'scheduled_reports' as table_name,
  COUNT(*) as record_count
FROM scheduled_reports;

RAISE NOTICE 'Sistema de Automatización configurado exitosamente!';
