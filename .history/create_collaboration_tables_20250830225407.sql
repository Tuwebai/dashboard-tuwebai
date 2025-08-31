-- Script para crear las tablas de colaboración del sistema
-- Ejecutar en Supabase SQL Editor

-- Tabla para mensajes del chat de colaboración
CREATE TABLE IF NOT EXISTS public.project_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL,
    text TEXT NOT NULL,
    sender UUID NOT NULL,
    sender_name TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    type TEXT DEFAULT 'text',
    file_url TEXT,
    file_name TEXT,
    role TEXT DEFAULT 'cliente',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para tareas del proyecto
CREATE TABLE IF NOT EXISTS public.project_tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending',
    priority TEXT DEFAULT 'medium',
    assignee UUID,
    assignee_name TEXT,
    due_date DATE,
    phase_key TEXT DEFAULT 'general',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para archivos del proyecto
CREATE TABLE IF NOT EXISTS public.project_files (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    size BIGINT NOT NULL,
    type TEXT NOT NULL,
    uploaded_by UUID NOT NULL,
    uploaded_by_name TEXT NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_project_messages_project_id ON public.project_messages(project_id);
CREATE INDEX IF NOT EXISTS idx_project_messages_created_at ON public.project_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_project_messages_sender ON public.project_messages(sender);

CREATE INDEX IF NOT EXISTS idx_project_tasks_project_id ON public.project_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_project_tasks_status ON public.project_tasks(status);
CREATE INDEX IF NOT EXISTS idx_project_tasks_assignee ON public.project_tasks(assignee);
CREATE INDEX IF NOT EXISTS idx_project_tasks_created_at ON public.project_tasks(created_at);

CREATE INDEX IF NOT EXISTS idx_project_files_project_id ON public.project_files(project_id);
CREATE INDEX IF NOT EXISTS idx_project_files_uploaded_by ON public.project_files(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_project_files_uploaded_at ON public.project_files(uploaded_at);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para actualizar updated_at
CREATE TRIGGER update_project_messages_updated_at 
    BEFORE UPDATE ON public.project_messages 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_tasks_updated_at 
    BEFORE UPDATE ON public.project_tasks 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_files_updated_at 
    BEFORE UPDATE ON public.project_files 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comentarios sobre las tablas
COMMENT ON TABLE public.project_messages IS 'Tabla para almacenar mensajes del chat de colaboración entre admin y cliente';
COMMENT ON TABLE public.project_tasks IS 'Tabla para gestionar tareas del proyecto';
COMMENT ON TABLE public.project_files IS 'Tabla para archivos compartidos en el proyecto';

-- Verificar que las tablas se crearon correctamente
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name IN ('project_messages', 'project_tasks', 'project_files')
ORDER BY table_name, ordinal_position;
