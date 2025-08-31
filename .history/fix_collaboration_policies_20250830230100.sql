-- Script para corregir las políticas de colaboración
-- Ejecutar en Supabase SQL Editor

-- Primero eliminar las políticas existentes
DROP POLICY IF EXISTS "Users can view messages from their projects" ON public.project_messages;
DROP POLICY IF EXISTS "Users can insert messages in their projects" ON public.project_messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON public.project_messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON public.project_messages;

DROP POLICY IF EXISTS "Users can view tasks from their projects" ON public.project_tasks;
DROP POLICY IF EXISTS "Users can insert tasks in their projects" ON public.project_tasks;
DROP POLICY IF EXISTS "Users can update tasks they are assigned to" ON public.project_tasks;
DROP POLICY IF EXISTS "Project owners can update any task" ON public.project_tasks;

DROP POLICY IF EXISTS "Users can view files from their projects" ON public.project_files;
DROP POLICY IF EXISTS "Users can insert files in their projects" ON public.project_files;
DROP POLICY IF EXISTS "Users can update their own files" ON public.project_files;
DROP POLICY IF EXISTS "Users can delete their own files" ON public.project_files;

-- Políticas corregidas para project_messages (colaboración bidireccional)
CREATE POLICY "Users can view messages from their projects" ON public.project_messages
    FOR SELECT USING (
        project_id IN (
            SELECT id FROM public.projects 
            WHERE created_by = auth.uid() OR 
                  EXISTS (
                      SELECT 1 FROM public.users 
                      WHERE id = auth.uid() AND role = 'admin'
                  )
        )
    );

CREATE POLICY "Users can insert messages in their projects" ON public.project_messages
    FOR INSERT WITH CHECK (
        project_id IN (
            SELECT id FROM public.projects 
            WHERE created_by = auth.uid() OR 
                  EXISTS (
                      SELECT 1 FROM public.users 
                      WHERE id = auth.uid() AND role = 'admin'
                  )
        )
    );

CREATE POLICY "Users can update their own messages" ON public.project_messages
    FOR UPDATE USING (sender = auth.uid());

CREATE POLICY "Users can delete their own messages" ON public.project_messages
    FOR DELETE USING (sender = auth.uid());

-- Políticas corregidas para project_tasks (colaboración bidireccional)
CREATE POLICY "Users can view tasks from their projects" ON public.project_tasks
    FOR SELECT USING (
        project_id IN (
            SELECT id FROM public.projects 
            WHERE created_by = auth.uid() OR 
                  EXISTS (
                      SELECT 1 FROM public.users 
                      WHERE id = auth.uid() AND role = 'admin'
                  )
        )
    );

CREATE POLICY "Users can insert tasks in their projects" ON public.project_tasks
    FOR INSERT WITH CHECK (
        project_id IN (
            SELECT id FROM public.projects 
            WHERE created_by = auth.uid() OR 
                  EXISTS (
                      SELECT 1 FROM public.users 
                      WHERE id = auth.uid() AND role = 'admin'
                  )
        )
    );

CREATE POLICY "Users can update tasks they are assigned to" ON public.project_tasks
    FOR UPDATE USING (assignee = auth.uid());

CREATE POLICY "Project owners and admins can update any task" ON public.project_tasks
    FOR UPDATE USING (
        project_id IN (
            SELECT id FROM public.projects 
            WHERE created_by = auth.uid() OR 
                  EXISTS (
                      SELECT 1 FROM public.users 
                      WHERE id = auth.uid() AND role = 'admin'
                  )
        )
    );

-- Políticas corregidas para project_files (colaboración bidireccional)
CREATE POLICY "Users can view files from their projects" ON public.project_files
    FOR SELECT USING (
        project_id IN (
            SELECT id FROM public.projects 
            WHERE created_by = auth.uid() OR 
                  EXISTS (
                      SELECT 1 FROM public.users 
                      WHERE id = auth.uid() AND role = 'admin'
                  )
        )
    );

CREATE POLICY "Users can insert files in their projects" ON public.project_files
    FOR INSERT WITH CHECK (
        project_id IN (
            SELECT id FROM public.projects 
            WHERE created_by = auth.uid() OR 
                  EXISTS (
                      SELECT 1 FROM public.users 
                      WHERE id = auth.uid() AND role = 'admin'
                  )
        )
    );

CREATE POLICY "Users can update their own files" ON public.project_files
    FOR UPDATE USING (uploaded_by = auth.uid());

CREATE POLICY "Users can delete their own files" ON public.project_files
    FOR DELETE USING (uploaded_by = auth.uid());

-- Políticas corregidas para storage.objects (bucket project-files)
DROP POLICY IF EXISTS "Users can view files from their projects" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload files to their projects" ON storage.objects;
DROP POLICY IF EXISTS "Users can update files from their projects" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete files from their projects" ON storage.objects;

CREATE POLICY "Users can view files from their projects" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'project-files' AND (
            (storage.foldername(name))[1] IN (
                SELECT id::text FROM public.projects 
                WHERE created_by = auth.uid() OR 
                      EXISTS (
                          SELECT 1 FROM public.users 
                          WHERE id = auth.uid() AND role = 'admin'
                      )
            )
        )
    );

CREATE POLICY "Users can upload files to their projects" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'project-files' AND (
            (storage.foldername(name))[1] IN (
                SELECT id::text FROM public.projects 
                WHERE created_by = auth.uid() OR 
                      EXISTS (
                          SELECT 1 FROM public.users 
                          WHERE id = auth.uid() AND role = 'admin'
                      )
            )
        )
    );

CREATE POLICY "Users can update files from their projects" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'project-files' AND (
            (storage.foldername(name))[1] IN (
                SELECT id::text FROM public.projects 
                WHERE created_by = auth.uid() OR 
                      EXISTS (
                          SELECT 1 FROM public.users 
                          WHERE id = auth.uid() AND role = 'admin'
                      )
            )
        )
    );

CREATE POLICY "Users can delete files from their projects" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'project-files' AND (
            (storage.foldername(name))[1] IN (
                SELECT id::text FROM public.projects 
                WHERE created_by = auth.uid() OR 
                      EXISTS (
                          SELECT 1 FROM public.users 
                          WHERE id = auth.uid() AND role = 'admin'
                      )
            )
        )
    );

-- Verificar que las políticas se actualizaron
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
