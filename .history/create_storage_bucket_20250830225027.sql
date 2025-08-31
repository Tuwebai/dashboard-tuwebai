-- Script para crear el bucket de storage para archivos del proyecto
-- Ejecutar en Supabase SQL Editor

-- Crear el bucket para archivos del proyecto
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'project-files',
    'project-files',
    true,
    52428800, -- 50MB límite por archivo
    ARRAY[
        'image/*',
        'video/*',
        'audio/*',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain',
        'text/csv',
        'application/json',
        'application/xml',
        'application/zip',
        'application/x-rar-compressed',
        'application/x-7z-compressed'
    ]
) ON CONFLICT (id) DO NOTHING;

-- Políticas de seguridad para el bucket
CREATE POLICY "Users can view files from their projects" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'project-files' AND (
            (storage.foldername(name))[1] IN (
                SELECT id::text FROM public.projects 
                WHERE created_by = auth.uid() OR id IN (
                    SELECT project_id FROM public.project_collaborators 
                    WHERE user_id = auth.uid()
                )
            )
        )
    );

CREATE POLICY "Users can upload files to their projects" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'project-files' AND (
            (storage.foldername(name))[1] IN (
                SELECT id::text FROM public.projects 
                WHERE created_by = auth.uid() OR id IN (
                    SELECT project_id FROM public.project_collaborators 
                    WHERE user_id = auth.uid()
                )
            )
        )
    );

CREATE POLICY "Users can update files from their projects" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'project-files' AND (
            (storage.foldername(name))[1] IN (
                SELECT id::text FROM public.projects 
                WHERE created_by = auth.uid() OR id IN (
                    SELECT project_id FROM public.project_collaborators 
                    WHERE user_id = auth.uid()
                )
            )
        )
    );

CREATE POLICY "Users can delete files from their projects" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'project-files' AND (
            (storage.foldername(name))[1] IN (
                SELECT id::text FROM public.projects 
                WHERE created_by = auth.uid() OR id IN (
                    SELECT project_id FROM public.project_collaborators 
                    WHERE user_id = auth.uid()
                )
            )
        )
    );

-- Verificar que el bucket se creó correctamente
SELECT * FROM storage.buckets WHERE id = 'project-files';
