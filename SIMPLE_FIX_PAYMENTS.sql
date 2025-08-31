-- Script SIMPLE para agregar solo las columnas esenciales
-- Ejecutar en Supabase SQL Editor

-- Solo agregar las columnas que faltan para MercadoPago
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS user_email TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS user_name TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS payment_type TEXT DEFAULT 'custom';
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS mercadopago_id TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS mercadopago_status TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS features TEXT[] DEFAULT '{}';
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS invoice_url TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Verificar que se agregaron las columnas
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'payments' 
ORDER BY ordinal_position;
