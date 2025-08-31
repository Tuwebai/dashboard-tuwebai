-- Script para crear políticas de seguridad para las tablas de colaboración
-- Ejecutar en Supabase SQL Editor DESPUÉS de crear las tablas

-- Habilitar RLS (Row Level Security) en todas las tablas
ALTER TABLE public.project_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_files ENABLE ROW LEVEL SECURITY;

-- Políticas para project_messages
CREATE POLICY "Users can view messages from their projects" ON public.project_messages
    FOR SELECT USING (
        project_id IN (
            SELECT id FROM public.projects 
            WHERE created_by = auth.uid()
        )
    );

CREATE POLICY "Users can insert messages in their projects" ON public.project_messages
    FOR INSERT WITH CHECK (
        project_id IN (
            SELECT id FROM public.projects 
            WHERE created_by = auth.uid()
        )
    );

CREATE POLICY "Users can update their own messages" ON public.project_messages
    FOR UPDATE USING (sender = auth.uid());

CREATE POLICY "Users can delete their own messages" ON public.project_messages
    FOR DELETE USING (sender = auth.uid());

-- Políticas para project_tasks
CREATE POLICY "Users can view tasks from their projects" ON public.project_tasks
    FOR SELECT USING (
        project_id IN (
            SELECT id FROM public.projects 
            WHERE created_by = auth.uid()
        )
    );

CREATE POLICY "Users can insert tasks in their projects" ON public.project_tasks
    FOR INSERT WITH CHECK (
        project_id IN (
            SELECT id FROM public.projects 
            WHERE created_by = auth.uid()
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

-- Políticas para project_files
CREATE POLICY "Users can view files from their projects" ON public.project_files
    FOR SELECT USING (
        project_id IN (
            SELECT id FROM public.projects 
            WHERE created_by = auth.uid()
        )
    );

CREATE POLICY "Users can insert files in their projects" ON public.project_files
    FOR INSERT WITH CHECK (
        project_id IN (
            SELECT id FROM public.projects 
            WHERE created_by = auth.uid()
        )
    );

CREATE POLICY "Users can update their own files" ON public.project_files
    FOR UPDATE USING (uploaded_by = auth.uid());

CREATE POLICY "Users can delete their own files" ON public.project_files
    FOR DELETE USING (uploaded_by = auth.uid());

-- Políticas para storage.objects (bucket project-files)
CREATE POLICY "Users can view files from their projects" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'project-files' AND (
            (storage.foldername(name))[1] IN (
                SELECT id::text FROM public.projects 
                WHERE created_by = auth.uid()
            )
        )
    );

CREATE POLICY "Users can upload files to their projects" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'project-files' AND (
            (storage.foldername(name))[1] IN (
                SELECT id::text FROM public.projects 
                WHERE created_by = auth.uid()
            )
        )
    );

CREATE POLICY "Users can update files from their projects" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'project-files' AND (
            (storage.foldername(name))[1] IN (
                SELECT id::text FROM public.projects 
                WHERE created_by = auth.uid()
            )
        )
    );

CREATE POLICY "Users can delete files from their projects" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'project-files' AND (
            (storage.foldername(name))[1] IN (
                SELECT id::text FROM public.projects 
                WHERE created_by = auth.uid()
            )
        )
    );

-- Verificar que las políticas se crearon
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
    AND tablename IN ('project_messages', 'project_tasks', 'project_files')
ORDER BY tablename, policyname;
