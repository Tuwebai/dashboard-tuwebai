-- Script SIMPLE para corregir políticas RLS sin depender de tabla users
-- Ejecutar en Supabase SQL Editor

-- 1. Eliminar TODAS las políticas existentes
DROP POLICY IF EXISTS "Admins can manage all payments" ON public.payments;
DROP POLICY IF EXISTS "Admins can view all payments" ON public.payments;
DROP POLICY IF EXISTS "Users can create own payments" ON public.payments;
DROP POLICY IF EXISTS "Users can insert own payments" ON public.payments;
DROP POLICY IF EXISTS "Users can update own payments" ON public.payments;
DROP POLICY IF EXISTS "Users can view own payments" ON public.payments;

-- 2. Verificar que no quedaron políticas
SELECT COUNT(*) as remaining_policies 
FROM pg_policies 
WHERE tablename = 'payments';

-- 3. Crear política SIMPLE para usuarios (ver sus propios pagos)
-- Usar auth.jwt() en lugar de auth.users
CREATE POLICY "Users can view own payments" ON public.payments
    FOR SELECT USING (
        user_email = (
            SELECT current_setting('request.jwt.claims', true)::json->>'email'
        )
    );

-- 4. Crear política SIMPLE para usuarios (insertar sus propios pagos)
CREATE POLICY "Users can insert own payments" ON public.payments
    FOR INSERT WITH CHECK (
        user_email = (
            SELECT current_setting('request.jwt.claims', true)::json->>'email'
        )
    );

-- 5. Crear política SIMPLE para usuarios (actualizar sus propios pagos)
CREATE POLICY "Users can update own payments" ON public.payments
    FOR UPDATE USING (
        user_email = (
            SELECT current_setting('request.jwt.claims', true)::json->>'email'
        )
    );

-- 6. Crear política SIMPLE para admins (ver todos los pagos)
-- Usar role del JWT en lugar de consultar tabla users
CREATE POLICY "Admins can view all payments" ON public.payments
    FOR SELECT USING (
        (SELECT current_setting('request.jwt.claims', true)::json->>'role') = 'admin'
    );

-- 7. Crear política SIMPLE para admins (gestionar todos los pagos)
CREATE POLICY "Admins can manage all payments" ON public.payments
    FOR ALL USING (
        (SELECT current_setting('request.jwt.claims', true)::json->>'role') = 'admin'
    );

-- 8. Verificar que se crearon todas las políticas
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

-- 9. Verificar que RLS está habilitado
SELECT 
    schemaname, 
    tablename, 
    rowsecurity 
FROM pg_tables 
WHERE tablename = 'payments';
