-- Script para corregir la política RLS de payments
-- Ejecutar en Supabase SQL Editor

-- 1. Eliminar políticas existentes
DROP POLICY IF EXISTS "Users can view own payments" ON public.payments;
DROP POLICY IF EXISTS "Users can insert own payments" ON public.payments;
DROP POLICY IF EXISTS "Users can update own payments" ON public.payments;
DROP POLICY IF EXISTS "Admins can view all payments" ON public.payments;

-- 2. Crear política: usuarios pueden ver sus propios pagos por EMAIL
CREATE POLICY "Users can view own payments" ON public.payments
    FOR SELECT USING (
        user_email = (
            SELECT email FROM auth.users WHERE id = auth.uid()
        )
    );

-- 3. Crear política: usuarios pueden insertar sus propios pagos
CREATE POLICY "Users can insert own payments" ON public.payments
    FOR INSERT WITH CHECK (
        user_email = (
            SELECT email FROM auth.users WHERE id = auth.uid()
        )
    );

-- 4. Crear política: usuarios pueden actualizar sus propios pagos
CREATE POLICY "Users can update own payments" ON public.payments
    FOR UPDATE USING (
        user_email = (
            SELECT email FROM auth.users WHERE id = auth.uid()
        )
    );

-- 5. Crear política: admins pueden ver todos los pagos
CREATE POLICY "Admins can view all payments" ON public.payments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- 6. Verificar que las políticas se crearon
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'payments';

-- 7. Verificar que RLS está habilitado
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'payments';
