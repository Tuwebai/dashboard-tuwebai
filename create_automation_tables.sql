-- =====================================================
-- SISTEMA DE AUTOMATIZACIÓN COMPLETO
-- =====================================================

-- Tabla de workflows para proyectos
CREATE TABLE IF NOT EXISTS project_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  project_type VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de pasos del workflow
CREATE TABLE IF NOT EXISTS workflow_steps (
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

-- Tabla de triggers del sistema
CREATE TABLE IF NOT EXISTS system_triggers (
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

-- Tabla de tareas automatizadas
CREATE TABLE IF NOT EXISTS automation_tasks (
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

-- Tabla de pipelines CI/CD
CREATE TABLE IF NOT EXISTS ci_cd_pipelines (
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

-- Tabla de ejecuciones de workflows
CREATE TABLE IF NOT EXISTS workflow_executions (
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

-- Tabla de logs de automatización
CREATE TABLE IF NOT EXISTS automation_logs (
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

-- Tabla de reportes programados
CREATE TABLE IF NOT EXISTS scheduled_reports (
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
CREATE INDEX IF NOT EXISTS idx_scheduled_reports_active ON scheduled_reports(is_active);

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
CREATE POLICY "Users can view workflows" ON project_workflows
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage workflows" ON project_workflows
  FOR ALL USING (auth.role() = 'admin');

-- Políticas para pasos de workflow
CREATE POLICY "Users can view workflow steps" ON workflow_steps
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage workflow steps" ON workflow_steps
  FOR ALL USING (auth.role() = 'admin');

-- Políticas para triggers
CREATE POLICY "Users can view triggers" ON system_triggers
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage triggers" ON system_triggers
  FOR ALL USING (auth.role() = 'admin');

-- Políticas para tareas automatizadas
CREATE POLICY "Users can view automation tasks" ON automation_tasks
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage automation tasks" ON automation_tasks
  FOR ALL USING (auth.role() = 'admin');

-- Políticas para pipelines
CREATE POLICY "Users can view pipelines" ON ci_cd_pipelines
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage pipelines" ON ci_cd_pipelines
  FOR ALL USING (auth.role() = 'admin');

-- Políticas para ejecuciones
CREATE POLICY "Users can view workflow executions" ON workflow_executions
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage workflow executions" ON workflow_executions
  FOR ALL USING (auth.role() = 'admin');

-- Políticas para logs
CREATE POLICY "Users can view automation logs" ON automation_logs
  FOR SELECT USING (auth.role() = 'authenticated');

-- Políticas para reportes programados
CREATE POLICY "Users can view scheduled reports" ON scheduled_reports
  FOR SELECT USING (auth.role() = 'authenticated');

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
CREATE TRIGGER update_project_workflows_updated_at 
  BEFORE UPDATE ON project_workflows 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_triggers_updated_at 
  BEFORE UPDATE ON system_triggers 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_automation_tasks_updated_at 
  BEFORE UPDATE ON automation_tasks 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ci_cd_pipelines_updated_at 
  BEFORE UPDATE ON ci_cd_pipelines 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

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
CREATE TRIGGER calculate_automation_task_next_run 
  BEFORE INSERT ON automation_tasks 
  FOR EACH ROW EXECUTE FUNCTION calculate_next_run();

-- =====================================================
-- DATOS DE EJEMPLO
-- =====================================================

-- Insertar workflow de ejemplo
INSERT INTO project_workflows (name, description, project_type) VALUES 
('Workflow Básico de Proyecto', 'Flujo estándar para proyectos web', 'web_development')
ON CONFLICT DO NOTHING;

-- Insertar pasos del workflow
INSERT INTO workflow_steps (workflow_id, name, type, order_index, actions) 
SELECT 
  w.id,
  'Aprobación Inicial',
  'approval',
  1,
  '{"action": "notify_team", "message": "Nuevo proyecto requiere aprobación"}'
FROM project_workflows w 
WHERE w.name = 'Workflow Básico de Proyecto'
ON CONFLICT DO NOTHING;

-- Insertar trigger de ejemplo
INSERT INTO system_triggers (name, description, event_type, actions) VALUES 
('Notificar Proyecto Creado', 'Notifica al equipo cuando se crea un proyecto', 'project_created', 
 '{"action": "send_notification", "recipients": ["team"], "message": "Nuevo proyecto creado: {project_name}"}')
ON CONFLICT DO NOTHING;

-- Insertar tarea automatizada de ejemplo
INSERT INTO automation_tasks (name, description, type, script) VALUES 
('Backup Diario', 'Crear backup de la base de datos', 'daily', 
 'SELECT pg_dump_database();')
ON CONFLICT DO NOTHING;

-- Insertar reporte programado de ejemplo
INSERT INTO scheduled_reports (name, description, schedule, recipients, format) VALUES 
('Reporte Semanal de Proyectos', 'Estado semanal de todos los proyectos', '0 8 * * 1', 
 '["admin@tuwebai.com"]', 'pdf')
ON CONFLICT DO NOTHING;

-- =====================================================
-- COMENTARIOS FINALES
-- =====================================================

COMMENT ON TABLE project_workflows IS 'Workflows automatizados para proyectos';
COMMENT ON TABLE workflow_steps IS 'Pasos individuales de cada workflow';
COMMENT ON TABLE system_triggers IS 'Triggers del sistema para eventos automáticos';
COMMENT ON TABLE automation_tasks IS 'Tareas automatizadas programadas';
COMMENT ON TABLE ci_cd_pipelines IS 'Pipelines de CI/CD para proyectos';
COMMENT ON TABLE workflow_executions IS 'Ejecuciones de workflows';
COMMENT ON TABLE automation_logs IS 'Logs de todas las automatizaciones';
COMMENT ON TABLE scheduled_reports IS 'Reportes programados automáticamente';

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
