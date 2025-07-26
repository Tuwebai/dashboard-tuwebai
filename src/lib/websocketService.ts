import { toast } from '@/hooks/use-toast';

interface NotificationMessage {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
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

class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnecting = false;
  private messageQueue: NotificationMessage[] = [];
  private listeners: Map<string, (message: NotificationMessage) => void> = new Map();

  constructor() {
    this.connect();
  }

  public connect() {
    if (this.isConnecting || this.ws?.readyState === WebSocket.OPEN) return;

    this.isConnecting = true;
    
    // Usar WebSocket local para desarrollo, en producción sería el servidor real
    const wsUrl = process.env.NODE_ENV === 'production' 
      ? 'wss://tuwebai.com/ws/notifications'
      : 'ws://localhost:5001/ws/notifications';

    try {
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = () => {
        console.log('✅ WebSocket conectado para notificaciones');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.processMessageQueue();
      };

      this.ws.onmessage = (event) => {
        try {
          const message: NotificationMessage = JSON.parse(event.data);
          this.handleNotification(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('❌ WebSocket desconectado');
        this.isConnecting = false;
        this.attemptReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.isConnecting = false;
      };

    } catch (error) {
      console.error('Error connecting to WebSocket:', error);
      this.isConnecting = false;
      this.attemptReconnect();
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    setTimeout(() => {
      console.log(`🔄 Intentando reconectar... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      this.connect();
    }, delay);
  }

  private handleNotification(message: NotificationMessage) {
    // Mostrar toast notification
    toast({
      title: message.title,
      description: message.message,
      variant: message.type === 'error' ? 'destructive' : 'default'
    });

    // Si hay acción, mostrar botón adicional
    if (message.action) {
      setTimeout(() => {
        toast({
          title: 'Acción disponible',
          description: 'Haz clic para ver más detalles'
        });
        // La acción se maneja internamente
      }, 100);
    }

    // Notificar a los listeners
    this.listeners.forEach(listener => listener(message));

    // Guardar en localStorage para historial
    this.saveToHistory(message);
  }

  private handleAction(action: { type: string; url?: string; modal?: string }) {
    switch (action.type) {
      case 'navigate':
        if (action.url) {
          window.location.href = action.url;
        }
        break;
      case 'open_modal':
        if (action.modal) {
          // Disparar evento para abrir modal
          window.dispatchEvent(new CustomEvent('openModal', { detail: action.modal }));
        }
        break;
      case 'refresh':
        window.location.reload();
        break;
    }
  }

  private saveToHistory(message: NotificationMessage) {
    try {
      const history = this.getNotificationHistory();
      history.unshift(message);
      
      // Mantener solo las últimas 100 notificaciones
      if (history.length > 100) {
        history.splice(100);
      }
      
      localStorage.setItem('notificationHistory', JSON.stringify(history));
    } catch (error) {
      console.error('Error saving notification to history:', error);
    }
  }

  private processMessageQueue() {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (message) {
        this.sendMessage(message);
      }
    }
  }

  public sendMessage(message: NotificationMessage) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      this.messageQueue.push(message);
    }
  }

  public subscribe(id: string, callback: (message: NotificationMessage) => void) {
    this.listeners.set(id, callback);
  }

  public unsubscribe(id: string) {
    this.listeners.delete(id);
  }

  public getNotificationHistory(): NotificationMessage[] {
    try {
      const history = localStorage.getItem('notificationHistory');
      return history ? JSON.parse(history) : [];
    } catch (error) {
      console.error('Error getting notification history:', error);
      return [];
    }
  }

  public markAsRead(notificationId: string) {
    try {
      const history = this.getNotificationHistory();
      const notification = history.find(n => n.id === notificationId);
      if (notification) {
        notification.read = true;
        localStorage.setItem('notificationHistory', JSON.stringify(history));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  public clearHistory() {
    try {
      localStorage.removeItem('notificationHistory');
    } catch (error) {
      console.error('Error clearing notification history:', error);
    }
  }

  public disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

// Singleton instance
export const websocketService = new WebSocketService();

// Auto-reconnect on page visibility change
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && websocketService) {
    websocketService.connect();
  }
});

export default websocketService; 