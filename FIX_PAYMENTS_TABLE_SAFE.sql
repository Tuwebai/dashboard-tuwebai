-- Script seguro para corregir la tabla payments
-- Ejecutar en Supabase SQL Editor - UNO POR UNO

-- 1. Agregar columnas faltantes (ejecutar primero)
ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS user_email TEXT;

-- 2. Agregar más columnas
ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS user_name TEXT;

-- 3. Agregar tipo de pago
ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS payment_type TEXT DEFAULT 'custom';

-- 4. Agregar ID de MercadoPago
ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS mercadopago_id TEXT;

-- 5. Agregar estado de MercadoPago
ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS mercadopago_status TEXT;

-- 6. Agregar cuotas
ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS installments INTEGER DEFAULT 1;

-- 7. Agregar descripción
ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS description TEXT;

-- 8. Agregar características
ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS features TEXT[] DEFAULT '{}';

-- 9. Agregar fecha de pago
ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE;

-- 10. Agregar URL de factura
ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS invoice_url TEXT;

-- 11. Agregar metadatos
ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- 12. Crear función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 13. Crear trigger
DROP TRIGGER IF EXISTS update_payments_updated_at ON public.payments;
CREATE TRIGGER update_payments_updated_at 
    BEFORE UPDATE ON public.payments 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 14. Habilitar RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- 15. Crear políticas RLS básicas
DROP POLICY IF EXISTS "Users can view own payments" ON public.payments;
CREATE POLICY "Users can view own payments" ON public.payments
    FOR SELECT USING (auth.uid() = user_id);

-- 16. Política para insertar
DROP POLICY IF EXISTS "Users can insert own payments" ON public.payments;
CREATE POLICY "Users can insert own payments" ON public.payments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 17. Política para actualizar
DROP POLICY IF EXISTS "Users can update own payments" ON public.payments;
CREATE POLICY "Users can update own payments" ON public.payments
    FOR UPDATE USING (auth.uid() = user_id);

-- 18. Política para admins
DROP POLICY IF EXISTS "Admins can view all payments" ON public.payments;
CREATE POLICY "Admins can view all payments" ON public.payments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- 19. Verificar estructura final
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'payments' 
ORDER BY ordinal_position;
