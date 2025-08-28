
import { MERCADOPAGO_CONFIG, PAYMENT_TYPES, PAYMENT_STATUS, formatCurrency, toCents } from './mercadopago';
import { supabase } from './supabase';

export interface Payment {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  paymentType: string;
  amount: number;
  currency: string;
  status: string;
  mercadopagoId?: string;
  mercadopagoStatus?: string;
  paymentMethod?: string;
  installments?: number;
  description: string;
  features: string[];
  createdAt: string;
  updatedAt: string;
  paidAt?: string;
  invoiceUrl?: string;
  metadata?: any;
}

export interface CreatePaymentData {
  userId: string;
  userEmail: string;
  userName: string;
  paymentType: string;
  description?: string;
  customAmount?: number;
}

// Crear preferencia de pago en Mercado Pago
export const createMercadoPagoPreference = async (paymentData: CreatePaymentData) => {
  try {
    const paymentType = PAYMENT_TYPES[paymentData.paymentType as keyof typeof PAYMENT_TYPES];
    if (!paymentType) {
      throw new Error('Tipo de pago no válido');
    }

    const amount = paymentData.customAmount || paymentType.price;
    
    // Crear preferencia en Mercado Pago
    const preference = {
      items: [
        {
          title: paymentType.name,
          description: paymentType.description,
          quantity: 1,
          unit_price: fromCents(amount)
        }
      ],
      payer: {
        email: paymentData.userEmail,
        name: paymentData.userName
      },
      back_urls: {
        success: MERCADOPAGO_CONFIG.SUCCESS_URL,
        pending: MERCADOPAGO_CONFIG.PENDING_URL,
        failure: MERCADOPAGO_CONFIG.FAILURE_URL
      },
      auto_return: 'approved',
      external_reference: `payment_${Date.now()}`,
      notification_url: MERCADOPAGO_CONFIG.WEBHOOK_URL,
      expires: true,
      expiration_date_to: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 horas
    };

    // En producción, esto se haría desde el backend
    // Por ahora simulamos la creación
    const mockPreferenceId = `pref_${Date.now()}`;
    
    // Guardar en Supabase
    const { data: paymentDoc, error: paymentError } = await supabase
      .from('payments')
      .insert({
        userId: paymentData.userId,
        userEmail: paymentData.userEmail,
        userName: paymentData.userName,
        paymentType: paymentData.paymentType,
        amount: amount,
        currency: paymentType.currency,
        status: 'pending',
        mercadopagoId: mockPreferenceId,
        description: paymentType.description,
        features: paymentType.features,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metadata: {
          preference: preference,
          paymentType: paymentType
        }
      })
      .select()
      .single();
    
    if (paymentError) throw paymentError;

    return {
      preferenceId: mockPreferenceId,
      paymentId: paymentDoc.id,
      initPoint: `https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=${mockPreferenceId}`,
      sandboxInitPoint: `https://sandbox.mercadopago.com.ar/checkout/v1/redirect?pref_id=${mockPreferenceId}`
    };
  } catch (error) {
    console.error('Error creating Mercado Pago preference:', error);
    throw error;
  }
};

// Procesar webhook de Mercado Pago
export const processMercadoPagoWebhook = async (webhookData: any) => {
  try {
    const { data, type } = webhookData;
    
    if (type === 'payment') {
      const paymentId = data.id;
      
      // Obtener información del pago desde Mercado Pago
      const paymentInfo = await getMercadoPagoPayment(paymentId);
      
      // Buscar el pago en Firestore
      const paymentsRef = collection(firestore, 'payments');
      const q = query(paymentsRef, where('mercadopagoId', '==', paymentInfo.external_reference));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const paymentDoc = querySnapshot.docs[0];
        const paymentData = paymentDoc.data();
        
        // Actualizar estado del pago
        await updateDoc(doc(firestore, 'payments', paymentDoc.id), {
          status: paymentInfo.status,
          mercadopagoStatus: paymentInfo.status,
          paymentMethod: paymentInfo.payment_method?.type,
          installments: paymentInfo.installments,
          paidAt: paymentInfo.status === 'approved' ? serverTimestamp() : null,
          updatedAt: serverTimestamp(),
          metadata: {
            ...paymentData.metadata,
            mercadopagoPayment: paymentInfo
          }
        });

        // Si el pago fue aprobado, crear factura
        if (paymentInfo.status === 'approved') {
          await generateInvoice(paymentDoc.id, paymentData, paymentInfo);
        }

        return {
          success: true,
          paymentId: paymentDoc.id,
          status: paymentInfo.status
        };
      }
    }
    
    return { success: false, error: 'Payment not found' };
  } catch (error) {
    console.error('Error processing webhook:', error);
    throw error;
  }
};

// Obtener información de pago desde Mercado Pago
const getMercadoPagoPayment = async (paymentId: string) => {
  // En producción, esto se haría con la API de Mercado Pago
  // Por ahora simulamos la respuesta
  return {
    id: paymentId,
    status: 'approved',
    external_reference: `payment_${Date.now()}`,
    payment_method: {
      type: 'credit_card',
      id: 'visa'
    },
    installments: 1,
    transaction_amount: 999.00,
    currency: 'ARS'
  };
};

// Generar factura
const generateInvoice = async (paymentId: string, paymentData: any, mercadopagoData: any) => {
  try {
    const invoiceNumber = `INV-${paymentId.slice(-6)}`;
    const invoiceData = {
      number: invoiceNumber,
      date: new Date().toISOString(),
      customer: {
        name: paymentData.userName,
        email: paymentData.userEmail
      },
      items: [
        {
          description: paymentData.description,
          amount: formatCurrency(paymentData.amount, paymentData.currency),
          quantity: 1
        }
      ],
      total: formatCurrency(paymentData.amount, paymentData.currency),
      paymentMethod: mercadopagoData.payment_method?.type || 'Mercado Pago',
      mercadopagoId: mercadopagoData.id
    };

    // En producción, generar PDF real
    const invoiceUrl = `https://tuweb-ai.com/invoices/${invoiceNumber}.pdf`;
    
    await updateDoc(doc(firestore, 'payments', paymentId), {
      invoiceUrl: invoiceUrl,
      invoiceNumber: invoiceNumber,
      updatedAt: serverTimestamp()
    });

    return invoiceUrl;
  } catch (error) {
    console.error('Error generating invoice:', error);
    throw error;
  }
};

// Obtener pagos del usuario
export const getUserPayments = (userEmail: string, callback: (payments: Payment[]) => void) => {
  const paymentsRef = collection(firestore, 'payments');
  const q = query(paymentsRef, where('userEmail', '==', userEmail));
  
  return onSnapshot(q, (snapshot) => {
    const payments = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Payment[];
    
    callback(payments);
  });
};

// Obtener todos los pagos (para admin)
export const getAllPayments = (callback: (payments: Payment[]) => void) => {
  const paymentsRef = collection(firestore, 'payments');
  
  return onSnapshot(paymentsRef, (snapshot) => {
    const payments = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Payment[];
    
    callback(payments);
  });
};

// Función auxiliar para convertir de centavos
const fromCents = (amount: number) => {
  return amount / 100;
}; 
