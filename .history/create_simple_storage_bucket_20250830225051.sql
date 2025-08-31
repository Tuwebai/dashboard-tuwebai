-- Script simplificado para crear el bucket de storage
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

-- Verificar que el bucket se creó
SELECT * FROM storage.buckets WHERE id = 'project-files';
