import { supabase } from './supabase';

// =====================================================
// WORKER DE NOTIFICACIONES AUTOMÁTICAS
// =====================================================

interface ScheduledNotification {
  id: string;
  user_id: string;
  channels: string[];
  subject?: string;
  content: string;
  scheduled_for: string;
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
  attempts: number;
  max_attempts: number;
  variables: Record<string, any>;
}

interface NotificationResult {
  success: boolean;
  message: string;
  channel: string;
  user_id: string;
}

class NotificationWorker {
  private isRunning = false;
  private intervalId: NodeJS.Timeout | null = null;
  private readonly CHECK_INTERVAL = 60000; // 1 minuto

  // =====================================================
  // INICIAR EL WORKER
  // =====================================================

  start() {
    if (this.isRunning) {
      console.log('🔔 [NotificationWorker] Ya está ejecutándose');
      return;
    }

    console.log('🚀 [NotificationWorker] Iniciando worker de notificaciones...');
    this.isRunning = true;

    // Ejecutar inmediatamente la primera verificación
    this.processScheduledNotifications();

    // Configurar intervalo para verificar cada minuto
    this.intervalId = setInterval(() => {
      this.processScheduledNotifications();
    }, this.CHECK_INTERVAL);

    console.log('✅ [NotificationWorker] Worker iniciado correctamente');
  }

  // =====================================================
  // DETENER EL WORKER
  // =====================================================

  stop() {
    if (!this.isRunning) {
      console.log('🔔 [NotificationWorker] No está ejecutándose');
      return;
    }

    console.log('🛑 [NotificationWorker] Deteniendo worker...');
    this.isRunning = false;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    console.log('✅ [NotificationWorker] Worker detenido correctamente');
  }

  // =====================================================
  // PROCESAR NOTIFICACIONES PROGRAMADAS
  // =====================================================

  private async processScheduledNotifications() {
    try {
      console.log('🔍 [NotificationWorker] Verificando notificaciones programadas...');

      // Obtener notificaciones pendientes que ya deberían haberse enviado
      const now = new Date().toISOString();
      const { data: notifications, error } = await supabase
        .from('scheduled_notifications')
        .select('*')
        .eq('status', 'pending')
        .lte('scheduled_for', now)
        .lt('attempts', 'max_attempts');

      if (error) {
        console.error('❌ [NotificationWorker] Error al obtener notificaciones:', error);
        return;
      }

      if (!notifications || notifications.length === 0) {
        console.log('ℹ️ [NotificationWorker] No hay notificaciones pendientes para enviar');
        return;
      }

      console.log(`📤 [NotificationWorker] Procesando ${notifications.length} notificaciones...`);

      // Procesar cada notificación
      for (const notification of notifications) {
        await this.processNotification(notification);
      }

      console.log('✅ [NotificationWorker] Procesamiento completado');
    } catch (error) {
      console.error('❌ [NotificationWorker] Error en el procesamiento:', error);
    }
  }

  // =====================================================
  // PROCESAR UNA NOTIFICACIÓN INDIVIDUAL
  // =====================================================

  private async processNotification(notification: ScheduledNotification) {
    try {
      console.log(`📨 [NotificationWorker] Procesando notificación ${notification.id}...`);

      // Incrementar intentos
      const newAttempts = notification.attempts + 1;

      // Procesar cada canal
      const results: NotificationResult[] = [];
      
      for (const channel of notification.channels) {
        const result = await this.sendNotification(notification, channel);
        results.push(result);
      }

      // Verificar si todos los canales fallaron
      const allFailed = results.every(r => !r.success);
      
      if (allFailed && newAttempts >= notification.max_attempts) {
        // Marcar como fallida si se agotaron los intentos
        await this.updateNotificationStatus(notification.id, 'failed', newAttempts, 'Se agotaron los intentos de envío');
        console.log(`❌ [NotificationWorker] Notificación ${notification.id} marcada como fallida`);
      } else if (allFailed) {
        // Actualizar intentos si aún hay oportunidades
        await this.updateNotificationAttempts(notification.id, newAttempts);
        console.log(`⚠️ [NotificationWorker] Notificación ${notification.id} - Intento ${newAttempts}/${notification.max_attempts}`);
      } else {
        // Marcar como enviada si al menos un canal funcionó
        await this.updateNotificationStatus(notification.id, 'sent', newAttempts);
        console.log(`✅ [NotificationWorker] Notificación ${notification.id} enviada exitosamente`);
      }

      // Registrar analytics
      await this.recordAnalytics(notification, results);

    } catch (error) {
      console.error(`❌ [NotificationWorker] Error procesando notificación ${notification.id}:`, error);
      
      // Marcar como fallida en caso de error crítico
      await this.updateNotificationStatus(
        notification.id, 
        'failed', 
        notification.attempts + 1, 
        `Error crítico: ${error instanceof Error ? error.message : 'Error desconocido'}`
      );
    }
  }

  // =====================================================
  // ENVIAR NOTIFICACIÓN POR CANAL
  // =====================================================

  private async sendNotification(notification: ScheduledNotification, channel: string): Promise<NotificationResult> {
    try {
      switch (channel) {
        case 'email':
          return await this.sendEmailNotification(notification);
        
        case 'push':
          return await this.sendPushNotification(notification);
        
        case 'in-app':
          return await this.sendInAppNotification(notification);
        
        default:
          return {
            success: false,
            message: `Canal no soportado: ${channel}`,
            channel,
            user_id: notification.user_id
          };
      }
    } catch (error) {
      return {
        success: false,
        message: `Error en canal ${channel}: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        channel,
        user_id: notification.user_id
      };
    }
  }

  // =====================================================
  // ENVIAR NOTIFICACIÓN POR EMAIL
  // =====================================================

  private async sendEmailNotification(notification: ScheduledNotification): Promise<NotificationResult> {
    try {
      // Obtener información del usuario
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('email, full_name')
        .eq('id', notification.user_id)
        .single();

      if (userError || !user) {
        return {
          success: false,
          message: 'Usuario no encontrado',
          channel: 'email',
          user_id: notification.user_id
        };
      }

      // Aquí implementarías el envío real de email
      // Por ahora simulamos el envío exitoso
      console.log(`📧 [NotificationWorker] Enviando email a ${user.email}: ${notification.subject}`);
      
      // Simular delay de envío
      await new Promise(resolve => setTimeout(resolve, 1000));

      return {
        success: true,
        message: 'Email enviado exitosamente',
        channel: 'email',
        user_id: notification.user_id
      };
    } catch (error) {
      return {
        success: false,
        message: `Error enviando email: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        channel: 'email',
        user_id: notification.user_id
      };
    }
  }

  // =====================================================
  // ENVIAR NOTIFICACIÓN PUSH
  // =====================================================

  private async sendPushNotification(notification: ScheduledNotification): Promise<NotificationResult> {
    try {
      // Obtener suscripciones push del usuario
      const { data: subscriptions, error: subError } = await supabase
        .from('push_subscriptions')
        .select('*')
        .eq('user_id', notification.user_id)
        .eq('is_active', true);

      if (subError || !subscriptions || subscriptions.length === 0) {
        return {
          success: false,
          message: 'No hay suscripciones push activas',
          channel: 'push',
          user_id: notification.user_id
        };
      }

      // Simular envío de push notifications
      console.log(`📱 [NotificationWorker] Enviando push a ${subscriptions.length} dispositivos`);
      
      // Simular delay de envío
      await new Promise(resolve => setTimeout(resolve, 500));

      return {
        success: true,
        message: `Push enviado a ${subscriptions.length} dispositivos`,
        channel: 'push',
        user_id: notification.user_id
      };
    } catch (error) {
      return {
        success: false,
        message: `Error enviando push: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        channel: 'push',
        user_id: notification.user_id
      };
    }
  }

  // =====================================================
  // ENVIAR NOTIFICACIÓN IN-APP
  // =====================================================

  private async sendInAppNotification(notification: ScheduledNotification): Promise<NotificationResult> {
    try {
      // Crear notificación in-app en la tabla notifications
      const { error } = await supabase
        .from('notifications')
        .insert([{
          user_id: notification.user_id,
          title: notification.subject || 'Notificación',
          message: notification.content,
          type: 'info',
          category: 'system',
          metadata: {
            scheduled_notification_id: notification.id,
            channel: 'in-app'
          }
        }]);

      if (error) {
        return {
          success: false,
          message: `Error creando notificación in-app: ${error.message}`,
          channel: 'in-app',
          user_id: notification.user_id
        };
      }

      console.log(`💬 [NotificationWorker] Notificación in-app creada para usuario ${notification.user_id}`);
      
      return {
        success: true,
        message: 'Notificación in-app creada exitosamente',
        channel: 'in-app',
        user_id: notification.user_id
      };
    } catch (error) {
      return {
        success: false,
        message: `Error creando notificación in-app: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        channel: 'in-app',
        user_id: notification.user_id
      };
    }
  }

  // =====================================================
  // ACTUALIZAR ESTADO DE NOTIFICACIÓN
  // =====================================================

  private async updateNotificationStatus(
    id: string, 
    status: 'sent' | 'failed', 
    attempts: number, 
    errorMessage?: string
  ) {
    try {
      const updateData: any = {
        status,
        attempts,
        updated_at: new Date().toISOString()
      };

      if (status === 'sent') {
        updateData.sent_at = new Date().toISOString();
      } else if (status === 'failed' && errorMessage) {
        updateData.error_message = errorMessage;
      }

      const { error } = await supabase
        .from('scheduled_notifications')
        .update(updateData)
        .eq('id', id);

      if (error) {
        console.error('❌ [NotificationWorker] Error actualizando estado:', error);
      }
    } catch (error) {
      console.error('❌ [NotificationWorker] Error actualizando estado:', error);
    }
  }

  // =====================================================
  // ACTUALIZAR INTENTOS DE NOTIFICACIÓN
  // =====================================================

  private async updateNotificationAttempts(id: string, attempts: number) {
    try {
      const { error } = await supabase
        .from('scheduled_notifications')
        .update({
          attempts,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        console.error('❌ [NotificationWorker] Error actualizando intentos:', error);
      }
    } catch (error) {
      console.error('❌ [NotificationWorker] Error actualizando intentos:', error);
    }
  }

  // =====================================================
  // REGISTRAR ANALYTICS
  // =====================================================

  private async recordAnalytics(notification: ScheduledNotification, results: NotificationResult[]) {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      for (const result of results) {
        // Buscar registro existente para hoy y este canal
        const { data: existing, error: searchError } = await supabase
          .from('notification_analytics')
          .select('*')
          .eq('date', today)
          .eq('channel', result.channel)
          .eq('category', 'system')
          .single();

        if (searchError && searchError.code !== 'PGRST116') {
          console.error('❌ [NotificationWorker] Error buscando analytics:', searchError);
          continue;
        }

        if (existing) {
          // Actualizar registro existente
          const updateData: any = {
            sent_count: existing.sent_count + 1,
            updated_at: new Date().toISOString()
          };

          if (result.success) {
            updateData.delivered_count = existing.delivered_count + 1;
          } else {
            updateData.failed_count = existing.failed_count + 1;
          }

          const { error: updateError } = await supabase
            .from('notification_analytics')
            .update(updateData)
            .eq('id', existing.id);

          if (updateError) {
            console.error('❌ [NotificationWorker] Error actualizando analytics:', updateError);
          }
        } else {
          // Crear nuevo registro
          const analyticsData = {
            date: today,
            channel: result.channel,
            category: 'system',
            sent_count: 1,
            delivered_count: result.success ? 1 : 0,
            failed_count: result.success ? 0 : 1,
            opened_count: 0,
            clicked_count: 0,
            bounce_count: 0
          };

          const { error: insertError } = await supabase
            .from('notification_analytics')
            .insert([analyticsData]);

          if (insertError) {
            console.error('❌ [NotificationWorker] Error creando analytics:', insertError);
          }
        }
      }
    } catch (error) {
      console.error('❌ [NotificationWorker] Error registrando analytics:', error);
    }
  }

  // =====================================================
  // ESTADO DEL WORKER
  // =====================================================

  getStatus() {
    return {
      isRunning: this.isRunning,
      lastCheck: new Date().toISOString()
    };
  }
}

// =====================================================
// INSTANCIA GLOBAL DEL WORKER
// =====================================================

export const notificationWorker = new NotificationWorker();

// =====================================================
// INICIAR AUTOMÁTICAMENTE EN DESARROLLO
// =====================================================

if (process.env.NODE_ENV === 'development') {
  // Solo iniciar en desarrollo para testing
  console.log('🔧 [NotificationWorker] Modo desarrollo detectado');
  // notificationWorker.start();
}
