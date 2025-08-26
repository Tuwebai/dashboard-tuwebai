import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/hooks/use-toast';
import { useApp } from '@/contexts/AppContext';
import { notificationService, Notification } from '@/lib/notificationService';

interface NotificationBellProps {
  className?: string;
}

export default function NotificationBell({ className = '' }: NotificationBellProps) {
  const { user } = useApp();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [urgentCount, setUrgentCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);

  // Cargar notificaciones no leídas
  const loadUnreadNotifications = async () => {
    try {
      setLoading(true);
      const unreadNotifications = await notificationService.getUserNotifications({
        is_read: false,
        limit: 10
      });
      setNotifications(unreadNotifications);
      setUnreadCount(unreadNotifications.length);
      setUrgentCount(unreadNotifications.filter(n => n.is_urgent).length);
    } catch (error) {
      console.error('Error loading unread notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Cargar notificaciones al montar el componente
  useEffect(() => {
    loadUnreadNotifications();
    
    // Configurar intervalo para actualizar cada 30 segundos
    const interval = setInterval(loadUnreadNotifications, 30000);
    
    return () => clearInterval(interval);
  }, [user.id]);

  // Marcar como leída
  const markAsRead = async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications(prev => 
        prev.filter(n => n.id !== notificationId)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      toast({ title: 'Notificación marcada como leída' });
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  // Marcar todas como leídas
  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications([]);
      setUnreadCount(0);
      setUrgentCount(0);
      toast({ title: 'Todas las notificaciones marcadas como leídas' });
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  // Obtener icono por tipo
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success':
        return '🟢';
      case 'warning':
        return '🟡';
      case 'error':
      case 'critical':
        return '🔴';
      default:
        return '🔵';
    }
  };

  // Obtener color del badge por tipo
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'warning':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'error':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'critical':
        return 'bg-red-600/10 text-red-500 border-red-600/20';
      default:
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    }
  };

  // Formatear fecha
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Ahora';
    if (diffInMinutes < 60) return `Hace ${diffInMinutes} min`;
    if (diffInMinutes < 1440) return `Hace ${Math.floor(diffInMinutes / 60)}h`;
    return date.toLocaleDateString();
  };

  return (
    <div className={`relative ${className}`}>
      <Button
        variant="ghost"
        size="sm"
        className="relative h-10 w-10 p-0 text-zinc-300 hover:text-white hover:bg-zinc-800"
        onClick={() => setShowDropdown(!showDropdown)}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
        {urgentCount > 0 && unreadCount === 0 && (
          <Badge 
            variant="secondary" 
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center bg-red-500 text-white"
          >
            !
          </Badge>
        )}
      </Button>

      {/* Dropdown de notificaciones */}
      {showDropdown && (
        <div className="absolute right-0 top-12 w-80 z-50">
          <Card className="bg-zinc-800 border-zinc-700 shadow-xl">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white text-lg">Notificaciones</CardTitle>
                <div className="flex items-center space-x-2">
                  {unreadCount > 0 && (
                    <Button
                      onClick={markAllAsRead}
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                    >
                      Marcar todas
                    </Button>
                  )}
                </div>
              </div>
              {unreadCount > 0 && (
                <div className="flex items-center space-x-2 text-sm text-gray-400">
                  <span>{unreadCount} no leídas</span>
                  {urgentCount > 0 && (
                    <>
                      <span>•</span>
                      <span className="text-red-400">{urgentCount} urgentes</span>
                    </>
                  )}
                </div>
              )}
            </CardHeader>
                         <CardContent className="p-0">
               <div className="max-h-80 overflow-y-auto">
                 {loading ? (
                   <div className="flex items-center justify-center p-8">
                     <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                   </div>
                 ) : notifications.length === 0 ? (
                   <div className="text-center py-8">
                     <Bell className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                     <p className="text-gray-400 text-sm">No hay notificaciones nuevas</p>
                   </div>
                 ) : (
                   <div className="space-y-1 p-2">
                     {notifications.map((notification) => (
                       <div
                         key={notification.id}
                         className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                           notification.is_urgent 
                             ? 'border-red-500/50 bg-red-500/10' 
                             : 'border-zinc-600 bg-zinc-700'
                         } hover:bg-zinc-600`}
                         onClick={() => markAsRead(notification.id)}
                       >
                         <div className="flex items-start space-x-3">
                           <div className="text-lg">{getTypeIcon(notification.type)}</div>
                           <div className="flex-1 min-w-0">
                             <div className="flex items-center space-x-2 mb-1">
                               <h4 className={`font-medium text-sm ${
                                 notification.is_urgent ? 'text-red-300' : 'text-white'
                               }`}>
                                 {notification.title}
                               </h4>
                               <Badge 
                                 variant="outline" 
                                 className={`text-xs ${getTypeColor(notification.type)}`}
                               >
                                 {notification.type}
                               </Badge>
                               {notification.is_urgent && (
                                 <Badge variant="destructive" className="text-xs">
                                   Urgente
                                 </Badge>
                               )}
                             </div>
                             <p className="text-xs text-gray-400 line-clamp-2">
                               {notification.message}
                             </p>
                             <div className="flex items-center justify-between mt-2">
                               <span className="text-xs text-gray-500">
                                 {formatDate(notification.created_at)}
                               </span>
                               {notification.category !== 'system' && (
                                 <Badge variant="outline" className="text-xs text-gray-400">
                                   {notification.category}
                                 </Badge>
                               )}
                             </div>
                           </div>
                         </div>
                       </div>
                     ))}
                   </div>
                 )}
               </div>
             </CardContent>
          </Card>
        </div>
      )}

      {/* Overlay para cerrar dropdown */}
      {showDropdown && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  );
}
