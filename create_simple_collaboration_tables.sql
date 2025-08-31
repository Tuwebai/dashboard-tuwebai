-- Script simplificado para crear las tablas de colaboración
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

-- Crear índices básicos
CREATE INDEX IF NOT EXISTS idx_project_messages_project_id ON public.project_messages(project_id);
CREATE INDEX IF NOT EXISTS idx_project_tasks_project_id ON public.project_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_project_files_project_id ON public.project_files(project_id);

-- Verificar que las tablas se crearon
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name IN ('project_messages', 'project_tasks', 'project_files');
