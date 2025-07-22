import { useState, useEffect, useRef } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { firestore } from '@/lib/firebase';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  where, 
  orderBy,
  serverTimestamp,
  getDocs,
  limit,
  getDoc,
  setDoc
} from 'firebase/firestore';
import { 
  Bell, 
  BellOff, 
  Settings, 
  Trash2, 
  Check, 
  X, 
  AlertTriangle,
  Info,
  CheckCircle,
  Clock,
  Star,
  Filter,
  Search,
  Plus,
  Edit,
  Eye,
  EyeOff,
  Volume2,
  VolumeX,
  Smartphone,
  Mail,
  MessageSquare,
  Calendar,
  FileText,
  Users,
  Zap,
  Activity,
  BarChart3,
  Download,
  Upload,
  Share2,
  Lock,
  Unlock,
  Archive,
  RefreshCw,
  MoreHorizontal,
  User,
  Shield,
  Globe,
  Wifi,
  WifiOff,
  CreditCard,
  CheckSquare
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { useTranslation } from 'react-i18next';
import { formatDateSafe } from '@/utils/formatDateSafe';

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

interface NotificationSettings {
  id: string;
  userId: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  inAppNotifications: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
  categories: {
    general: boolean;
    project: boolean;
    billing: boolean;
    support: boolean;
    system: boolean;
    collaboration: boolean;
  };
  priorities: {
    low: boolean;
    medium: boolean;
    high: boolean;
    urgent: boolean;
  };
  autoArchive: boolean;
  autoArchiveDays: number;
  maxNotifications: number;
}

interface NotificationStats {
  total: number;
  unread: number;
  read: number;
  archived: number;
  pinned: number;
  byType: {
    [key: string]: number;
  };
  byPriority: {
    [key: string]: number;
  };
  byCategory: {
    [key: string]: number;
  };
}

export default function NotificationSystem() {
  const { user } = useApp();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [stats, setStats] = useState<NotificationStats>({
    total: 0,
    unread: 0,
    read: 0,
    archived: 0,
    pinned: 0,
    byType: {},
    byPriority: {},
    byCategory: {}
  });
  const [activeTab, setActiveTab] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { t } = useTranslation();

  const audioRef = useRef<HTMLAudioElement>(null);
  const notificationTimeoutRef = useRef<NodeJS.Timeout>();
  const navigate = useNavigate();

  // Initialize notification settings
  const initializeNotificationSettings = async () => {
    if (!user) return;

    try {
      const settingsRef = doc(firestore, 'notificationSettings', user.email);
      const settingsSnap = await getDoc(settingsRef);
      
      if (!settingsSnap.exists()) {
        const defaultSettings: NotificationSettings = {
          id: user.email,
          userId: user.email,
          emailNotifications: true,
          pushNotifications: true,
          smsNotifications: false,
          inAppNotifications: true,
          soundEnabled: true,
          vibrationEnabled: true,
          quietHours: {
            enabled: false,
            start: '22:00',
            end: '08:00'
          },
          categories: {
            general: true,
            project: true,
            billing: true,
            support: true,
            system: true,
            collaboration: true
          },
          priorities: {
            low: true,
            medium: true,
            high: true,
            urgent: true
          },
          autoArchive: false,
          autoArchiveDays: 30,
          maxNotifications: 100
        };
        
        await setDoc(settingsRef, defaultSettings);
        setSettings(defaultSettings);
      }
    } catch (error) {
      console.error('Error initializing notification settings:', error);
    }
  };

  // Load notification settings
  const loadNotificationSettings = async () => {
    if (!user) return;

    try {
      const settingsRef = doc(firestore, 'notificationSettings', user.email);
      const settingsSnap = await getDoc(settingsRef);
      
      if (settingsSnap.exists()) {
        setSettings(settingsSnap.data() as NotificationSettings);
      } else {
        // Inicializar configuración por defecto
        await initializeNotificationSettings();
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
      // Usar configuración por defecto si hay error
      const defaultSettings: NotificationSettings = {
        id: user.email,
        userId: user.email,
        emailNotifications: true,
        pushNotifications: true,
        smsNotifications: false,
        inAppNotifications: true,
        soundEnabled: true,
        vibrationEnabled: true,
        quietHours: {
          enabled: false,
          start: '22:00',
          end: '08:00'
        },
        categories: {
          general: true,
          project: true,
          billing: true,
          support: true,
          system: true,
          collaboration: true
        },
        priorities: {
          low: true,
          medium: true,
          high: true,
          urgent: true
        },
        autoArchive: false,
        autoArchiveDays: 30,
        maxNotifications: 100
      };
      setSettings(defaultSettings);
    }
  };

  // Load notifications
  useEffect(() => {
    if (!user) return;

    const notificationsRef = collection(firestore, 'notifications');
    const notificationsQuery = query(
      notificationsRef,
      where('recipientId', '==', user.email),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
      const notificationsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Notification[];
      
      setNotifications(notificationsData);
      updateStats(notificationsData);
    });

    return unsubscribe;
  }, [user]);

  // Load settings
  useEffect(() => {
    if (!user) return;

    loadNotificationSettings();
  }, [user]);

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Al cargar notificaciones, detectar nuevas no leídas y disparar push/sonido
  useEffect(() => {
    if (!user || notifications.length === 0) return;
    // Detectar la última notificación no leída
    const latest = notifications.find(n => !n.isRead);
    if (latest && settings?.pushNotifications) {
      // Notificación push
      if ('Notification' in window && Notification.permission === 'granted') {
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
      if (settings?.soundEnabled && audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play();
      }
    }
  }, [notifications, settings, user]);

  // Update stats
  const updateStats = (notificationsData: Notification[]) => {
    const stats: NotificationStats = {
      total: notificationsData.length,
      unread: notificationsData.filter(n => !n.isRead).length,
      read: notificationsData.filter(n => n.isRead).length,
      archived: notificationsData.filter(n => n.isArchived).length,
      pinned: notificationsData.filter(n => n.isPinned).length,
      byType: {},
      byPriority: {},
      byCategory: {}
    };

    notificationsData.forEach(notification => {
      stats.byType[notification.type] = (stats.byType[notification.type] || 0) + 1;
      stats.byPriority[notification.priority] = (stats.byPriority[notification.priority] || 0) + 1;
      stats.byCategory[notification.category] = (stats.byCategory[notification.category] || 0) + 1;
    });

    setStats(stats);
  };

  // Mark as read
  const markAsRead = async (notificationId: string) => {
    try {
      const notificationRef = doc(firestore, 'notifications', notificationId);
      
      // Verificar si el documento existe antes de actualizar
      const notificationSnap = await getDoc(notificationRef);
      if (!notificationSnap.exists()) {
        toast({
          title: 'Error',
          description: 'La notificación no existe',
          variant: 'destructive'
        });
        return;
      }

      await updateDoc(notificationRef, {
        isRead: true,
        readAt: serverTimestamp()
      });

      toast({
        title: 'Notificación marcada como leída',
        description: 'La notificación ha sido actualizada'
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast({
        title: 'Error',
        description: 'No se pudo marcar como leída',
        variant: 'destructive'
      });
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.isRead);
      
      for (const notification of unreadNotifications) {
        const notificationRef = doc(firestore, 'notifications', notification.id);
        
        // Verificar si el documento existe antes de actualizar
        const notificationSnap = await getDoc(notificationRef);
        if (notificationSnap.exists()) {
          await updateDoc(notificationRef, {
            isRead: true,
            readAt: serverTimestamp()
          });
        }
      }

      toast({
        title: 'Todas marcadas como leídas',
        description: `${unreadNotifications.length} notificaciones actualizadas`
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron marcar como leídas',
        variant: 'destructive'
      });
    }
  };

  // Archive notification
  const archiveNotification = async (notificationId: string) => {
    try {
      const notificationRef = doc(firestore, 'notifications', notificationId);
      
      // Verificar si el documento existe antes de actualizar
      const notificationSnap = await getDoc(notificationRef);
      if (!notificationSnap.exists()) {
        toast({
          title: 'Error',
          description: 'La notificación no existe',
          variant: 'destructive'
        });
        return;
      }

      await updateDoc(notificationRef, {
        isArchived: true,
        archivedAt: serverTimestamp()
      });

      toast({
        title: 'Notificación archivada',
        description: 'La notificación ha sido movida al archivo'
      });
    } catch (error) {
      console.error('Error archiving notification:', error);
      toast({
        title: 'Error',
        description: 'No se pudo archivar la notificación',
        variant: 'destructive'
      });
    }
  };

  // Pin notification
  const pinNotification = async (notificationId: string) => {
    try {
      const notification = notifications.find(n => n.id === notificationId);
      if (!notification) {
        toast({
          title: 'Error',
          description: 'La notificación no existe',
          variant: 'destructive'
        });
        return;
      }

      const notificationRef = doc(firestore, 'notifications', notificationId);
      
      // Verificar si el documento existe antes de actualizar
      const notificationSnap = await getDoc(notificationRef);
      if (!notificationSnap.exists()) {
        toast({
          title: 'Error',
          description: 'La notificación no existe en la base de datos',
          variant: 'destructive'
        });
        return;
      }

      await updateDoc(notificationRef, {
        isPinned: !notification.isPinned,
        pinnedAt: !notification.isPinned ? serverTimestamp() : null
      });

      toast({
        title: notification.isPinned ? 'Notificación desanclada' : 'Notificación anclada',
        description: notification.isPinned 
          ? 'La notificación ya no está anclada' 
          : 'La notificación está anclada'
      });
    } catch (error) {
      console.error('Error pinning notification:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cambiar el estado de anclado',
        variant: 'destructive'
      });
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId: string) => {
    try {
      await deleteDoc(doc(firestore, 'notifications', notificationId));

      toast({
        title: 'Notificación eliminada',
        description: 'La notificación ha sido eliminada permanentemente'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo eliminar la notificación',
        variant: 'destructive'
      });
    }
  };

  // Update settings
  const updateSettings = async (newSettings: Partial<NotificationSettings>) => {
    if (!settings || !user) return;

    try {
      const settingsRef = doc(firestore, 'notificationSettings', user.email);
      
      // Verificar si el documento existe
      const settingsSnap = await getDoc(settingsRef);
      
      if (settingsSnap.exists()) {
        // Actualizar documento existente
        await updateDoc(settingsRef, newSettings);
      } else {
        // Crear nuevo documento con configuración por defecto
        await initializeNotificationSettings();
        // Luego actualizar con los nuevos settings
        await updateDoc(settingsRef, newSettings);
      }

      setSettings({ ...settings, ...newSettings });
      toast({
        title: 'Configuración actualizada',
        description: 'Los cambios han sido guardados'
      });
    } catch (error) {
      console.error('Error updating notification settings:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar la configuración',
        variant: 'destructive'
      });
    }
  };

  // Filter notifications
  const filteredNotifications = notifications.filter(notification => {
    // Tab filter
    if (activeTab === 'unread' && notification.isRead) return false;
    if (activeTab === 'pinned' && !notification.isPinned) return false;
    if (activeTab === 'archived' && !notification.isArchived) return false;
    if (activeTab === 'all' && notification.isArchived) return false;

    // Type filter
    if (filterType !== 'all' && notification.type !== filterType) return false;

    // Priority filter
    if (filterPriority !== 'all' && notification.priority !== filterPriority) return false;

    // Category filter
    if (filterCategory !== 'all' && notification.category !== filterCategory) return false;

    // Search filter
    if (searchTerm && !notification.title.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !notification.message.toLowerCase().includes(searchTerm.toLowerCase())) return false;

    return true;
  });

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

  // Handler de click en notificación
  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    if (notification.roomId || (notification.actions && notification.actions.some(a => a.action === 'open_chat'))) {
      const roomId = notification.roomId || (notification.metadata && notification.metadata.roomId);
      if (roomId) {
        navigate(`/chat/${roomId}`);
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
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold">{t('Acceso denegado')}</h3>
          <p className="text-muted-foreground">{t('Debes iniciar sesión para ver las notificaciones.')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('Notificaciones')}</h1>
          <p className="text-muted-foreground">{t('Gestiona todas tus notificaciones')}</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setIsSettingsOpen(true)}
          >
            <Settings className="h-4 w-4 mr-2" />
            {t('Configuración')}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 bg-card border border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('Total')}</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Bell className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 bg-card border border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('No leídas')}</p>
                <p className="text-2xl font-bold text-red-500">{stats.unread}</p>
              </div>
              <Eye className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 bg-card border border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('Leídas')}</p>
                <p className="text-2xl font-bold text-green-500">{stats.read}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 bg-card border border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('Ancladas')}</p>
                <p className="text-2xl font-bold text-purple-500">{stats.pinned}</p>
              </div>
              <Star className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 bg-card border border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('Archivadas')}</p>
                <p className="text-2xl font-bold text-gray-500">{stats.archived}</p>
              </div>
              <Archive className="h-8 w-8 text-gray-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4 bg-card border border-border">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('Buscar notificaciones...')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
            
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('Todos')}</SelectItem>
                <SelectItem value="info">{t('Info')}</SelectItem>
                <SelectItem value="success">{t('Éxito')}</SelectItem>
                <SelectItem value="warning">{t('Advertencia')}</SelectItem>
                <SelectItem value="error">{t('Error')}</SelectItem>
                <SelectItem value="project">{t('Proyecto')}</SelectItem>
                <SelectItem value="task">{t('Tarea')}</SelectItem>
                <SelectItem value="file">{t('Archivo')}</SelectItem>
                <SelectItem value="comment">{t('Comentario')}</SelectItem>
                <SelectItem value="payment">{t('Pago')}</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('Todas')}</SelectItem>
                <SelectItem value="low">{t('Baja')}</SelectItem>
                <SelectItem value="medium">{t('Media')}</SelectItem>
                <SelectItem value="high">{t('Alta')}</SelectItem>
                <SelectItem value="urgent">{t('Urgente')}</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('Todas')}</SelectItem>
                <SelectItem value="general">{t('General')}</SelectItem>
                <SelectItem value="project">{t('Proyecto')}</SelectItem>
                <SelectItem value="billing">{t('Facturación')}</SelectItem>
                <SelectItem value="support">{t('Soporte')}</SelectItem>
                <SelectItem value="system">{t('Sistema')}</SelectItem>
                <SelectItem value="collaboration">{t('Colaboración')}</SelectItem>
              </SelectContent>
            </Select>
            
            <Button
              variant="outline"
              size="sm"
              onClick={markAllAsRead}
              disabled={stats.unread === 0}
            >
              <Check className="h-4 w-4 mr-2" />
              {t('Marcar todas como leídas')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            {t('Todas')} ({stats.total})
          </TabsTrigger>
          <TabsTrigger value="unread" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            {t('No leídas')} ({stats.unread})
          </TabsTrigger>
          <TabsTrigger value="pinned" className="flex items-center gap-2">
            <Star className="h-4 w-4" />
            {t('Ancladas')} ({stats.pinned})
          </TabsTrigger>
          <TabsTrigger value="archived" className="flex items-center gap-2">
            <Archive className="h-4 w-4" />
            {t('Archivadas')} ({stats.archived})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {filteredNotifications.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold">{t('No hay notificaciones')}</h3>
                <p className="text-muted-foreground">
                  {activeTab === 'unread' ? t('No tienes notificaciones sin leer') :
                   activeTab === 'pinned' ? t('No tienes notificaciones ancladas') :
                   activeTab === 'archived' ? t('No tienes notificaciones archivadas') :
                   t('No hay notificaciones que coincidan con los filtros')}
                </p>
              </CardContent>
            </Card>
          ) : null}
          {filteredNotifications.length > 0 && (
            <div className="space-y-4 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-zinc-900"
                 style={{ maxHeight: '400px', minHeight: '120px', overscrollBehavior: 'contain' }}>
              {filteredNotifications.map((notification) => (
                <Card 
                  key={notification.id} 
                  className={`bg-card border border-border transition-all hover:shadow-lg ${notification.isPinned ? 'ring-2 ring-purple-500' : ''}`}
                  onClick={() => handleNotificationClick(notification)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleNotificationClick(notification);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <CardContent className="p-4 bg-card border border-border">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="mt-1">
                          {getTypeIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-sm">{notification.title}</h4>
                            <Badge className={getPriorityColor(notification.priority)}>
                              {notification.priority}
                            </Badge>
                            <Badge variant="outline">
                              {notification.category}
                            </Badge>
                            {notification.isPinned && (
                              <Star className="h-4 w-4 text-purple-500" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>{t('De')}: {notification.senderName}</span>
                            <span>{formatDateSafe(notification.createdAt)}</span>
                            {notification.projectId && (
                              <span>{t('Proyecto')}: {notification.projectId}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        {!notification.isRead && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAsRead(notification.id)}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => pinNotification(notification.id)}
                        >
                          <Star className={`h-4 w-4 ${notification.isPinned ? 'text-purple-500 fill-current' : ''}`} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => archiveNotification(notification.id)}
                        >
                          <Archive className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteNotification(notification.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Settings Modal */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="max-w-2xl bg-card border border-border shadow-card">
          <DialogHeader>
            <DialogTitle>{t('Configuración de Notificaciones')}</DialogTitle>
            <DialogDescription>
              {t('Personaliza cómo recibes las notificaciones')}
            </DialogDescription>
          </DialogHeader>
          
          {settings && (
            <Tabs defaultValue="general" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="general">{t('General')}</TabsTrigger>
                <TabsTrigger value="categories">{t('Categorías')}</TabsTrigger>
                <TabsTrigger value="advanced">{t('Avanzado')}</TabsTrigger>
              </TabsList>

              <TabsContent value="general" className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>{t('Notificaciones por email')}</Label>
                      <p className="text-sm text-muted-foreground">
                        {t('Recibe notificaciones en tu correo electrónico')}
                      </p>
                    </div>
                    <Switch
                      checked={settings.emailNotifications}
                      onCheckedChange={(checked) => updateSettings({ emailNotifications: checked })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>{t('Notificaciones push')}</Label>
                      <p className="text-sm text-muted-foreground">
                        {t('Notificaciones del navegador')}
                      </p>
                    </div>
                    <Switch
                      checked={settings.pushNotifications}
                      onCheckedChange={(checked) => updateSettings({ pushNotifications: checked })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>{t('Sonido')}</Label>
                      <p className="text-sm text-muted-foreground">
                        {t('Reproducir sonido al recibir notificaciones')}
                      </p>
                    </div>
                    <Switch
                      checked={settings.soundEnabled}
                      onCheckedChange={(checked) => updateSettings({ soundEnabled: checked })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>{t('Vibración')}</Label>
                      <p className="text-sm text-muted-foreground">
                        {t('Vibración en dispositivos móviles')}
                      </p>
                    </div>
                    <Switch
                      checked={settings.vibrationEnabled}
                      onCheckedChange={(checked) => updateSettings({ vibrationEnabled: checked })}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="categories" className="space-y-4">
                <div className="space-y-4">
                  {Object.entries(settings.categories).map(([category, enabled]) => (
                    <div key={category} className="flex items-center justify-between">
                      <div>
                        <Label className="capitalize">{category}</Label>
                        <p className="text-sm text-muted-foreground">
                          {t('Notificaciones de')} {category}
                        </p>
                      </div>
                      <Switch
                        checked={enabled}
                        onCheckedChange={(checked) => updateSettings({
                          categories: { ...settings.categories, [category]: checked }
                        })}
                      />
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="advanced" className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>{t('Horas silenciosas')}</Label>
                      <p className="text-sm text-muted-foreground">
                        {t('No recibir notificaciones en horarios específicos')}
                      </p>
                    </div>
                    <Switch
                      checked={settings.quietHours.enabled}
                      onCheckedChange={(checked) => updateSettings({
                        quietHours: { ...settings.quietHours, enabled: checked }
                      })}
                    />
                  </div>
                  
                  {settings.quietHours.enabled && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>{t('Inicio')}</Label>
                        <Input
                          type="time"
                          value={settings.quietHours.start}
                          onChange={(e) => updateSettings({
                            quietHours: { ...settings.quietHours, start: e.target.value }
                          })}
                        />
                      </div>
                      <div>
                        <Label>{t('Fin')}</Label>
                        <Input
                          type="time"
                          value={settings.quietHours.end}
                          onChange={(e) => updateSettings({
                            quietHours: { ...settings.quietHours, end: e.target.value }
                          })}
                        />
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>{t('Auto-archivar')}</Label>
                      <p className="text-sm text-muted-foreground">
                        {t('Archivar notificaciones automáticamente')}
                      </p>
                    </div>
                    <Switch
                      checked={settings.autoArchive}
                      onCheckedChange={(checked) => updateSettings({ autoArchive: checked })}
                    />
                  </div>
                  
                  {settings.autoArchive && (
                    <div>
                      <Label>{t('Días antes de archivar')}</Label>
                      <Input
                        type="number"
                        value={settings.autoArchiveDays}
                        onChange={(e) => updateSettings({ autoArchiveDays: parseInt(e.target.value) })}
                        min="1"
                        max="365"
                      />
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Notification Modal */}
      <Dialog open={false} onOpenChange={() => {}}>
        <DialogContent className="max-w-md bg-card border border-border shadow-card">
          <DialogHeader>
            <DialogTitle>{t('Crear Notificación')}</DialogTitle>
            <DialogDescription>
              {t('Crea una nueva notificación')}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">{t('Título')}</Label>
              <Input
                id="title"
                value=""
                onChange={(e) => {}}
                placeholder={t('Título de la notificación')}
              />
            </div>
            
            <div>
              <Label htmlFor="message">{t('Mensaje')}</Label>
              <Textarea
                id="message"
                value=""
                onChange={(e) => {}}
                placeholder={t('Mensaje de la notificación')}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="type">{t('Tipo')}</Label>
                <Select value="info" onValueChange={() => {}}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">{t('Info')}</SelectItem>
                    <SelectItem value="success">{t('Éxito')}</SelectItem>
                    <SelectItem value="warning">{t('Advertencia')}</SelectItem>
                    <SelectItem value="error">{t('Error')}</SelectItem>
                    <SelectItem value="project">{t('Proyecto')}</SelectItem>
                    <SelectItem value="task">{t('Tarea')}</SelectItem>
                    <SelectItem value="file">{t('Archivo')}</SelectItem>
                    <SelectItem value="comment">{t('Comentario')}</SelectItem>
                    <SelectItem value="payment">{t('Pago')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="priority">{t('Prioridad')}</Label>
                <Select value="medium" onValueChange={() => {}}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">{t('Baja')}</SelectItem>
                    <SelectItem value="medium">{t('Media')}</SelectItem>
                    <SelectItem value="high">{t('Alta')}</SelectItem>
                    <SelectItem value="urgent">{t('Urgente')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="category">{t('Categoría')}</Label>
              <Select value="general" onValueChange={() => {}}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">{t('General')}</SelectItem>
                  <SelectItem value="project">{t('Proyecto')}</SelectItem>
                  <SelectItem value="billing">{t('Facturación')}</SelectItem>
                  <SelectItem value="support">{t('Soporte')}</SelectItem>
                  <SelectItem value="system">{t('Sistema')}</SelectItem>
                  <SelectItem value="collaboration">{t('Colaboración')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="expiresAt">{t('Fecha de expiración (opcional)')}</Label>
              <Input
                id="expiresAt"
                type="datetime-local"
                value=""
                onChange={(e) => {}}
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => {}}>{t('Cancelar')}</Button>
              <Button onClick={() => {
                // This function is no longer needed, so it's removed.
                // The createNotification logic was removed from the file.
                // If you need to create a notification, you'll need to re-implement it.
                toast({
                  title: 'Funcionalidad de creación de notificaciones desactivada',
                  description: 'La funcionalidad de creación de notificaciones ha sido desactivada por el momento.'
                });
              }} disabled={true}>
                {t('Crear Notificación')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Hidden audio element for notifications */}
      <audio ref={audioRef} src="/notification-sound.mp3" preload="auto" />
    </div>
  );
}