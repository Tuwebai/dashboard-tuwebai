-- Script muy simple para crear las tablas de colaboración
-- Ejecutar en Supabase SQL Editor

-- Eliminar tablas si existen
DROP TABLE IF EXISTS public.project_files CASCADE;
DROP TABLE IF EXISTS public.project_tasks CASCADE;
DROP TABLE IF EXISTS public.project_messages CASCADE;

-- Tabla para mensajes del chat
CREATE TABLE public.project_messages (
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

-- Tabla para tareas
CREATE TABLE public.project_tasks (
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

-- Tabla para archivos
CREATE TABLE public.project_files (
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

-- Verificar que se crearon
SELECT 'Tablas creadas correctamente' as status;
