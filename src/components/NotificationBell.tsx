import { useState, useEffect, useRef } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { firestore } from '@/lib/firebase';
import { 
  collection, 
  doc, 
  updateDoc, 
  onSnapshot, 
  query, 
  where, 
  orderBy,
  serverTimestamp,
  limit,
  deleteDoc
} from 'firebase/firestore';
import { 
  Bell, 
  Check, 
  X, 
  AlertTriangle,
  Info,
  CheckCircle,
  Star,
  Archive,
  Settings,
  Eye,
  MoreHorizontal,
  Clock,
  User,
  FileText,
  MessageSquare,
  CreditCard,
  Zap,
  CheckSquare,
  ExternalLink,
  Trash2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'system' | 'project' | 'task' | 'file' | 'comment' | 'payment';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'general' | 'project' | 'billing' | 'support' | 'system' | 'collaboration';
  senderId: string;
  senderName: string;
  senderRole: 'admin' | 'client';
  recipientId: string;
  projectId?: string;
  taskId?: string;
  fileId?: string;
  commentId?: string;
  isRead: boolean;
  isArchived: boolean;
  isPinned: boolean;
  createdAt: string;
  readAt?: string;
  expiresAt?: string;
  actions?: Array<{
    label: string;
    action: string;
    url?: string;
  }>;
  metadata?: {
    [key: string]: any;
  };
  roomId?: string; // Added for chat notifications
}

export default function NotificationBell() {
  const { user } = useApp();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState<any>(null);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const notificationTimeoutRef = useRef<NodeJS.Timeout>();
  const navigate = useNavigate();

  // Load notifications
  useEffect(() => {
    if (!user) return;

    const notificationsRef = collection(firestore, 'notifications');
    const notificationsQuery = query(
      notificationsRef,
      where('recipientId', '==', user.email),
      where('isArchived', '==', false),
      orderBy('createdAt', 'desc'),
      limit(10)
    );

    const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
      const notificationsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Notification[];
      
      setNotifications(notificationsData);
      setUnreadCount(notificationsData.filter(n => !n.isRead).length);
    });

    return unsubscribe;
  }, [user]);

  // Load settings
  useEffect(() => {
    if (!user) return;

    const settingsRef = doc(firestore, 'notificationSettings', user.email);
    const unsubscribe = onSnapshot(settingsRef, (doc) => {
      if (doc.exists()) {
        setSettings(doc.data());
      }
    });

    return unsubscribe;
  }, [user]);

  // Mark as read
  const markAsRead = async (notificationId: string) => {
    try {
      const notificationRef = doc(firestore, 'notifications', notificationId);
      await updateDoc(notificationRef, {
        isRead: true,
        readAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.isRead);
      
      for (const notification of unreadNotifications) {
        const notificationRef = doc(firestore, 'notifications', notification.id);
        await updateDoc(notificationRef, {
          isRead: true,
          readAt: serverTimestamp()
        });
      }

      toast({
        title: 'Todas marcadas como leídas',
        description: `${unreadNotifications.length} notificaciones actualizadas`
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudieron marcar como leídas',
        variant: 'destructive'
      });
    }
  };

  // Borrar notificación
  const deleteNotification = async (notificationId: string) => {
    try {
      await deleteDoc(doc(firestore, 'notifications', notificationId));
      toast({
        title: 'Notificación eliminada',
        description: 'La notificación ha sido eliminada.'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo eliminar la notificación.',
        variant: 'destructive'
      });
    }
  };

  // Get type icon
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error': return <X className="h-4 w-4 text-red-500" />;
      case 'info': return <Info className="h-4 w-4 text-blue-500" />;
      case 'project': return <FileText className="h-4 w-4 text-purple-500" />;
      case 'task': return <CheckSquare className="h-4 w-4 text-orange-500" />;
      case 'file': return <FileText className="h-4 w-4 text-indigo-500" />;
      case 'comment': return <MessageSquare className="h-4 w-4 text-cyan-500" />;
      case 'payment': return <CreditCard className="h-4 w-4 text-emerald-500" />;
      default: return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-white';
      case 'low': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  // Format time ago
  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Ahora';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    return `${Math.floor(diffInSeconds / 86400)}d`;
  };

  // Handle notification click
  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    // Navegación automática al chat si corresponde
    if (notification.roomId || (notification.actions && notification.actions.some(a => a.action === 'open_chat'))) {
      const roomId = notification.roomId || (notification.metadata && notification.metadata.roomId);
      if (roomId) {
        navigate(`/chat/${roomId}`);
        setIsOpen(false);
        return;
      }
    }
    // Fallback: acción por defecto
    if (notification.actions && notification.actions.length > 0) {
      const viewAction = notification.actions.find(action => action.action === 'view');
      if (viewAction && viewAction.url) {
        window.open(viewAction.url, '_blank');
      }
    }
    setIsOpen(false);
  };

  useEffect(() => {
    if (!user || notifications.length === 0 || !settings) return;
    const latest = notifications.find(n => !n.isRead);
    if (latest) {
      // Notificación push
      if (settings.pushNotifications && 'Notification' in window && Notification.permission === 'granted') {
        const notif = new Notification(latest.title || 'Nueva notificación', {
          body: latest.message,
          icon: '/favicon.ico',
          tag: latest.id,
          data: { roomId: latest.roomId, url: latest.actions?.find(a => a.action === 'open_chat')?.url }
        });
        notif.onclick = (e) => {
          window.focus();
          if (notif.data?.url) {
            window.location.href = notif.data.url;
          } else if (notif.data?.roomId) {
            window.location.href = `/chat/${notif.data.roomId}`;
          }
        };
      }
      // Sonido
      if (settings.soundEnabled && audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play();
      }
    }
  }, [notifications, settings, user]);

  if (!user) return null;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="bg-[#181824] border border-[#23263a] shadow-2xl text-white w-full max-w-xs sm:max-w-md md:max-w-lg rounded-xl p-0 sm:p-2">
        <TooltipProvider>
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              <span className="font-semibold text-lg">Notificaciones</span>
              {unreadCount > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {unreadCount} nueva{unreadCount !== 1 ? 's' : ''}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="h-8 px-2 text-xs"
                >
                  <Check className="h-3 w-3 mr-1" />
                  Marcar todas
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/notificaciones')}
                className="h-8 px-2 text-xs"
              >
                <Settings className="h-3 w-3 mr-1" />
                Ver todas
              </Button>
            </div>
          </div>
          
          <ScrollArea>
            <div className="p-2 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-zinc-900" style={{ maxHeight: '320px' }}>
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Bell className="h-12 w-12 text-muted-foreground mb-3" />
                  <p className="text-muted-foreground text-sm mb-1">Sin notificaciones</p>
                  <p className="text-muted-foreground text-xs">Te notificaremos cuando haya novedades</p>
                </div>
              ) : (
                notifications.map((notification, index) => (
                  <div key={notification.id}>
                    <div
                      className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                        !notification.isRead ? 'ring-2 ring-primary' : ''
                      } ${notification.isPinned ? 'ring-2 ring-yellow-500' : ''}`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex-shrink-0 mt-1">
                        {getTypeIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className="font-medium text-sm leading-tight">
                            {notification.title}
                          </h4>
                          <div className="flex items-center gap-1">
                            {notification.isPinned && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Star className="h-3 w-3 text-yellow-500 fill-current" />
                                </TooltipTrigger>
                                <TooltipContent>Anclada</TooltipContent>
                              </Tooltip>
                            )}
                            <Badge 
                              variant="secondary" 
                              className={`text-xs ${getPriorityColor(notification.priority)}`}
                            >
                              {notification.priority}
                            </Badge>
                          </div>
                        </div>
                        
                        <p className="text-xs text-muted-foreground mb-2 leading-relaxed">
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>{formatTimeAgo(notification.createdAt)}</span>
                            {notification.senderName && (
                              <>
                                <span>•</span>
                                <span>{notification.senderName}</span>
                              </>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-1">
                            {notification.actions && notification.actions.length > 0 && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      let url = '/notificaciones';
                                      if (notification.type === 'payment' || notification.category === 'billing') url = '/facturacion';
                                      else if (notification.type === 'project') url = '/proyectos';
                                      else if (notification.type === 'file') url = '/proyectos';
                                      else if (notification.type === 'comment') url = '/proyectos';
                                      else if (notification.category === 'support') url = '/soporte';
                                      else if (notification.category === 'collaboration') url = '/proyectos';
                                      else if (notification.roomId) url = `/chat/${notification.roomId}`;
                                      navigate(url);
                                      setIsOpen(false);
                                    }}
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Ir a sección</TooltipContent>
                              </Tooltip>
                            )}
                           <Tooltip>
                             <TooltipTrigger asChild>
                           <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotification(notification.id);
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                             </TooltipTrigger>
                             <TooltipContent>Eliminar notificación</TooltipContent>
                           </Tooltip>
                          </div>
                        </div>
                        {!notification.isRead && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAsRead(notification.id)}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                            </TooltipTrigger>
                            <TooltipContent>Marcar como leída</TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </div>
                    
                    {index < notifications.length - 1 && (
                      <Separator className="my-2" />
                    )}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
          
          {notifications.length > 0 && (
            <div className="p-3 border-t border-border bg-muted/20">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Mostrando {notifications.length} de {notifications.length} notificaciones</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/notificaciones')}
                  className="h-6 px-2 text-xs"
                >
                  Ver todas
                </Button>
              </div>
            </div>
          )}
        </TooltipProvider>
      </PopoverContent>
    </Popover>
  );
} 