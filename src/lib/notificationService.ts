import { sendEmailWithTemplate } from './emailService';
import { websocketService } from './websocketService';

interface NotificationData {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  recipientEmail: string;
  recipientName?: string;
  action?: {
    type: 'navigate' | 'open_modal' | 'refresh';
    url?: string;
    modal?: string;
  };
  metadata?: {
    projectId?: string;
    taskId?: string;
    ticketId?: string;
    userId?: string;
  };
}

interface EmailNotificationTemplate {
  subject: string;
  html: string;
  text: string;
}

class NotificationService {
  private emailTemplates: Map<string, EmailNotificationTemplate> = new Map();

  constructor() {
    this.initializeTemplates();
  }

  private initializeTemplates() {
    // Template para nuevos proyectos
    this.emailTemplates.set('new_project', {
      subject: '🎉 Nuevo proyecto creado',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">¡Nuevo Proyecto Creado!</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Tu proyecto está listo para comenzar</p>
          </div>
          <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h2 style="color: #333; margin-bottom: 20px;">{{projectName}}</h2>
            <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">{{message}}</p>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #333; margin: 0 0 10px 0;">Detalles del Proyecto:</h3>
              <ul style="color: #666; margin: 0; padding-left: 20px;">
                <li><strong>Tipo:</strong> {{projectType}}</li>
                <li><strong>Descripción:</strong> {{projectDescription}}</li>
                <li><strong>Fecha de creación:</strong> {{creationDate}}</li>
              </ul>
            </div>
            <div style="text-align: center; margin-top: 30px;">
              <a href="{{actionUrl}}" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Ver Proyecto</a>
            </div>
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #999; font-size: 14px;">
              <p>Este es un mensaje automático de TuWebAI Dashboard</p>
            </div>
          </div>
        </div>
      `,
      text: `
        ¡Nuevo Proyecto Creado!
        
        {{projectName}}
        {{message}}
        
        Detalles del Proyecto:
        - Tipo: {{projectType}}
        - Descripción: {{projectDescription}}
        - Fecha de creación: {{creationDate}}
        
        Ver proyecto: {{actionUrl}}
        
        ---
        TuWebAI Dashboard
      `
    });

    // Template para tareas asignadas
    this.emailTemplates.set('task_assigned', {
      subject: '📋 Nueva tarea asignada',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">Nueva Tarea Asignada</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Tienes una nueva tarea pendiente</p>
          </div>
          <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h2 style="color: #333; margin-bottom: 20px;">{{taskTitle}}</h2>
            <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">{{message}}</p>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #333; margin: 0 0 10px 0;">Detalles de la Tarea:</h3>
              <ul style="color: #666; margin: 0; padding-left: 20px;">
                <li><strong>Proyecto:</strong> {{projectName}}</li>
                <li><strong>Prioridad:</strong> {{priority}}</li>
                <li><strong>Fecha límite:</strong> {{dueDate}}</li>
                <li><strong>Descripción:</strong> {{taskDescription}}</li>
              </ul>
            </div>
            <div style="text-align: center; margin-top: 30px;">
              <a href="{{actionUrl}}" style="background: #4facfe; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Ver Tarea</a>
            </div>
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #999; font-size: 14px;">
              <p>Este es un mensaje automático de TuWebAI Dashboard</p>
            </div>
          </div>
        </div>
      `,
      text: `
        Nueva Tarea Asignada
        
        {{taskTitle}}
        {{message}}
        
        Detalles de la Tarea:
        - Proyecto: {{projectName}}
        - Prioridad: {{priority}}
        - Fecha límite: {{dueDate}}
        - Descripción: {{taskDescription}}
        
        Ver tarea: {{actionUrl}}
        
        ---
        TuWebAI Dashboard
      `
    });

    // Template para mensajes de chat
    this.emailTemplates.set('new_message', {
      subject: '💬 Nuevo mensaje en el chat',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%); color: #333; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">Nuevo Mensaje</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.8;">Tienes un nuevo mensaje en el chat</p>
          </div>
          <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #a8edea;">
              <p style="color: #333; line-height: 1.6; margin: 0; font-style: italic;">"{{messageContent}}"</p>
              <p style="color: #666; font-size: 14px; margin: 10px 0 0 0;">- {{senderName}}</p>
            </div>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #333; margin: 0 0 10px 0;">Detalles:</h3>
              <ul style="color: #666; margin: 0; padding-left: 20px;">
                <li><strong>Proyecto:</strong> {{projectName}}</li>
                <li><strong>Remitente:</strong> {{senderName}}</li>
                <li><strong>Hora:</strong> {{timestamp}}</li>
              </ul>
            </div>
            <div style="text-align: center; margin-top: 30px;">
              <a href="{{actionUrl}}" style="background: #a8edea; color: #333; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Responder</a>
            </div>
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #999; font-size: 14px;">
              <p>Este es un mensaje automático de TuWebAI Dashboard</p>
            </div>
          </div>
        </div>
      `,
      text: `
        Nuevo Mensaje
        
        "{{messageContent}}"
        - {{senderName}}
        
        Detalles:
        - Proyecto: {{projectName}}
        - Remitente: {{senderName}}
        - Hora: {{timestamp}}
        
        Responder: {{actionUrl}}
        
        ---
        TuWebAI Dashboard
      `
    });

    // Template para alertas de seguridad
    this.emailTemplates.set('security_alert', {
      subject: '🚨 Alerta de Seguridad',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">Alerta de Seguridad</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Acción requerida inmediatamente</p>
          </div>
          <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h2 style="color: #333; margin-bottom: 20px;">{{alertTitle}}</h2>
            <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">{{message}}</p>
            <div style="background: #fff5f5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ff6b6b;">
              <h3 style="color: #333; margin: 0 0 10px 0;">Acción Requerida:</h3>
              <p style="color: #666; margin: 0;">{{requiredAction}}</p>
            </div>
            <div style="text-align: center; margin-top: 30px;">
              <a href="{{actionUrl}}" style="background: #ff6b6b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Ver Detalles</a>
            </div>
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #999; font-size: 14px;">
              <p>Este es un mensaje automático de TuWebAI Dashboard</p>
            </div>
          </div>
        </div>
      `,
      text: `
        Alerta de Seguridad
        
        {{alertTitle}}
        {{message}}
        
        Acción Requerida:
        {{requiredAction}}
        
        Ver detalles: {{actionUrl}}
        
        ---
        TuWebAI Dashboard
      `
    });
  }

  public async sendNotification(notification: NotificationData): Promise<boolean> {
    try {
      // Enviar notificación push (WebSocket)
      websocketService.sendMessage({
        id: notification.id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        timestamp: new Date().toISOString(),
        read: false,
        action: notification.action,
        metadata: notification.metadata
      });

      // Enviar notificación por email si está configurado
      const preferences = this.getNotificationPreferences();
      const notificationType = this.getNotificationType(notification);
      
      if (preferences.email && this.shouldSendEmail(notificationType, preferences)) {
        await this.sendEmailNotification(notification);
      }

      return true;
    } catch (error) {
      console.error('Error sending notification:', error);
      return false;
    }
  }

  private getNotificationType(notification: NotificationData): string {
    if (notification.metadata?.projectId && notification.title.includes('proyecto')) {
      return 'new_project';
    } else if (notification.metadata?.taskId) {
      return 'task_assigned';
    } else if (notification.title.includes('mensaje')) {
      return 'new_message';
    } else if (notification.type === 'error' && notification.title.includes('seguridad')) {
      return 'security_alert';
    }
    return 'general';
  }

  private getNotificationPreferences() {
    try {
      const saved = localStorage.getItem('notificationPreferences');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          email: parsed.globalEnabled !== false,
          quietHours: parsed.quietHours || false,
          quietStart: parsed.quietStart || '22:00',
          quietEnd: parsed.quietEnd || '08:00'
        };
      }
    } catch (error) {
      console.error('Error loading notification preferences:', error);
    }
    return { email: true, quietHours: false, quietStart: '22:00', quietEnd: '08:00' };
  }

  private shouldSendEmail(notificationType: string, preferences: any): boolean {
    // Verificar horas silenciosas
    if (preferences.quietHours) {
      const now = new Date();
      const currentTime = now.getHours() * 60 + now.getMinutes();
      const [startHour, startMin] = preferences.quietStart.split(':').map(Number);
      const [endHour, endMin] = preferences.quietEnd.split(':').map(Number);
      const startTime = startHour * 60 + startMin;
      const endTime = endHour * 60 + endMin;
      
      if (startTime <= endTime) {
        if (currentTime >= startTime && currentTime <= endTime) {
          return false;
        }
      } else {
        if (currentTime >= startTime || currentTime <= endTime) {
          return false;
        }
      }
    }

    return true;
  }

  private async sendEmailNotification(notification: NotificationData): Promise<void> {
    const template = this.emailTemplates.get(this.getNotificationType(notification));
    if (!template) {
      console.warn('No email template found for notification type:', this.getNotificationType(notification));
      return;
    }

    const templateData = this.prepareTemplateData(notification, template);
    
    try {
      await sendEmailWithTemplate('notification', {
        to_email: notification.recipientEmail,
        subject: templateData.subject,
        html: templateData.html,
        text: templateData.text
      });
      
      console.log('Email notification sent successfully to:', notification.recipientEmail);
    } catch (error) {
      console.error('Error sending email notification:', error);
      throw error;
    }
  }

  private prepareTemplateData(notification: NotificationData, template: EmailNotificationTemplate): EmailNotificationTemplate {
    let subject = template.subject;
    let html = template.html;
    let text = template.text;

    // Reemplazar variables en el template
    const variables = {
      '{{projectName}}': notification.metadata?.projectId || 'Proyecto',
      '{{message}}': notification.message,
      '{{actionUrl}}': notification.action?.url || '#',
      '{{taskTitle}}': notification.title,
      '{{taskDescription}}': notification.message,
      '{{priority}}': 'Media',
      '{{dueDate}}': new Date().toLocaleDateString('es-ES'),
      '{{projectType}}': 'Web',
      '{{projectDescription}}': notification.message,
      '{{creationDate}}': new Date().toLocaleDateString('es-ES'),
      '{{messageContent}}': notification.message,
      '{{senderName}}': 'Usuario',
      '{{timestamp}}': new Date().toLocaleString('es-ES'),
      '{{alertTitle}}': notification.title,
      '{{requiredAction}}': 'Revisar y tomar acción inmediata'
    };

    Object.entries(variables).forEach(([key, value]) => {
      subject = subject.replace(new RegExp(key, 'g'), value);
      html = html.replace(new RegExp(key, 'g'), value);
      text = text.replace(new RegExp(key, 'g'), value);
    });

    return { subject, html, text };
  }

  public addEmailTemplate(type: string, template: EmailNotificationTemplate): void {
    this.emailTemplates.set(type, template);
  }

  public getEmailTemplate(type: string): EmailNotificationTemplate | undefined {
    return this.emailTemplates.get(type);
  }
}

// Singleton instance
export const notificationService = new NotificationService();

export default notificationService; 