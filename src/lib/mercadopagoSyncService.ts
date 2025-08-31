import { supabase } from './supabase';
import { toast } from '@/hooks/use-toast';

export interface MercadoPagoPayment {
  id: number;
  status: string;
  status_detail: string;
  external_reference: string;
  payment_method: {
    type: string;
    id: string;
  };
  installments: number;
  transaction_amount: number;
  currency: string;
  date_created: string;
  date_last_updated: string;
  payer: {
    email: string;
    name: string;
  };
  description: string;
}

export interface SyncResult {
  success: boolean;
  syncedPayments: number;
  errors: string[];
  message: string;
}

class MercadoPagoSyncService {
  private accessToken: string;
  private baseUrl: string;

  constructor() {
    // En Vite, las variables de entorno se acceden a través de import.meta.env
    this.accessToken = import.meta.env.VITE_MERCADOPAGO_ACCESS_TOKEN || '';
    this.baseUrl = import.meta.env.VITE_MERCADOPAGO_API_URL || 'https://api.mercadopago.com';
  }

  // Sincronizar pagos desde MercadoPago
  async syncPayments(userEmail: string): Promise<SyncResult> {
    try {
      if (!this.accessToken) {
        throw new Error('Token de acceso de MercadoPago no configurado');
      }

      // Buscar pagos en MercadoPago por email del usuario
      const mercadopagoPayments = await this.getPaymentsByEmail(userEmail);
      
      if (!mercadopagoPayments || mercadopagoPayments.length === 0) {
        return {
          success: true,
          syncedPayments: 0,
          errors: [],
          message: 'No se encontraron pagos para sincronizar'
        };
      }

      let syncedCount = 0;
      const errors: string[] = [];

      // Procesar cada pago encontrado
      for (const mpPayment of mercadopagoPayments) {
        try {
          const syncResult = await this.syncSinglePayment(mpPayment, userEmail);
          if (syncResult.success) {
            syncedCount++;
          } else {
            errors.push(`Pago ${mpPayment.id}: ${syncResult.error}`);
          }
        } catch (error) {
          errors.push(`Error sincronizando pago ${mpPayment.id}: ${error}`);
        }
      }

      return {
        success: syncedCount > 0 || errors.length === 0,
        syncedPayments: syncedCount,
        errors,
        message: `Sincronización completada. ${syncedCount} pagos sincronizados.`
      };

    } catch (error) {
      console.error('Error en sincronización:', error);
      return {
        success: false,
        syncedPayments: 0,
        errors: [error.message],
        message: 'Error en la sincronización'
      };
    }
  }

  // Obtener pagos de MercadoPago por email
  private async getPaymentsByEmail(userEmail: string): Promise<MercadoPagoPayment[]> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/payments/search?payer.email=${encodeURIComponent(userEmail)}`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Error API MercadoPago: ${response.status}`);
      }

      const data = await response.json();
      return data.results || [];

    } catch (error) {
      console.error('Error obteniendo pagos de MercadoPago:', error);
      throw error;
    }
  }

  // Sincronizar un pago individual
  private async syncSinglePayment(mpPayment: MercadoPagoPayment, userEmail: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Verificar si el pago ya existe en Supabase
      const { data: existingPayment } = await supabase
        .from('payments')
        .select('id')
        .eq('mercadopagoId', mpPayment.id.toString())
        .single();

      if (existingPayment) {
        // Actualizar pago existente
        const { error: updateError } = await supabase
          .from('payments')
          .update({
            status: this.mapMercadoPagoStatus(mpPayment.status),
            mercadopagoStatus: mpPayment.status,
            paymentMethod: mpPayment.payment_method?.type,
            installments: mpPayment.installments,
            paidAt: mpPayment.status === 'approved' ? mpPayment.date_last_updated : null,
            updatedAt: new Date().toISOString(),
            metadata: {
              mercadopagoPayment: mpPayment,
              lastSync: new Date().toISOString()
            }
          })
          .eq('id', existingPayment.id);

        if (updateError) {
          throw new Error(`Error actualizando pago: ${updateError.message}`);
        }

        return { success: true };
      } else {
        // Crear nuevo pago
        const { error: insertError } = await supabase
          .from('payments')
          .insert({
                    userId: await this.getUserIdByEmail(userEmail),
        user_email: userEmail,
        user_name: mpPayment.payer?.name || 'Usuario',
            paymentType: this.determinePaymentType(mpPayment),
            amount: Math.round(mpPayment.transaction_amount * 100), // Convertir a centavos
            currency: mpPayment.currency,
            status: this.mapMercadoPagoStatus(mpPayment.status),
            mercadopagoId: mpPayment.id.toString(),
            mercadopagoStatus: mpPayment.status,
            paymentMethod: mpPayment.payment_method?.type,
            installments: mpPayment.installments,
            description: mpPayment.description || 'Pago sincronizado desde MercadoPago',
            features: this.determineFeatures(mpPayment),
            createdAt: mpPayment.date_created,
            updatedAt: mpPayment.date_last_updated,
            paidAt: mpPayment.status === 'approved' ? mpPayment.date_last_updated : null,
            metadata: {
              mercadopagoPayment: mpPayment,
              syncedAt: new Date().toISOString()
            }
          });

        if (insertError) {
          throw new Error(`Error creando pago: ${insertError.message}`);
        }

        return { success: true };
      }

    } catch (error) {
      console.error('Error sincronizando pago individual:', error);
      return { success: false, error: error.message };
    }
  }

  // Obtener ID de usuario por email
  private async getUserIdByEmail(email: string): Promise<string> {
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    return user?.id || 'unknown';
  }

  // Mapear estado de MercadoPago a estado interno
  private mapMercadoPagoStatus(mpStatus: string): string {
    const statusMap: { [key: string]: string } = {
      'approved': 'approved',
      'pending': 'pending',
      'rejected': 'rejected',
      'cancelled': 'cancelled',
      'in_process': 'pending',
      'authorized': 'pending'
    };

    return statusMap[mpStatus] || 'unknown';
  }

  // Determinar tipo de pago basado en la descripción
  private determinePaymentType(mpPayment: MercadoPagoPayment): string {
    const description = mpPayment.description?.toLowerCase() || '';
    
    if (description.includes('premium') || description.includes('pro')) return 'premium';
    if (description.includes('basic')) return 'basic';
    if (description.includes('enterprise')) return 'enterprise';
    
    return 'custom';
  }

  // Determinar características del plan
  private determineFeatures(mpPayment: MercadoPagoPayment): string[] {
    const description = mpPayment.description?.toLowerCase() || '';
    
    if (description.includes('premium') || description.includes('pro')) {
      return ['Proyectos ilimitados', 'Soporte prioritario', 'Analytics avanzados'];
    }
    if (description.includes('basic')) {
      return ['5 proyectos', 'Soporte por email', 'Funciones básicas'];
    }
    if (description.includes('enterprise')) {
      return ['Proyectos ilimitados', 'Soporte 24/7', 'API personalizada', 'Onboarding dedicado'];
    }
    
    return ['Funciones personalizadas'];
  }

  // Verificar conexión con MercadoPago
  async testConnection(): Promise<boolean> {
    try {
      if (!this.accessToken) {
        return false;
      }

      const response = await fetch(`${this.baseUrl}/v1/payments/search?limit=1`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      return response.ok;
    } catch (error) {
      console.error('Error probando conexión con MercadoPago:', error);
      return false;
    }
  }

  // Obtener estadísticas de sincronización
  async getSyncStats(userEmail: string): Promise<{
    totalPayments: number;
    syncedPayments: number;
    pendingPayments: number;
    lastSync: string | null;
  }> {
    try {
      // Pagos en Supabase
      const { data: supabasePayments } = await supabase
        .from('payments')
        .select('*')
        .eq('user_email', userEmail);

      const totalPayments = supabasePayments?.length || 0;
      const syncedPayments = supabasePayments?.filter(p => p.mercadopagoId)?.length || 0;
      const pendingPayments = supabasePayments?.filter(p => p.status === 'pending')?.length || 0;
      
      // Última sincronización
      const lastSync = supabasePayments
        ?.filter(p => p.metadata?.lastSync)
        ?.sort((a, b) => new Date(b.metadata.lastSync).getTime() - new Date(a.metadata.lastSync).getTime())[0]
        ?.metadata?.lastSync || null;

      return {
        totalPayments,
        syncedPayments,
        pendingPayments,
        lastSync
      };

    } catch (error) {
      console.error('Error obteniendo estadísticas de sincronización:', error);
      return {
        totalPayments: 0,
        syncedPayments: 0,
        pendingPayments: 0,
        lastSync: null
      };
    }
  }
}

export const mercadopagoSyncService = new MercadoPagoSyncService();
