-- Script FINAL para corregir las políticas RLS de la tabla payments
-- Ejecutar en Supabase SQL Editor

-- 1. Verificar estado actual
SELECT 
    schemaname, 
    tablename, 
    rowsecurity 
FROM pg_tables 
WHERE tablename = 'payments';

-- 2. Eliminar TODAS las políticas existentes
DROP POLICY IF EXISTS "Admins can manage all payments" ON public.payments;
DROP POLICY IF EXISTS "Admins can view all payments" ON public.payments;
DROP POLICY IF EXISTS "Users can create own payments" ON public.payments;
DROP POLICY IF EXISTS "Users can insert own payments" ON public.payments;
DROP POLICY IF EXISTS "Users can update own payments" ON public.payments;
DROP POLICY IF EXISTS "Users can view own payments" ON public.payments;

-- 3. Verificar que no quedaron políticas
SELECT COUNT(*) as remaining_policies 
FROM pg_policies 
WHERE tablename = 'payments';

-- 4. Crear política para usuarios (ver sus propios pagos)
CREATE POLICY "Users can view own payments" ON public.payments
    FOR SELECT USING (
        user_email = (
            SELECT email FROM auth.users WHERE id = auth.uid()
        )
    );

-- 5. Crear política para usuarios (insertar sus propios pagos)
CREATE POLICY "Users can insert own payments" ON public.payments
    FOR INSERT WITH CHECK (
        user_email = (
            SELECT email FROM auth.users WHERE id = auth.uid()
        )
    );

-- 6. Crear política para usuarios (actualizar sus propios pagos)
CREATE POLICY "Users can update own payments" ON public.payments
    FOR UPDATE USING (
        user_email = (
            SELECT email FROM auth.users WHERE id = auth.uid()
        )
    );

-- 7. Crear política para admins (ver todos los pagos)
CREATE POLICY "Admins can view all payments" ON public.payments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- 8. Crear política para admins (gestionar todos los pagos)
CREATE POLICY "Admins can manage all payments" ON public.payments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- 9. Verificar que se crearon todas las políticas
SELECT 
    policyname, 
    cmd, 
    CASE 
        WHEN qual IS NOT NULL THEN 'USING: ' || qual
        ELSE 'WITH CHECK: ' || with_check
    END as policy_condition
FROM pg_policies 
WHERE tablename = 'payments'
ORDER BY policyname;

-- 10. Verificar que RLS está habilitado
SELECT 
    schemaname, 
    tablename, 
    rowsecurity 
FROM pg_tables 
WHERE tablename = 'payments';
