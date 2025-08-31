-- Script simple para corregir la tabla payments
-- Ejecutar en Supabase SQL Editor

-- 1. Agregar columnas faltantes
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

-- 4. Habilitar RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- 5. Crear políticas RLS básicas
DROP POLICY IF EXISTS "Users can view own payments" ON public.payments;
CREATE POLICY "Users can view own payments" ON public.payments
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own payments" ON public.payments;
CREATE POLICY "Users can insert own payments" ON public.payments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own payments" ON public.payments;
CREATE POLICY "Users can update own payments" ON public.payments
    FOR UPDATE USING (auth.uid() = user_id);

-- 6. Política para admins (ver todos los pagos)
DROP POLICY IF EXISTS "Admins can view all payments" ON public.payments;
CREATE POLICY "Admins can view all payments" ON public.payments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- 7. Verificar estructura final
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'payments' 
ORDER BY ordinal_position;
