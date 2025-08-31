-- Crear tabla de pagos para MercadoPago
CREATE TABLE IF NOT EXISTS payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  userId UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  userEmail TEXT NOT NULL,
  userName TEXT,
  paymentType TEXT DEFAULT 'custom',
  amount INTEGER NOT NULL, -- en centavos
  currency TEXT DEFAULT 'ARS',
  status TEXT DEFAULT 'pending',
  mercadopagoId TEXT UNIQUE,
  mercadopagoStatus TEXT,
  paymentMethod TEXT,
  installments INTEGER DEFAULT 1,
  description TEXT,
  features TEXT[] DEFAULT '{}',
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  paidAt TIMESTAMP WITH TIME ZONE,
  invoiceUrl TEXT,
  metadata JSONB DEFAULT '{}'
);

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_payments_userid ON payments(userId);
CREATE INDEX IF NOT EXISTS idx_payments_useremail ON payments(userEmail);
CREATE INDEX IF NOT EXISTS idx_payments_mercadopagoid ON payments(mercadopagoId);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_createdat ON payments(createdAt);

-- Habilitar RLS (Row Level Security)
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Política RLS: usuarios solo pueden ver sus propios pagos
CREATE POLICY "Users can view own payments" ON payments
  FOR SELECT USING (auth.uid() = userId);

-- Política RLS: usuarios solo pueden insertar sus propios pagos
CREATE POLICY "Users can insert own payments" ON payments
  FOR INSERT WITH CHECK (auth.uid() = userId);

-- Política RLS: usuarios solo pueden actualizar sus propios pagos
CREATE POLICY "Users can update own payments" ON payments
  FOR UPDATE USING (auth.uid() = userId);

-- Política RLS: admins pueden ver todos los pagos
CREATE POLICY "Admins can view all payments" ON payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Política RLS: admins pueden insertar/actualizar todos los pagos
CREATE POLICY "Admins can manage all payments" ON payments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Función para actualizar updatedAt automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updatedAt = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para actualizar updatedAt
CREATE TRIGGER update_payments_updated_at 
    BEFORE UPDATE ON payments 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Comentarios de la tabla
COMMENT ON TABLE payments IS 'Tabla de pagos sincronizados con MercadoPago';
COMMENT ON COLUMN payments.amount IS 'Monto en centavos (ej: 1000 = $10.00)';
COMMENT ON COLUMN payments.mercadopagoId IS 'ID único del pago en MercadoPago';
COMMENT ON COLUMN payments.features IS 'Array de características del plan comprado';
COMMENT ON COLUMN payments.metadata IS 'Metadatos adicionales del pago';
