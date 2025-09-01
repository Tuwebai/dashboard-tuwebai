import { supabase } from './supabase';
import { notificationChannelService } from './notificationChannelService';

// =====================================================
// INTERFACES Y TIPOS
// =====================================================

export interface PushSubscriptionData {
  endpoint: string;
  p256dh: string;
  auth: string;
}

export interface PushNotificationPayload {
  title: string;
  message: string;
  icon?: string;
  badge?: string;
  image?: string;
  tag?: string;
  data?: Record<string, any>;
  actions?: PushNotificationAction[];
  requireInteraction?: boolean;
  silent?: boolean;
  vibrate?: number[];
  timestamp?: number;
  isUrgent?: boolean;
  category?: string;
  metadata?: Record<string, any>;
}

export interface PushNotificationAction {
  action: string;
  title: string;
  icon?: string;
}

export interface DeviceInfo {
  userAgent: string;
  platform: string;
  language: string;
  timezone: string;
  screenResolution?: string;
  deviceMemory?: number;
  hardwareConcurrency?: number;
  connectionType?: string;
  effectiveType?: string;
}

export interface PushSubscriptionStatus {
  isSupported: boolean;
  permission: NotificationPermission;
  isSubscribed: boolean;
  subscription?: PushSubscriptionData;
  error?: string;
}

// =====================================================
// SERVICIO DE NOTIFICACIONES PUSH
// =====================================================

export class PushNotificationService {
  private static instance: PushNotificationService;
  private registration: ServiceWorkerRegistration | null = null;
  private isInitialized = false;
  private vapidPublicKey: string | null = null;

  private constructor() {
    this.initialize();
  }

  static getInstance(): PushNotificationService {
    if (!PushNotificationService.instance) {
      PushNotificationService.instance = new PushNotificationService();
    }
    return PushNotificationService.instance;
  }

  // =====================================================
  // INICIALIZACIÓN
  // =====================================================

  private async initialize(): Promise<void> {
    try {
      // Verificar soporte para Service Workers
      if (!('serviceWorker' in navigator)) {
        console.warn('⚠️ Service Workers no soportados');
        return;
      }

      // Verificar soporte para Push API
      if (!('PushManager' in window)) {
        console.warn('⚠️ Push API no soportada');
        return;
      }

      // Registrar Service Worker
      await this.registerServiceWorker();
      
      // Obtener clave VAPID pública
      await this.loadVapidPublicKey();
      
      this.isInitialized = true;
      console.log('✅ PushNotificationService inicializado correctamente');
    } catch (error) {
      console.error('❌ Error inicializando PushNotificationService:', error);
    }
  }

  private async registerServiceWorker(): Promise<void> {
    try {
      this.registration = await navigator.serviceWorker.register('/sw.js');
      console.log('✅ Service Worker registrado:', this.registration);
      
      // Esperar a que el Service Worker esté activo
      await navigator.serviceWorker.ready;
      console.log('✅ Service Worker listo');
    } catch (error) {
      console.error('❌ Error registrando Service Worker:', error);
      throw error;
    }
  }

  private async loadVapidPublicKey(): Promise<void> {
    try {
      // En producción, esto vendría de las variables de entorno
      this.vapidPublicKey = process.env.VAPID_PUBLIC_KEY || 
        'BEl62iUYgUivxIkv69yViEuiBIa1HI0F-K-Yw6X5N3iE5qVcK7o5cGcJPBXvRHnMHYfJs5t2ns1DmjX1xDnBUR9c';
      
      console.log('🔑 Clave VAPID pública cargada');
    } catch (error) {
      console.error('❌ Error cargando clave VAPID:', error);
    }
  }

  // =====================================================
  // GESTIÓN DE PERMISOS
  // =====================================================

  async requestPermission(): Promise<NotificationPermission> {
    try {
      if (!('Notification' in window)) {
        throw new Error('Este navegador no soporta notificaciones push');
      }

      const permission = await Notification.requestPermission();
      console.log('🔐 Permiso de notificaciones:', permission);
      
      return permission;
    } catch (error) {
      console.error('❌ Error solicitando permiso:', error);
      throw error;
    }
  }

  async getPermissionStatus(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      return 'denied';
    }
    
    return Notification.permission;
  }

  // =====================================================
  // GESTIÓN DE SUSCRIPCIONES
  // =====================================================

  async subscribeToPush(userId: string): Promise<PushSubscriptionData | null> {
    try {
      if (!this.registration) {
        throw new Error('Service Worker no registrado');
      }

      // Verificar permisos
      const permission = await this.getPermissionStatus();
      if (permission !== 'granted') {
        const newPermission = await this.requestPermission();
        if (newPermission !== 'granted') {
          throw new Error('Permiso de notificaciones denegado');
        }
      }

      // Obtener suscripción existente
      let subscription = await this.registration.pushManager.getSubscription();
      
      if (!subscription) {
        // Crear nueva suscripción
        subscription = await this.registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey!)
        });
      }

      // Convertir a formato compatible
      const subscriptionData: PushSubscriptionData = {
        endpoint: subscription.endpoint,
        p256dh: this.arrayBufferToBase64(subscription.getKey('p256dh')!),
        auth: this.arrayBufferToBase64(subscription.getKey('auth')!)
      };

      // Obtener información del dispositivo
      const deviceInfo = this.getDeviceInfo();

      // Guardar suscripción en la base de datos
      await notificationChannelService.addPushSubscription(userId, {
        endpoint: subscriptionData.endpoint,
        p256dh: subscriptionData.p256dh,
        auth: subscriptionData.auth,
        deviceInfo,
        isActive: true
      });

      console.log('✅ Suscripción push creada para usuario:', userId);
      return subscriptionData;
    } catch (error) {
      console.error('❌ Error suscribiendo a push:', error);
      throw error;
    }
  }

  async unsubscribeFromPush(userId: string): Promise<boolean> {
    try {
      if (!this.registration) {
        throw new Error('Service Worker no registrado');
      }

      // Obtener suscripción actual
      const subscription = await this.registration.pushManager.getSubscription();
      
      if (subscription) {
        // Cancelar suscripción
        await subscription.unsubscribe();
        console.log('✅ Suscripción push cancelada');
      }

      // Desactivar en la base de datos
      const userSubscriptions = await notificationChannelService.getUserPushSubscriptions(userId);
      for (const sub of userSubscriptions) {
        await notificationChannelService.deactivatePushSubscription(sub.id);
      }

      console.log('✅ Usuario desuscrito de push notifications');
      return true;
    } catch (error) {
      console.error('❌ Error desuscribiendo de push:', error);
      return false;
    }
  }

  async getSubscriptionStatus(userId: string): Promise<PushSubscriptionStatus> {
    try {
      const isSupported = 'serviceWorker' in navigator && 'PushManager' in window;
      const permission = await this.getPermissionStatus();
      
      if (!isSupported || permission !== 'granted') {
        return {
          isSupported,
          permission,
          isSubscribed: false
        };
      }

      // Verificar suscripción en Service Worker
      let isSubscribed = false;
      let subscription: PushSubscriptionData | undefined;

      if (this.registration) {
        const swSubscription = await this.registration.pushManager.getSubscription();
        if (swSubscription) {
          isSubscribed = true;
          subscription = {
            endpoint: swSubscription.endpoint,
            p256dh: this.arrayBufferToBase64(swSubscription.getKey('p256dh')!),
            auth: this.arrayBufferToBase64(swSubscription.getKey('auth')!)
          };
        }
      }

      // Verificar en base de datos
      const dbSubscriptions = await notificationChannelService.getUserPushSubscriptions(userId);
      const hasActiveSubscription = dbSubscriptions.some(sub => sub.isActive);

      return {
        isSupported,
        permission,
        isSubscribed: isSubscribed && hasActiveSubscription,
        subscription: subscription || undefined
      };
    } catch (error) {
      console.error('❌ Error obteniendo estado de suscripción:', error);
      return {
        isSupported: false,
        permission: 'denied',
        isSubscribed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // =====================================================
  // ENVÍO DE NOTIFICACIONES
  // =====================================================

  async sendPushNotification(
    userIds: string[], 
    payload: PushNotificationPayload
  ): Promise<boolean> {
    try {
      if (!this.isInitialized) {
        throw new Error('PushNotificationService no inicializado');
      }

      // Enviar a través del canal de push
      const results = await Promise.allSettled(
        userIds.map(userId => 
          notificationChannelService.sendToChannels(
            payload,
            { id: userId },
            ['push']
          )
        )
      );

      const successCount = results.filter(r => r.status === 'fulfilled').length;
      const totalCount = results.length;

      console.log(`📱 Push notifications enviadas: ${successCount}/${totalCount}`);
      return successCount > 0;
    } catch (error) {
      console.error('❌ Error enviando push notifications:', error);
      return false;
    }
  }

  async sendPushToAllUsers(payload: PushNotificationPayload): Promise<boolean> {
    try {
      // Obtener todos los usuarios con suscripciones push activas
      const { data: users, error } = await supabase
        .from('users')
        .select('id')
        .eq('push_notifications', true);

      if (error) throw error;

      if (!users || users.length === 0) {
        console.log('📱 No hay usuarios con push notifications habilitadas');
        return false;
      }

      const userIds = users.map(user => user.id);
      return await this.sendPushNotification(userIds, payload);
    } catch (error) {
      console.error('❌ Error enviando push a todos los usuarios:', error);
      return false;
    }
  }

  // =====================================================
  // NOTIFICACIONES PROGRAMADAS
  // =====================================================

  async schedulePushNotification(
    userIds: string[],
    payload: PushNotificationPayload,
    sendAt: Date
  ): Promise<string> {
    try {
      const now = new Date();
      const delay = sendAt.getTime() - now.getTime();

      if (delay <= 0) {
        throw new Error('La fecha de envío debe ser en el futuro');
      }

      // Crear ID único para la notificación programada
      const scheduledId = `scheduled_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Programar envío
      setTimeout(async () => {
        try {
          await this.sendPushNotification(userIds, payload);
          console.log(`📅 Notificación programada enviada: ${scheduledId}`);
        } catch (error) {
          console.error(`❌ Error enviando notificación programada ${scheduledId}:`, error);
        }
      }, delay);

      console.log(`📅 Notificación programada para ${sendAt.toISOString()}: ${scheduledId}`);
      return scheduledId;
    } catch (error) {
      console.error('❌ Error programando notificación:', error);
      throw error;
    }
  }

  // =====================================================
  // NOTIFICACIONES RECURRENTES
  // =====================================================

  async createRecurringPushNotification(
    userIds: string[],
    payload: PushNotificationPayload,
    interval: 'daily' | 'weekly' | 'monthly',
    startDate: Date,
    endDate?: Date
  ): Promise<string> {
    try {
      const recurringId = `recurring_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const intervalMs = {
        daily: 24 * 60 * 60 * 1000,
        weekly: 7 * 24 * 60 * 60 * 1000,
        monthly: 30 * 24 * 60 * 60 * 1000
      }[interval];

      let currentDate = new Date(startDate);
      
      const sendRecurring = async () => {
        if (endDate && currentDate > endDate) {
          console.log(`🔄 Notificación recurrente terminada: ${recurringId}`);
          return;
        }

        try {
          await this.sendPushNotification(userIds, payload);
          console.log(`🔄 Notificación recurrente enviada: ${recurringId} - ${currentDate.toISOString()}`);
        } catch (error) {
          console.error(`❌ Error enviando notificación recurrente ${recurringId}:`, error);
        }

        currentDate = new Date(currentDate.getTime() + intervalMs);
        
        // Programar siguiente envío
        setTimeout(sendRecurring, intervalMs);
      };

      // Iniciar envío recurrente
      sendRecurring();

      console.log(`🔄 Notificación recurrente creada: ${recurringId} - ${interval}`);
      return recurringId;
    } catch (error) {
      console.error('❌ Error creando notificación recurrente:', error);
      throw error;
    }
  }

  // =====================================================
  // UTILIDADES
  // =====================================================

  private getDeviceInfo(): DeviceInfo {
    const deviceInfo: DeviceInfo = {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };

    // Información de pantalla
    if (screen.width && screen.height) {
      deviceInfo.screenResolution = `${screen.width}x${screen.height}`;
    }

    // Memoria del dispositivo
    if ('deviceMemory' in navigator) {
      deviceInfo.deviceMemory = (navigator as any).deviceMemory;
    }

    // Núcleos del procesador
    if ('hardwareConcurrency' in navigator) {
      deviceInfo.hardwareConcurrency = (navigator as any).hardwareConcurrency;
    }

    // Tipo de conexión
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      deviceInfo.connectionType = connection.effectiveType || connection.type;
      deviceInfo.effectiveType = connection.effectiveType;
    }

    return deviceInfo;
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  // =====================================================
  // MÉTODOS PÚBLICOS
  // =====================================================

  async isSupported(): Promise<boolean> {
    return 'serviceWorker' in navigator && 'PushManager' in window;
  }

  async getRegistration(): Promise<ServiceWorkerRegistration | null> {
    if (!this.registration) {
      await this.initialize();
    }
    return this.registration;
  }

  async refreshSubscription(userId: string): Promise<PushSubscriptionData | null> {
    try {
      // Desuscribir primero
      await this.unsubscribeFromPush(userId);
      
      // Crear nueva suscripción
      return await this.subscribeToPush(userId);
    } catch (error) {
      console.error('❌ Error refrescando suscripción:', error);
      return null;
    }
  }

  async testPushNotification(userId: string): Promise<boolean> {
    try {
      const testPayload: PushNotificationPayload = {
        title: '🧪 Notificación de Prueba',
        message: 'Esta es una notificación de prueba para verificar que las push notifications funcionan correctamente.',
        icon: '/icon-192x192.png',
        tag: 'test-notification',
        data: {
          type: 'test',
          timestamp: Date.now()
        }
      };

      return await this.sendPushNotification([userId], testPayload);
    } catch (error) {
      console.error('❌ Error enviando notificación de prueba:', error);
      return false;
    }
  }
}

// Instancia global del servicio
export const pushNotificationService = PushNotificationService.getInstance();
export default pushNotificationService;
