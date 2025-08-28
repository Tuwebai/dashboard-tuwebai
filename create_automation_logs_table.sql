-- Script para crear la tabla automation_logs en Supabase
-- Esta tabla almacenará los logs de automatización del sistema

-- Crear la tabla automation_logs
CREATE TABLE IF NOT EXISTS public.automation_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    action VARCHAR(255) NOT NULL,
    automation_type VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'info',
    message TEXT,
    details JSONB,
    workflow_id UUID REFERENCES public.workflows(id) ON DELETE SET NULL,
    trigger_id UUID REFERENCES public.triggers(id) ON DELETE SET NULL,
    task_id UUID REFERENCES public.automation_tasks(id) ON DELETE SET NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    execution_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_automation_logs_created_at ON public.automation_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_automation_logs_status ON public.automation_logs(status);
CREATE INDEX IF NOT EXISTS idx_automation_logs_automation_type ON public.automation_logs(automation_type);
CREATE INDEX IF NOT EXISTS idx_automation_logs_workflow_id ON public.automation_logs(workflow_id);
CREATE INDEX IF NOT EXISTS idx_automation_logs_trigger_id ON public.automation_logs(trigger_id);
CREATE INDEX IF NOT EXISTS idx_automation_logs_task_id ON public.automation_logs(task_id);
CREATE INDEX IF NOT EXISTS idx_automation_logs_user_id ON public.automation_logs(user_id);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.automation_logs ENABLE ROW LEVEL SECURITY;

-- Crear políticas de seguridad
-- Permitir lectura a usuarios autenticados
CREATE POLICY "Users can view automation logs" ON public.automation_logs
    FOR SELECT USING (auth.role() = 'authenticated');

-- Permitir inserción a usuarios autenticados
CREATE POLICY "Users can insert automation logs" ON public.automation_logs
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Permitir actualización solo a usuarios autenticados
CREATE POLICY "Users can update automation logs" ON public.automation_logs
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Permitir eliminación solo a administradores (opcional)
CREATE POLICY "Only admins can delete automation logs" ON public.automation_logs
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Crear función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_automation_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para actualizar updated_at
CREATE TRIGGER trigger_update_automation_logs_updated_at
    BEFORE UPDATE ON public.automation_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_automation_logs_updated_at();

-- Insertar algunos logs de ejemplo para testing (opcional)
INSERT INTO public.automation_logs (action, automation_type, status, message, details) VALUES
('workflow_executed', 'workflow', 'success', 'Workflow "Backup Diario" ejecutado exitosamente', '{"execution_time": 1250, "records_processed": 150}'),
('trigger_activated', 'trigger', 'info', 'Trigger "Nuevo Usuario" activado', '{"user_email": "test@example.com", "trigger_conditions": "user_created"}'),
('task_scheduled', 'task', 'info', 'Tarea "Limpieza de Logs" programada para ejecución', '{"next_execution": "2024-01-15T02:00:00Z", "schedule": "daily"}'),
('workflow_failed', 'workflow', 'error', 'Workflow "Sincronización" falló por timeout', '{"error_code": "TIMEOUT", "retry_count": 3}'),
('trigger_error', 'trigger', 'warning', 'Trigger "Notificación" generó advertencia', '{"warning": "rate_limit_exceeded", "retry_after": 300}');

-- Comentarios sobre la tabla
COMMENT ON TABLE public.automation_logs IS 'Tabla para almacenar logs de automatización del sistema';
COMMENT ON COLUMN public.automation_logs.action IS 'Acción realizada (ej: workflow_executed, trigger_activated)';
COMMENT ON COLUMN public.automation_logs.automation_type IS 'Tipo de automatización (workflow, trigger, task)';
COMMENT ON COLUMN public.automation_logs.status IS 'Estado del log (success, error, warning, info)';
COMMENT ON COLUMN public.automation_logs.message IS 'Mensaje descriptivo del log';
COMMENT ON COLUMN public.automation_logs.details IS 'Detalles adicionales en formato JSON';
COMMENT ON COLUMN public.automation_logs.execution_time_ms IS 'Tiempo de ejecución en milisegundos';
