-- Migración de la tabla payments existente para MercadoPago
-- Ejecutar este script en tu base de datos Supabase

-- Agregar columnas faltantes para MercadoPago
ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS user_email TEXT,
ADD COLUMN IF NOT EXISTS user_name TEXT,
ADD COLUMN IF NOT EXISTS payment_type TEXT DEFAULT 'custom',
ADD COLUMN IF NOT EXISTS mercadopago_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS mercadopago_status TEXT,
ADD COLUMN IF NOT EXISTS installments INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS features TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS invoice_url TEXT,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Cambiar el tipo de amount de numeric a integer (centavos) para mejor compatibilidad
-- Primero crear una columna temporal
ALTER TABLE public.payments ADD COLUMN amount_cents INTEGER;

-- Convertir los valores existentes (multiplicar por 100 para convertir a centavos)
UPDATE public.payments SET amount_cents = ROUND(amount * 100) WHERE amount IS NOT NULL;

-- Eliminar la columna original y renombrar la nueva
ALTER TABLE public.payments DROP COLUMN amount;
ALTER TABLE public.payments RENAME COLUMN amount_cents TO amount;

-- Agregar NOT NULL constraint a amount
ALTER TABLE public.payments ALTER COLUMN amount SET NOT NULL;

-- Agregar índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_payments_user_email ON public.payments(user_email);
CREATE INDEX IF NOT EXISTS idx_payments_mercadopago_id ON public.payments(mercadopago_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON public.payments(created_at);

-- Actualizar comentarios de la tabla
COMMENT ON TABLE public.payments IS 'Tabla de pagos sincronizados con MercadoPago';
COMMENT ON COLUMN public.payments.amount IS 'Monto en centavos (ej: 1000 = $10.00)';
COMMENT ON COLUMN public.payments.mercadopago_id IS 'ID único del pago en MercadoPago';
COMMENT ON COLUMN public.payments.features IS 'Array de características del plan comprado';
COMMENT ON COLUMN public.payments.metadata IS 'Metadatos adicionales del pago';

-- Verificar que la función update_updated_at_column existe, si no, crearla
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$ language 'plpgsql';
    END IF;
END $$;

-- Verificar que el trigger existe, si no, crearlo
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_payments_updated_at') THEN
        CREATE TRIGGER update_payments_updated_at 
            BEFORE UPDATE ON public.payments 
            FOR EACH ROW 
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Habilitar RLS si no está habilitado
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Crear políticas RLS si no existen
DO $$ 
BEGIN
    -- Política: usuarios solo pueden ver sus propios pagos
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payments' AND policyname = 'Users can view own payments') THEN
        CREATE POLICY "Users can view own payments" ON public.payments
            FOR SELECT USING (auth.uid() = user_id);
    END IF;
    
    -- Política: usuarios solo pueden insertar sus propios pagos
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payments' AND policyname = 'Users can insert own payments') THEN
        CREATE POLICY "Users can insert own payments" ON public.payments
            FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    
    -- Política: usuarios solo pueden actualizar sus propios pagos
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payments' AND policyname = 'Users can update own payments') THEN
        CREATE POLICY "Users can update own payments" ON public.payments
            FOR UPDATE USING (auth.uid() = user_id);
    END IF;
    
    -- Política: admins pueden ver todos los pagos
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payments' AND policyname = 'Admins can view all payments') THEN
        CREATE POLICY "Admins can view all payments" ON public.payments
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM auth.users 
                    WHERE auth.users.id = auth.uid() 
                    AND auth.users.raw_user_meta_data->>'role' = 'admin'
                )
            );
    END IF;
    
    -- Política: admins pueden gestionar todos los pagos
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payments' AND policyname = 'Admins can manage all payments') THEN
        CREATE POLICY "Admins can manage all payments" ON public.payments
            FOR ALL USING (
                EXISTS (
                    SELECT 1 FROM auth.users 
                    WHERE auth.users.id = auth.uid() 
                    AND auth.users.raw_user_meta_data->>'role' = 'admin'
                )
            );
    END IF;
END $$;

-- Mostrar el estado final de la tabla
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'payments' 
ORDER BY ordinal_position;
