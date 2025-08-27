-- =====================================================
-- CONFIGURACIÓN COMPLETA DE BASE DE DATOS - TUWEBAI
-- =====================================================
-- Este script se puede ejecutar múltiples veces sin errores
-- Solo crea las tablas que faltan, no reemplaza las existentes

-- =====================================================
-- 1. EXTENSIONES NECESARIAS
-- =====================================================

-- Crear extensión uuid-ossp si no existe
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 2. TABLA DE USUARIOS (si no existe)
-- =====================================================

CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('admin', 'user')),
    phone VARCHAR(50),
    company VARCHAR(255),
    position VARCHAR(255),
    bio TEXT,
    location VARCHAR(255),
    website VARCHAR(255),
    language VARCHAR(10) DEFAULT 'es',
    timezone VARCHAR(50) DEFAULT 'UTC',
    date_format VARCHAR(20) DEFAULT 'DD/MM/YYYY',
    time_format VARCHAR(20) DEFAULT '24h',
    profile_visibility VARCHAR(20) DEFAULT 'public',
    show_email BOOLEAN DEFAULT true,
    show_phone BOOLEAN DEFAULT false,
    allow_analytics BOOLEAN DEFAULT true,
    allow_cookies BOOLEAN DEFAULT true,
    two_factor_auth BOOLEAN DEFAULT false,
    push_notifications BOOLEAN DEFAULT true,
    email_notifications BOOLEAN DEFAULT true,
    sms_notifications BOOLEAN DEFAULT false,
    sound_enabled BOOLEAN DEFAULT true,
    vibration_enabled BOOLEAN DEFAULT true,
    quiet_hours BOOLEAN DEFAULT false,
    quiet_hours_start TIME DEFAULT '22:00',
    quiet_hours_end TIME DEFAULT '08:00',
    project_updates BOOLEAN DEFAULT true,
    payment_reminders BOOLEAN DEFAULT true,
    support_updates BOOLEAN DEFAULT true,
    marketing_emails BOOLEAN DEFAULT false,
    auto_save BOOLEAN DEFAULT true,
    auto_save_interval INTEGER DEFAULT 300,
    cache_enabled BOOLEAN DEFAULT true,
    image_quality VARCHAR(20) DEFAULT 'high',
    animations_enabled BOOLEAN DEFAULT true,
    low_bandwidth_mode BOOLEAN DEFAULT false,
    session_timeout INTEGER DEFAULT 3600,
    max_login_attempts INTEGER DEFAULT 5,
    require_password_change BOOLEAN DEFAULT false,
    password_expiry_days INTEGER DEFAULT 90,
    login_notifications BOOLEAN DEFAULT true,
    device_management BOOLEAN DEFAULT false,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. TABLA DE PROYECTOS (si no existe)
-- =====================================================

CREATE TABLE IF NOT EXISTS projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    technologies TEXT[] DEFAULT '{}',
    environment_variables JSONB DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'development' CHECK (status IN ('development', 'production', 'paused', 'maintenance')),
    github_repository_url VARCHAR(500),
    customicon VARCHAR(100),
    type VARCHAR(100),
    funcionalidades TEXT[] DEFAULT '{}',
    fases JSONB DEFAULT '[]',
    progress_history JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true
);

-- =====================================================
-- 4. TABLA DE ARCHIVOS DE PROYECTOS (si no existe)
-- =====================================================

CREATE TABLE IF NOT EXISTS project_files (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    path VARCHAR(500) NOT NULL,
    size BIGINT NOT NULL,
    mime_type VARCHAR(100),
    bucket_name VARCHAR(100) DEFAULT 'project-files',
    storage_path VARCHAR(500) NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- =====================================================
-- 5. TABLA DE TICKETS (si no existe)
-- =====================================================

CREATE TABLE IF NOT EXISTS tickets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    subject VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    status VARCHAR(50) DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'resolved', 'closed')),
    stage VARCHAR(50) DEFAULT 'new',
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    client_id UUID REFERENCES users(id) ON DELETE CASCADE,
    client_email VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    tags TEXT[] DEFAULT '{}',
    escalation_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 6. TABLA DE PAGOS (si no existe)
-- =====================================================

CREATE TABLE IF NOT EXISTS payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    user_email VARCHAR(255) NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    payment_type VARCHAR(100) NOT NULL,
    amount INTEGER NOT NULL,
    currency VARCHAR(10) DEFAULT 'ARS',
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
    mercadopago_id VARCHAR(255),
    description TEXT,
    features JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 7. TABLA DE NOTIFICACIONES (si no existe)
-- =====================================================

CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
    category VARCHAR(100),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    is_read BOOLEAN DEFAULT false,
    action_url VARCHAR(500),
    metadata JSONB DEFAULT '{}',
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 8. TABLA DE CONFIGURACIONES DE NOTIFICACIONES (si no existe)
-- =====================================================

CREATE TABLE IF NOT EXISTS notification_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    email_notifications BOOLEAN DEFAULT true,
    push_notifications BOOLEAN DEFAULT true,
    sms_notifications BOOLEAN DEFAULT false,
    project_updates BOOLEAN DEFAULT true,
    payment_reminders BOOLEAN DEFAULT true,
    support_updates BOOLEAN DEFAULT true,
    marketing_emails BOOLEAN DEFAULT false,
    quiet_hours_enabled BOOLEAN DEFAULT false,
    quiet_hours_start TIME DEFAULT '22:00',
    quiet_hours_end TIME DEFAULT '08:00',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 9. TABLA DE LOGS DEL SISTEMA (si no existe)
-- =====================================================

CREATE TABLE IF NOT EXISTS system_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    level VARCHAR(20) NOT NULL CHECK (level IN ('debug', 'info', 'warning', 'error', 'critical')),
    message TEXT NOT NULL,
    context JSONB DEFAULT '{}',
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 10. TABLA DE SALAS DE CHAT (si no existe)
-- =====================================================

CREATE TABLE IF NOT EXISTS chat_rooms (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255),
    type VARCHAR(50) DEFAULT 'project' CHECK (type IN ('project', 'support', 'general')),
    participants UUID[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- =====================================================
-- 11. TABLA DE MENSAJES DE CHAT (si no existe)
-- =====================================================

CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    message TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'image', 'system')),
    metadata JSONB DEFAULT '{}',
    is_edited BOOLEAN DEFAULT false,
    edited_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 12. TABLA DE TAREAS (si no existe)
-- =====================================================

CREATE TABLE IF NOT EXISTS tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    due_date TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- =====================================================
-- 13. TABLA DE COMENTARIOS DE PROYECTOS (si no existe)
-- =====================================================

CREATE TABLE IF NOT EXISTS project_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    phase_key VARCHAR(100),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    texto TEXT NOT NULL,
    autor VARCHAR(255) NOT NULL,
    tipo VARCHAR(20) DEFAULT 'cliente' CHECK (tipo IN ('admin', 'cliente')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 14. TABLA DE MÉTRICAS DE PROYECTOS (si no existe)
-- =====================================================

CREATE TABLE IF NOT EXISTS project_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    metric_name VARCHAR(100) NOT NULL,
    metric_value NUMERIC NOT NULL,
    metric_unit VARCHAR(50),
    context JSONB DEFAULT '{}',
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 15. TABLA DE PREFERENCIAS DE CLIENTES (si no existe)
-- =====================================================

CREATE TABLE IF NOT EXISTS client_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    dashboard_layout JSONB DEFAULT '{}',
    widget_settings JSONB DEFAULT '{}',
    color_scheme VARCHAR(20) DEFAULT 'auto' CHECK (color_scheme IN ('light', 'dark', 'auto')),
    language VARCHAR(10) DEFAULT 'es',
    timezone VARCHAR(50) DEFAULT 'UTC',
    date_format VARCHAR(20) DEFAULT 'DD/MM/YYYY',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 16. CREAR ÍNDICES PARA OPTIMIZAR CONSULTAS
-- =====================================================

-- Índices para users
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- Índices para projects
CREATE INDEX IF NOT EXISTS idx_projects_created_by ON projects(created_by);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_type ON projects(type);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at);

-- Índices para project_files
CREATE INDEX IF NOT EXISTS idx_project_files_project_id ON project_files(project_id);
CREATE INDEX IF NOT EXISTS idx_project_files_created_at ON project_files(created_at);

-- Índices para tickets
CREATE INDEX IF NOT EXISTS idx_tickets_client_id ON tickets(client_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_priority ON tickets(priority);
CREATE INDEX IF NOT EXISTS idx_tickets_assigned_to ON tickets(assigned_to);

-- Índices para payments
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at);

-- Índices para notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- Índices para system_logs
CREATE INDEX IF NOT EXISTS idx_system_logs_level ON system_logs(level);
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at);

-- Índices para chat_rooms
CREATE INDEX IF NOT EXISTS idx_chat_rooms_project_id ON chat_rooms(project_id);

-- Índices para chat_messages
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_id ON chat_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);

-- Índices para tasks
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);

-- Índices para project_comments
CREATE INDEX IF NOT EXISTS idx_project_comments_project_id ON project_comments(project_id);
CREATE INDEX IF NOT EXISTS idx_project_comments_phase_key ON project_comments(phase_key);

-- Índices para project_metrics
CREATE INDEX IF NOT EXISTS idx_project_metrics_project_id ON project_metrics(project_id);
CREATE INDEX IF NOT EXISTS idx_project_metrics_metric_name ON project_metrics(metric_name);

-- =====================================================
-- 17. FUNCIONES NECESARIAS
-- =====================================================

-- Función para actualizar timestamp de actualización
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Función para calcular progreso del proyecto
CREATE OR REPLACE FUNCTION calculate_project_progress(project_id UUID)
RETURNS INTEGER AS $$
DECLARE
    total_phases INTEGER;
    completed_phases INTEGER;
    progress_percentage INTEGER;
BEGIN
    -- Contar total de fases
    SELECT COUNT(*) INTO total_phases
    FROM projects p,
         jsonb_array_elements(p.fases) AS fases
    WHERE p.id = project_id;
    
    -- Contar fases completadas
    SELECT COUNT(*) INTO completed_phases
    FROM projects p,
         jsonb_array_elements(p.fases) AS fases
    WHERE p.id = project_id
      AND (fases->>'estado') = 'Terminado';
    
    -- Calcular porcentaje
    IF total_phases = 0 THEN
        progress_percentage := 0;
    ELSE
        progress_percentage := ROUND((completed_phases::NUMERIC / total_phases::NUMERIC) * 100);
    END IF;
    
    RETURN progress_percentage;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 18. TRIGGERS PARA ACTUALIZAR TIMESTAMPS
-- =====================================================

-- Trigger para users
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para projects
DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at 
    BEFORE UPDATE ON projects 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para tickets
DROP TRIGGER IF EXISTS update_tickets_updated_at ON tickets;
CREATE TRIGGER update_tickets_updated_at 
    BEFORE UPDATE ON tickets 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para payments
DROP TRIGGER IF EXISTS update_payments_updated_at ON payments;
CREATE TRIGGER update_payments_updated_at 
    BEFORE UPDATE ON payments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para notification_settings
DROP TRIGGER IF EXISTS update_notification_settings_updated_at ON notification_settings;
CREATE TRIGGER update_notification_settings_updated_at 
    BEFORE UPDATE ON notification_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para tasks
DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
CREATE TRIGGER update_tasks_updated_at 
    BEFORE UPDATE ON tasks 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para project_comments
DROP TRIGGER IF EXISTS update_project_comments_updated_at ON project_comments;
CREATE TRIGGER update_project_comments_updated_at 
    BEFORE UPDATE ON project_comments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para client_preferences
DROP TRIGGER IF EXISTS update_client_preferences_updated_at ON client_preferences;
CREATE TRIGGER update_client_preferences_updated_at 
    BEFORE UPDATE ON client_preferences 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 19. POLÍTICAS RLS (ROW LEVEL SECURITY)
-- =====================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_preferences ENABLE ROW LEVEL SECURITY;

-- Políticas para users
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON users;
CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can view all users" ON users;
CREATE POLICY "Admins can view all users" ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Políticas para projects
DROP POLICY IF EXISTS "Users can view their own projects" ON projects;
CREATE POLICY "Users can view their own projects" ON projects
    FOR SELECT USING (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can create projects" ON projects;
CREATE POLICY "Users can create projects" ON projects
    FOR INSERT WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can update their own projects" ON projects;
CREATE POLICY "Users can update their own projects" ON projects
    FOR UPDATE USING (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can delete their own projects" ON projects;
CREATE POLICY "Users can delete their own projects" ON projects
    FOR DELETE USING (auth.uid() = created_by);

-- Políticas para project_files
DROP POLICY IF EXISTS "Users can view files from their projects" ON project_files;
CREATE POLICY "Users can view files from their projects" ON project_files
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM projects 
            WHERE id = project_files.project_id 
            AND created_by = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can upload files to their projects" ON project_files;
CREATE POLICY "Users can upload files to their projects" ON project_files
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects 
            WHERE id = project_files.project_id 
            AND created_by = auth.uid()
        )
    );

-- Políticas para tickets
DROP POLICY IF EXISTS "Users can view their own tickets" ON tickets;
CREATE POLICY "Users can view their own tickets" ON tickets
    FOR SELECT USING (auth.uid() = client_id);

DROP POLICY IF EXISTS "Users can create tickets" ON tickets;
CREATE POLICY "Users can create tickets" ON tickets
    FOR INSERT WITH CHECK (auth.uid() = client_id);

DROP POLICY IF EXISTS "Users can update their own tickets" ON tickets;
CREATE POLICY "Users can update their own tickets" ON tickets
    FOR UPDATE USING (auth.uid() = client_id);

-- Políticas para payments
DROP POLICY IF EXISTS "Users can view their own payments" ON payments;
CREATE POLICY "Users can view their own payments" ON payments
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create payments" ON payments;
CREATE POLICY "Users can create payments" ON payments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Políticas para notifications
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Políticas para chat_rooms
DROP POLICY IF EXISTS "Users can view chat rooms from their projects" ON chat_rooms;
CREATE POLICY "Users can view chat rooms from their projects" ON chat_rooms
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM projects 
            WHERE id = chat_rooms.project_id 
            AND created_by = auth.uid()
        )
    );

-- Políticas para chat_messages
DROP POLICY IF EXISTS "Users can view messages from their chat rooms" ON chat_messages;
CREATE POLICY "Users can view messages from their chat rooms" ON chat_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM chat_rooms cr
            JOIN projects p ON cr.project_id = p.id
            WHERE cr.id = chat_messages.room_id 
            AND p.created_by = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can send messages to their chat rooms" ON chat_messages;
CREATE POLICY "Users can send messages to their chat rooms" ON chat_messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM chat_rooms cr
            JOIN projects p ON cr.project_id = p.id
            WHERE cr.id = chat_messages.room_id 
            AND p.created_by = auth.uid()
        )
    );

-- =====================================================
-- 20. DATOS INICIALES (solo si no existen)
-- =====================================================

-- Insertar usuario admin si no existe
INSERT INTO users (email, full_name, role) 
VALUES ('tuwebai@gmail.com', 'Administrador TuWebAI', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Crear configuración de notificaciones para el admin si no existe
INSERT INTO notification_settings (user_id, email_notifications, push_notifications)
SELECT id, true, true FROM users WHERE email = 'tuwebai@gmail.com'
ON CONFLICT DO NOTHING;

-- Crear preferencias del cliente para el admin si no existe
INSERT INTO client_preferences (user_id, dashboard_layout, color_scheme)
SELECT id, '{"layout": "default"}', 'auto' FROM users WHERE email = 'tuwebai@gmail.com'
ON CONFLICT DO NOTHING;

-- =====================================================
-- 21. VERIFICACIÓN FINAL
-- =====================================================

-- Verificar que todas las tablas se crearon correctamente
SELECT 
    'users' as table_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') 
        THEN '✅ EXISTE' 
        ELSE '❌ NO EXISTE' 
    END as status
UNION ALL
SELECT 
    'projects' as table_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'projects') 
        THEN '✅ EXISTE' 
        ELSE '❌ NO EXISTE' 
    END as status
UNION ALL
SELECT 
    'project_files' as table_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'project_files') 
        THEN '✅ EXISTE' 
        ELSE '❌ NO EXISTE' 
    END as status
UNION ALL
SELECT 
    'tickets' as table_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tickets') 
        THEN '✅ EXISTE' 
        ELSE '❌ NO EXISTE' 
    END as status
UNION ALL
SELECT 
    'payments' as table_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'payments') 
        THEN '✅ EXISTE' 
        ELSE '❌ NO EXISTE' 
    END as status
UNION ALL
SELECT 
    'notifications' as table_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'notifications') 
        THEN '✅ EXISTE' 
        ELSE '❌ NO EXISTE' 
    END as status
UNION ALL
SELECT 
    'chat_rooms' as table_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'chat_rooms') 
        THEN '✅ EXISTE' 
        ELSE '❌ NO EXISTE' 
    END as status
UNION ALL
SELECT 
    'chat_messages' as table_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'chat_messages') 
        THEN '✅ EXISTE' 
        ELSE '❌ NO EXISTE' 
    END as status;

-- =====================================================
-- 22. MENSAJE DE CONFIRMACIÓN
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=====================================================';
    RAISE NOTICE '✅ CONFIGURACIÓN DE BASE DE DATOS COMPLETADA';
    RAISE NOTICE '=====================================================';
    RAISE NOTICE '';
    RAISE NOTICE '📊 Tablas creadas/verificadas:';
    RAISE NOTICE '   • users - Gestión de usuarios';
    RAISE NOTICE '   • projects - Proyectos de clientes';
    RAISE NOTICE '   • project_files - Archivos de proyectos';
    RAISE NOTICE '   • tickets - Sistema de tickets';
    RAISE NOTICE '   • payments - Sistema de pagos';
    RAISE NOTICE '   • notifications - Sistema de notificaciones';
    RAISE NOTICE '   • chat_rooms - Salas de chat';
    RAISE NOTICE '   • chat_messages - Mensajes de chat';
    RAISE NOTICE '   • tasks - Tareas de proyectos';
    RAISE NOTICE '   • project_comments - Comentarios';
    RAISE NOTICE '   • project_metrics - Métricas';
    RAISE NOTICE '   • client_preferences - Preferencias';
    RAISE NOTICE '';
    RAISE NOTICE '🔒 Políticas RLS configuradas para seguridad';
    RAISE NOTICE '⚡ Índices creados para optimización';
    RAISE NOTICE '🔧 Triggers configurados para timestamps';
    RAISE NOTICE '📝 Funciones creadas para cálculos';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 ¡La base de datos está lista para usar!';
    RAISE NOTICE '';
END $$;
