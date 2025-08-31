-- Script simple para permitir acceso completo a las tablas de colaboración
-- Ejecutar en Supabase SQL Editor

-- Deshabilitar RLS temporalmente para permitir acceso completo
ALTER TABLE public.project_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_files DISABLE ROW LEVEL SECURITY;

-- Crear políticas simples que permitan acceso completo
CREATE POLICY "Allow all operations on project_messages" ON public.project_messages
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on project_tasks" ON public.project_tasks
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on project_files" ON public.project_files
    FOR ALL USING (true) WITH CHECK (true);

-- Políticas simples para storage
CREATE POLICY "Allow all operations on project-files bucket" ON storage.objects
    FOR ALL USING (bucket_id = 'project-files') WITH CHECK (bucket_id = 'project-files');

-- Verificar que las políticas se crearon
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE schemaname = 'public' 
    AND tablename IN ('project_messages', 'project_tasks', 'project_files')
ORDER BY tablename, policyname;
