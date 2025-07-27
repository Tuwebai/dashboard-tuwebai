import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Bell, 
  Settings, 
  History, 
  MessageSquare, 
  FileText, 
  CheckSquare, 
  Users, 
  AlertTriangle,
  Zap,
  Shield,
  Clock,
  Mail
} from 'lucide-react';
import NotificationPreferences from '@/components/NotificationPreferences';
import NotificationHistory from '@/components/NotificationHistory';
import { websocketService } from '@/lib/websocketService';
import { notificationService } from '@/lib/notificationService';
import { useApp } from '@/contexts/AppContext';
import { toast } from '@/hooks/use-toast';

export default function NotificationsPage() {
  const { user } = useApp();
  const [activeTab, setActiveTab] = useState('preferences');
  const [testNotificationType, setTestNotificationType] = useState('info');

  const sendTestNotification = async () => {
    if (!user?.email) {
      toast({
        title: 'Error',
        description: 'No se pudo enviar la notificación de prueba',
        variant: 'destructive'
      });
      return;
    }

    const testNotifications = {
      info: {
        title: 'Notificación de Prueba',
        message: 'Esta es una notificación de prueba para verificar que el sistema funciona correctamente.',
        type: 'info' as const
      },
      success: {
        title: '¡Operación Exitosa!',
        message: 'La operación se completó correctamente. Todo está funcionando perfectamente.',
        type: 'success' as const
      },
      warning: {
        title: 'Advertencia Importante',
        message: 'Hay algo que requiere tu atención. Por favor, revisa los detalles.',
        type: 'warning' as const
      },
      error: {
        title: 'Error Detectado',
        message: 'Se ha detectado un error en el sistema. Se requiere acción inmediata.',
        type: 'error' as const
      }
    };

    const notification = testNotifications[testNotificationType as keyof typeof testNotifications];

    try {
      await notificationService.sendNotification({
        id: `test-${Date.now()}`,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        recipientEmail: user.email,
        recipientName: user.email,
        action: {
          type: 'navigate',
          url: '/notificaciones'
        }
      });

      toast({
        title: 'Notificación enviada',
        description: 'Se ha enviado una notificación de prueba. Revisa tu email y las notificaciones en la aplicación.'
      });
    } catch (error) {
      console.error('Error sending test notification:', error);
      toast({
        title: 'Error',
        description: 'No se pudo enviar la notificación de prueba',
        variant: 'destructive'
      });
    }
  };

  const getNotificationStats = () => {
    const history = websocketService.getNotificationHistory();
    const total = history.length;
    const unread = history.filter(n => !n.read).length;
    const today = history.filter(n => {
      const date = new Date(n.timestamp);
      const today = new Date();
      return date.toDateString() === today.toDateString();
    }).length;

    return { total, unread, today };
  };

  const stats = getNotificationStats();

    return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notificaciones</h1>
          <p className="text-muted-foreground">
            Gestiona tus notificaciones y preferencias
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <Bell className="h-3 w-3" />
            {stats.unread} sin leer
          </Badge>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <History className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Sin Leer</p>
                <p className="text-2xl font-bold">{stats.unread}</p>
              </div>
              <Bell className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Hoy</p>
                <p className="text-2xl font-bold">{stats.today}</p>
              </div>
              <Clock className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Test Notification Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Enviar Notificación de Prueba
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <select
              value={testNotificationType}
              onChange={(e) => setTestNotificationType(e.target.value)}
              className="px-3 py-2 border border-input bg-background rounded-md"
            >
              <option value="info">Información</option>
              <option value="success">Éxito</option>
              <option value="warning">Advertencia</option>
              <option value="error">Error</option>
            </select>
            <Button onClick={sendTestNotification}>
              <Bell className="h-4 w-4 mr-2" />
              Enviar Prueba
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Envía una notificación de prueba para verificar que el sistema funciona correctamente.
          </p>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="preferences" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Preferencias
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Historial
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Templates
          </TabsTrigger>
        </TabsList>

        <TabsContent value="preferences" className="space-y-4">
          <NotificationPreferences />
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <NotificationHistory />
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Email Templates */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Templates de Email
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-blue-500" />
                      <div>
                        <p className="font-medium">Nuevo Proyecto</p>
                        <p className="text-sm text-muted-foreground">Notificación cuando se crea un proyecto</p>
                      </div>
                    </div>
                    <Badge variant="outline">Activo</Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <CheckSquare className="h-4 w-4 text-green-500" />
                      <div>
                        <p className="font-medium">Tarea Asignada</p>
                        <p className="text-sm text-muted-foreground">Notificación cuando se asigna una tarea</p>
                      </div>
                    </div>
                    <Badge variant="outline">Activo</Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <MessageSquare className="h-4 w-4 text-purple-500" />
                      <div>
                        <p className="font-medium">Nuevo Mensaje</p>
                        <p className="text-sm text-muted-foreground">Notificación de mensajes en chat</p>
                      </div>
                    </div>
                    <Badge variant="outline">Activo</Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      <div>
                        <p className="font-medium">Alerta de Seguridad</p>
                        <p className="text-sm text-muted-foreground">Alertas importantes de seguridad</p>
                      </div>
                    </div>
                    <Badge variant="outline">Activo</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notification Types */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Tipos de Notificación
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-blue-500" />
                      <div>
                        <p className="font-medium">Proyectos</p>
                        <p className="text-sm text-muted-foreground">Actualizaciones de proyectos</p>
                      </div>
                    </div>
                    <Badge variant="outline">4 activas</Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <MessageSquare className="h-4 w-4 text-green-500" />
                      <div>
                        <p className="font-medium">Comunicación</p>
                        <p className="text-sm text-muted-foreground">Mensajes y colaboración</p>
                      </div>
                    </div>
                    <Badge variant="outline">2 activas</Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Settings className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="font-medium">Sistema</p>
                        <p className="text-sm text-muted-foreground">Mantenimiento y actualizaciones</p>
                      </div>
                    </div>
                    <Badge variant="outline">1 activa</Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Shield className="h-4 w-4 text-red-500" />
                      <div>
                        <p className="font-medium">Seguridad</p>
                        <p className="text-sm text-muted-foreground">Alertas de seguridad</p>
                      </div>
                    </div>
                    <Badge variant="outline">1 activa</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}