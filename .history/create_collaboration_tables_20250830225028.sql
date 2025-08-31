-- Script para crear las tablas de colaboración del sistema
-- Ejecutar en Supabase SQL Editor

-- Tabla para mensajes del chat de colaboración
CREATE TABLE IF NOT EXISTS public.project_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    sender UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    sender_name TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    type TEXT DEFAULT 'text' CHECK (type IN ('text', 'file', 'system')),
    file_url TEXT,
    file_name TEXT,
    role TEXT DEFAULT 'cliente' CHECK (role IN ('admin', 'cliente')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para tareas del proyecto
CREATE TABLE IF NOT EXISTS public.project_tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in-progress', 'completed', 'cancelled')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    assignee UUID REFERENCES public.users(id) ON DELETE SET NULL,
    assignee_name TEXT,
    due_date DATE,
    phase_key TEXT DEFAULT 'general',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para archivos del proyecto
CREATE TABLE IF NOT EXISTS public.project_files (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    size BIGINT NOT NULL,
    type TEXT NOT NULL,
    uploaded_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
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

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.project_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_files ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad para project_messages
CREATE POLICY "Users can view messages from their projects" ON public.project_messages
    FOR SELECT USING (
        project_id IN (
            SELECT id FROM public.projects 
            WHERE created_by = auth.uid() OR id IN (
                SELECT project_id FROM public.project_collaborators 
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can insert messages in their projects" ON public.project_messages
    FOR INSERT WITH CHECK (
        project_id IN (
            SELECT id FROM public.projects 
            WHERE created_by = auth.uid() OR id IN (
                SELECT project_id FROM public.project_collaborators 
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can update their own messages" ON public.project_messages
    FOR UPDATE USING (sender = auth.uid());

CREATE POLICY "Users can delete their own messages" ON public.project_messages
    FOR DELETE USING (sender = auth.uid());

-- Políticas de seguridad para project_tasks
CREATE POLICY "Users can view tasks from their projects" ON public.project_tasks
    FOR SELECT USING (
        project_id IN (
            SELECT id FROM public.projects 
            WHERE created_by = auth.uid() OR id IN (
                SELECT project_id FROM public.project_collaborators 
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can insert tasks in their projects" ON public.project_tasks
    FOR INSERT WITH CHECK (
        project_id IN (
            SELECT id FROM public.projects 
            WHERE created_by = auth.uid() OR id IN (
                SELECT project_id FROM public.project_collaborators 
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can update tasks they are assigned to" ON public.project_tasks
    FOR UPDATE USING (assignee = auth.uid());

CREATE POLICY "Project owners can update any task" ON public.project_tasks
    FOR UPDATE USING (
        project_id IN (
            SELECT id FROM public.projects WHERE created_by = auth.uid()
        )
    );

-- Políticas de seguridad para project_files
CREATE POLICY "Users can view files from their projects" ON public.project_files
    FOR SELECT USING (
        project_id IN (
            SELECT id FROM public.projects 
            WHERE created_by = auth.uid() OR id IN (
                SELECT project_id FROM public.project_collaborators 
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can insert files in their projects" ON public.project_files
    FOR INSERT WITH CHECK (
        project_id IN (
            SELECT id FROM public.projects 
            WHERE created_by = auth.uid() OR id IN (
                SELECT project_id FROM public.project_collaborators 
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can update their own files" ON public.project_files
    FOR UPDATE USING (uploaded_by = auth.uid());

CREATE POLICY "Users can delete their own files" ON public.project_files
    FOR DELETE USING (uploaded_by = auth.uid());

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

-- Insertar algunos datos de ejemplo (opcional)
-- INSERT INTO public.project_messages (project_id, text, sender, sender_name, role) VALUES
--     ('a7634a14-c370-4375-934f-802480026607', '¡Hola! ¿Cómo va el proyecto?', 'admin-user-id', 'Admin', 'admin'),
--     ('a7634a14-c370-4375-934f-802480026607', 'Todo bien, avanzando según lo planificado', 'client-user-id', 'Cliente', 'cliente');

-- INSERT INTO public.project_tasks (project_id, title, description, priority, assignee_name, status) VALUES
--     ('a7634a14-c370-4375-934f-802480026607', 'Revisar diseño inicial', 'Revisar y aprobar el diseño de la interfaz', 'high', 'Admin', 'pending');

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
