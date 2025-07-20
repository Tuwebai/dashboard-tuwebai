import { useEffect, useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { firestore } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Bell, Zap, MessageSquare, FileText, CreditCard, AlertTriangle, CheckCircle } from 'lucide-react';

const notificationTypes = [
  {
    type: 'info',
    title: 'Nueva actualización disponible',
    message: 'Se ha lanzado una nueva versión de la plataforma con mejoras de rendimiento.',
    category: 'system',
    priority: 'medium',
    icon: <Bell className="h-4 w-4 text-blue-500" />
  },
  {
    type: 'success',
    title: 'Proyecto completado',
    message: 'El proyecto "Dashboard Web" ha sido completado exitosamente.',
    category: 'project',
    priority: 'high',
    icon: <CheckCircle className="h-4 w-4 text-green-500" />
  },
  {
    type: 'warning',
    title: 'Espacio de almacenamiento',
    message: 'Tu espacio de almacenamiento está al 85% de capacidad.',
    category: 'system',
    priority: 'medium',
    icon: <AlertTriangle className="h-4 w-4 text-yellow-500" />
  },
  {
    type: 'project',
    title: 'Nuevo comentario',
    message: 'Juan Pérez ha comentado en el proyecto "E-commerce Platform".',
    category: 'collaboration',
    priority: 'low',
    icon: <MessageSquare className="h-4 w-4 text-purple-500" />
  },
  {
    type: 'file',
    title: 'Archivo compartido',
    message: 'Se ha compartido el archivo "documento-final.pdf" contigo.',
    category: 'project',
    priority: 'medium',
    icon: <FileText className="h-4 w-4 text-indigo-500" />
  },
  {
    type: 'payment',
    title: 'Pago procesado',
    message: 'Tu pago de $99.99 ha sido procesado exitosamente.',
    category: 'billing',
    priority: 'high',
    icon: <CreditCard className="h-4 w-4 text-emerald-500" />
  }
];

export default function NotificationDemo() {
  const { user } = useApp();
  const [isGenerating, setIsGenerating] = useState(false);

  const generateNotification = async (notificationData: typeof notificationTypes[0]) => {
    if (!user) return;

    try {
      await addDoc(collection(firestore, 'notifications'), {
        title: notificationData.title,
        message: notificationData.message,
        type: notificationData.type,
        priority: notificationData.priority,
        category: notificationData.category,
        senderId: 'system',
        senderName: 'Sistema',
        senderRole: 'admin',
        recipientId: user.email,
        isRead: false,
        isArchived: false,
        isPinned: false,
        createdAt: serverTimestamp(),
        actions: [
          { label: 'Ver', action: 'view' },
          { label: 'Descartar', action: 'dismiss' }
        ],
        metadata: {}
      });
    } catch (error) {
      console.error('Error generating notification:', error);
    }
  };

  const generateRandomNotification = async () => {
    if (!user) return;
    
    setIsGenerating(true);
    const randomNotification = notificationTypes[Math.floor(Math.random() * notificationTypes.length)];
    await generateNotification(randomNotification);
    
    setTimeout(() => {
      setIsGenerating(false);
    }, 1000);
  };

  const generateAllNotifications = async () => {
    if (!user) return;
    
    setIsGenerating(true);
    
    for (const notification of notificationTypes) {
      await generateNotification(notification);
      await new Promise(resolve => setTimeout(resolve, 200)); // Pequeña pausa entre notificaciones
    }
    
    setIsGenerating(false);
  };

  if (!user) return null;

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Demostración de Notificaciones
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-sm text-muted-foreground">
          Genera notificaciones de prueba para ver el sistema en acción. Las notificaciones aparecerán en tiempo real.
        </div>
        
        <div className="flex gap-4">
          <Button
            onClick={generateRandomNotification}
            disabled={isGenerating}
            className="flex items-center gap-2"
          >
            <Bell className="h-4 w-4" />
            {isGenerating ? 'Generando...' : 'Notificación Aleatoria'}
          </Button>
          
          <Button
            onClick={generateAllNotifications}
            disabled={isGenerating}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Zap className="h-4 w-4" />
            {isGenerating ? 'Generando...' : 'Generar Todas'}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {notificationTypes.map((notification, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {notification.icon}
                  <div className="flex-1">
                    <h4 className="font-medium text-sm mb-1">{notification.title}</h4>
                    <p className="text-xs text-muted-foreground mb-2">{notification.message}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {notification.category}
                      </Badge>
                      <Badge 
                        variant="secondary" 
                        className={`text-xs ${
                          notification.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                          notification.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}
                      >
                        {notification.priority}
                      </Badge>
                    </div>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => generateNotification(notification)}
                  disabled={isGenerating}
                  className="w-full mt-3"
                >
                  Generar
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 