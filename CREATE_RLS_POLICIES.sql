-- Script para crear las políticas RLS de la tabla payments
-- Ejecutar en Supabase SQL Editor DESPUÉS de que las columnas estén creadas

-- 1. Habilitar RLS si no está habilitado
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- 2. Crear función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 3. Crear trigger
DROP TRIGGER IF EXISTS update_payments_updated_at ON public.payments;
CREATE TRIGGER update_payments_updated_at 
    BEFORE UPDATE ON public.payments 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 4. Eliminar políticas existentes si las hay
DROP POLICY IF EXISTS "Users can view own payments" ON public.payments;
DROP POLICY IF EXISTS "Users can insert own payments" ON public.payments;
DROP POLICY IF EXISTS "Users can update own payments" ON public.payments;
DROP POLICY IF EXISTS "Admins can view all payments" ON public.payments;

-- 5. Crear política: usuarios pueden ver sus propios pagos
CREATE POLICY "Users can view own payments" ON public.payments
    FOR SELECT USING (auth.uid() = user_id);

-- 6. Crear política: usuarios pueden insertar sus propios pagos
CREATE POLICY "Users can insert own payments" ON public.payments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 7. Crear política: usuarios pueden actualizar sus propios pagos
CREATE POLICY "Users can update own payments" ON public.payments
    FOR UPDATE USING (auth.uid() = user_id);

-- 8. Crear política: admins pueden ver todos los pagos
CREATE POLICY "Admins can view all payments" ON public.payments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- 9. Verificar que las políticas se crearon
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'payments';
