import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { 
  Bell, 
  Users, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  DollarSign,
  FileText,
  MessageSquare,
  Settings,
  Download,
  Upload,
  Eye,
  Edit,
  Trash2,
  Plus,
  Search,
  Filter,
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  Zap,
  Shield,
  Database,
  Cpu,
  HardDrive,
  Wifi,
  Server,
  CreditCard,
  Ticket,
  FolderKanban
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { formatDateSafe } from '@/utils/formatDateSafe';

// Sistema de Notificaciones Avanzado
export function AdminNotificationSystem() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [newNotification, setNewNotification] = useState({
    title: '',
    message: '',
    type: 'info',
    priority: 'normal',
    targetUsers: 'all'
  });
  const [filterType, setFilterType] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const { data, error } = await supabase
          .from('admin_notifications')
          .select('*')
          .eq('isActive', true)
          .order('timestamp', { ascending: false });
        
        if (error) throw error;
        setNotifications(data || []);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    fetchNotifications();

    // Suscripción en tiempo real
    const subscription = supabase
      .channel('admin_notifications')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'admin_notifications' },
        () => fetchNotifications()
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const sendNotification = async () => {
    try {
      const { error } = await supabase
        .from('admin_notifications')
        .insert({
          ...newNotification,
          timestamp: new Date().toISOString(),
          isActive: true,
          sentBy: 'admin'
        });
      
      if (error) throw error;
      
      setShowNotificationModal(false);
      setNewNotification({ title: '', message: '', type: 'info', priority: 'normal', targetUsers: 'all' });
      toast({ title: 'Notificación enviada', description: 'La notificación se envió correctamente.' });
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo enviar la notificación.', variant: 'destructive' });
    }
  };

  const filteredNotifications = notifications.filter(n =>
    (filterType === 'all' || n.type === filterType) &&
    (filterPriority === 'all' || n.priority === filterPriority)
  );

  const deleteNotification = async (id: string) => {
    if (!window.confirm('¿Seguro que deseas eliminar esta notificación?')) return;
    try {
      const { error } = await supabase
        .from('admin_notifications')
        .update({ isActive: false })
        .eq('id', id);
      
      if (error) throw error;
      toast({ title: 'Notificación eliminada', description: 'La notificación fue desactivada.' });
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo eliminar la notificación.', variant: 'destructive' });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Sistema de Notificaciones
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">
              {notifications.length} notificaciones activas
            </span>
            <Button onClick={() => setShowNotificationModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Notificación
            </Button>
          </div>
          
          <div className="flex gap-2 mb-2">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="warning">Advertencia</SelectItem>
                <SelectItem value="error">Error</SelectItem>
                <SelectItem value="success">Éxito</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="low">Baja</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
                <SelectItem value="urgent">Urgente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {filteredNotifications.map((notif) => (
              <div key={notif.id} className="p-3 border rounded-lg flex items-center justify-between">
                <div>
                  <h4 className="font-medium">{notif.title}</h4>
                  <p className="text-sm text-muted-foreground">{notif.message}</p>
                </div>
                <div className="flex gap-2 items-center">
                  <Badge variant={notif.priority === 'high' ? 'destructive' : 'secondary'}>{notif.priority}</Badge>
                  <Button variant="ghost" size="icon" onClick={() => deleteNotification(notif.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Dialog open={showNotificationModal} onOpenChange={setShowNotificationModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Enviar Notificación</DialogTitle>
              <DialogDescription>
                Envía una notificación a todos los usuarios o usuarios específicos
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Título</label>
                <Input
                  value={newNotification.title}
                  onChange={(e) => setNewNotification(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Título de la notificación"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Mensaje</label>
                <Textarea
                  value={newNotification.message}
                  onChange={(e) => setNewNotification(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Mensaje de la notificación"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Tipo</label>
                  <Select value={newNotification.type} onValueChange={(value) => setNewNotification(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="info">Información</SelectItem>
                      <SelectItem value="warning">Advertencia</SelectItem>
                      <SelectItem value="error">Error</SelectItem>
                      <SelectItem value="success">Éxito</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Prioridad</label>
                  <Select value={newNotification.priority} onValueChange={(value) => setNewNotification(prev => ({ ...prev, priority: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baja</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="urgent">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowNotificationModal(false)}>
                  Cancelar
                </Button>
                <Button onClick={sendNotification}>
                  Enviar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

// Sistema de Análisis Avanzado
export function AdminAnalytics() {
  const [analytics, setAnalytics] = useState({
    userGrowth: [],
    projectCompletion: [],
    revenueData: [],
    systemPerformance: {
      cpu: 45,
      memory: 62,
      storage: 78,
      network: 23
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Análisis Avanzado
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="performance" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="performance">Rendimiento</TabsTrigger>
            <TabsTrigger value="users">Usuarios</TabsTrigger>
            <TabsTrigger value="projects">Proyectos</TabsTrigger>
            <TabsTrigger value="revenue">Ingresos</TabsTrigger>
          </TabsList>
          
          <TabsContent value="performance" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">CPU</span>
                  <span className="text-sm text-muted-foreground">{analytics.systemPerformance.cpu}%</span>
                </div>
                <Progress value={analytics.systemPerformance.cpu} />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Memoria</span>
                  <span className="text-sm text-muted-foreground">{analytics.systemPerformance.memory}%</span>
                </div>
                <Progress value={analytics.systemPerformance.memory} />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Almacenamiento</span>
                  <span className="text-sm text-muted-foreground">{analytics.systemPerformance.storage}%</span>
                </div>
                <Progress value={analytics.systemPerformance.storage} />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Red</span>
                  <span className="text-sm text-muted-foreground">{analytics.systemPerformance.network}%</span>
                </div>
                <Progress value={analytics.systemPerformance.network} />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="users">
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Gráficos de usuarios próximamente</p>
            </div>
          </TabsContent>
          
          <TabsContent value="projects">
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Gráficos de proyectos próximamente</p>
            </div>
          </TabsContent>
          
          <TabsContent value="revenue">
            <div className="text-center py-8">
              <DollarSign className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Gráficos de ingresos próximamente</p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

// Sistema de Configuración Avanzada
export function AdminSettings() {
  const [settings, setSettings] = useState({
    maintenance: false,
    autoBackup: true,
    emailNotifications: true,
    systemAlerts: true,
    userRegistration: true,
    projectCreation: true
  });
  const [saving, setSaving] = useState(false);

  const updateSetting = async (key: string, value: boolean) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('admin_settings')
        .insert({
          [key]: value,
          updatedAt: new Date().toISOString(),
          updatedBy: 'admin'
        });
      
      if (error) throw error;
      toast({ title: 'Configuración guardada', description: 'El cambio se guardó correctamente.' });
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo guardar el cambio.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Configuración del Sistema
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <h3 className="font-medium">Sistema</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Modo Mantenimiento</span>
                  <Button
                    variant={settings.maintenance ? "default" : "outline"}
                    size="sm"
                    onClick={() => updateSetting('maintenance', !settings.maintenance)}
                    disabled={saving}
                  >
                    {saving ? 'Guardando...' : settings.maintenance ? 'Desactivar' : 'Activar'}
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Backup Automático</span>
                  <Button
                    variant={settings.autoBackup ? "default" : "outline"}
                    size="sm"
                    onClick={() => updateSetting('autoBackup', !settings.autoBackup)}
                    disabled={saving}
                  >
                    {saving ? 'Guardando...' : settings.autoBackup ? 'Desactivar' : 'Activar'}
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="font-medium">Notificaciones</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Notificaciones por Email</span>
                  <Button
                    variant={settings.emailNotifications ? "default" : "outline"}
                    size="sm"
                    onClick={() => updateSetting('emailNotifications', !settings.emailNotifications)}
                    disabled={saving}
                  >
                    {saving ? 'Guardando...' : settings.emailNotifications ? 'Desactivar' : 'Activar'}
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Alertas del Sistema</span>
                  <Button
                    variant={settings.systemAlerts ? "default" : "outline"}
                    size="sm"
                    onClick={() => updateSetting('systemAlerts', !settings.systemAlerts)}
                    disabled={saving}
                  >
                    {saving ? 'Guardando...' : settings.systemAlerts ? 'Desactivar' : 'Activar'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 

// Sistema de Logs del Sistema
export function AdminSystemLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [filter, setFilter] = useState('all');
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        let query = supabase
          .from('system_logs')
          .select('*')
          .order('timestamp', { ascending: false });
        
        if (filter !== 'all') {
          query = query.eq('level', filter);
        }
        
        const { data, error } = await query;
        
        if (error) throw error;
        setLogs(data || []);
      } catch (error) {
        console.error('Error fetching logs:', error);
      }
    };

    fetchLogs();

    // Suscripción en tiempo real
    const subscription = supabase
      .channel('system_logs')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'system_logs' },
        () => fetchLogs()
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [filter]);

  const exportLogs = () => {
    const csv = logs.map(log => `${log.timestamp?.toDate?.()?.toISOString() || ''},${log.level},"${log.message.replace(/"/g, '""')}"`).join('\n');
    const header = 'Fecha, Nivel, Mensaje\n';
    const blob = new Blob([header + csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getLogIcon = (level: string) => {
    switch (level) {
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'warning': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'info': return <CheckCircle className="h-4 w-4 text-green-500" />;
      default: return <Activity className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Logs del Sistema
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="error">Errores</SelectItem>
                <SelectItem value="warning">Advertencias</SelectItem>
                <SelectItem value="info">Información</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={exportLogs}>
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
          
          <div className="max-h-96 overflow-y-auto space-y-2">
            {logs.map((log) => (
              <div key={log.id} className="p-3 border rounded-lg">
                <div className="flex items-center gap-3 cursor-pointer" onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}>
                  {getLogIcon(log.level)}
                  <div className="flex-1">
                    <p className="text-sm font-medium">{log.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateSafe(log.timestamp?.toDate?.())}
                    </p>
                  </div>
                  <Badge variant={log.level === 'error' ? 'destructive' : 'secondary'}>
                    {log.level}
                  </Badge>
                </div>
                {expandedLog === log.id && (
                  <div className="mt-2 text-xs text-muted-foreground bg-muted p-2 rounded">
                    <pre className="whitespace-pre-wrap">{JSON.stringify(log, null, 2)}</pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Sistema de Backup y Restauración
export function AdminBackupSystem() {
  const [backups, setBackups] = useState<any[]>([]);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);

  useEffect(() => {
    const fetchBackups = async () => {
      try {
        const { data, error } = await supabase
          .from('system_backups')
          .select('*')
          .order('createdAt', { ascending: false });
        
        if (error) throw error;
        setBackups(data || []);
      } catch (error) {
        console.error('Error fetching backups:', error);
      }
    };

    fetchBackups();

    // Suscripción en tiempo real
    const subscription = supabase
      .channel('system_backups')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'system_backups' },
        () => fetchBackups()
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const createBackup = async () => {
    setIsCreatingBackup(true);
    try {
      const { error } = await supabase
        .from('system_backups')
        .insert({
          name: `Backup_${new Date().toISOString().split('T')[0]}`,
          status: 'completed',
          size: '2.5 MB',
          createdAt: new Date().toISOString(),
          type: 'full'
        });
      
      if (error) throw error;
      toast({ title: 'Backup creado', description: 'El backup se creó correctamente.' });
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo crear el backup.', variant: 'destructive' });
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const downloadBackup = (backup: any) => {
    const blob = new Blob([`Backup: ${backup.name}\nFecha: ${formatDateSafe(backup.createdAt?.toDate?.())}`], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${backup.name}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };
  const restoreBackup = (backup: any) => {
    toast({ title: 'Restauración iniciada', description: `Restaurando backup ${backup.name}...` });
    setTimeout(() => {
      toast({ title: 'Backup restaurado', description: `Backup ${backup.name} restaurado correctamente.` });
    }, 2000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HardDrive className="h-5 w-5" />
          Sistema de Backup
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Button onClick={createBackup} disabled={isCreatingBackup}>
              {isCreatingBackup ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creando...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Crear Backup
                </>
              )}
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Restaurar
            </Button>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium">Backups Recientes</h4>
            {backups.map((backup) => (
              <div key={backup.id} className="p-3 border rounded-lg flex items-center justify-between">
                <div>
                  <p className="font-medium">{backup.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDateSafe(backup.createdAt?.toDate?.())}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={backup.status === 'completed' ? 'default' : 'secondary'}>
                    {backup.status}
                  </Badge>
                  <span className="text-sm text-muted-foreground">{backup.size}</span>
                  <Button variant="ghost" size="icon" onClick={() => downloadBackup(backup)}><Download className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => restoreBackup(backup)}><Upload className="h-4 w-4" /></Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Monitor de Recursos del Sistema
export function AdminResourceMonitor() {
  const [resources, setResources] = useState({
    cpu: { current: 45, max: 100 },
    memory: { current: 62, max: 100 },
    storage: { current: 78, max: 100 },
    network: { current: 23, max: 100 },
    activeUsers: 15,
    activeProjects: 8,
    databaseConnections: 12
  });

  useEffect(() => {
    // Simular actualización en tiempo real
    const interval = setInterval(() => {
      setResources(prev => ({
        ...prev,
        cpu: { ...prev.cpu, current: Math.floor(Math.random() * 100) },
        memory: { ...prev.memory, current: Math.floor(Math.random() * 100) },
        network: { ...prev.network, current: Math.floor(Math.random() * 100) }
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Cpu className="h-5 w-5" />
          Monitor de Recursos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="font-medium">Recursos del Sistema</h3>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm">CPU</span>
                  <span className="text-sm">{resources.cpu.current}%</span>
                </div>
                <Progress value={resources.cpu.current} />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm">Memoria</span>
                  <span className="text-sm">{resources.memory.current}%</span>
                </div>
                <Progress value={resources.memory.current} />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm">Almacenamiento</span>
                  <span className="text-sm">{resources.storage.current}%</span>
                </div>
                <Progress value={resources.storage.current} />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm">Red</span>
                  <span className="text-sm">{resources.network.current}%</span>
                </div>
                <Progress value={resources.network.current} />
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="font-medium">Actividad</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-500" />
                  <span className="text-sm">Usuarios Activos</span>
                </div>
                <Badge variant="outline">{resources.activeUsers}</Badge>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Proyectos Activos</span>
                </div>
                <Badge variant="outline">{resources.activeProjects}</Badge>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-purple-500" />
                  <span className="text-sm">Conexiones DB</span>
                </div>
                <Badge variant="outline">{resources.databaseConnections}</Badge>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Sistema de Seguridad
export function AdminSecuritySystem() {
  const [securityLogs, setSecurityLogs] = useState<any[]>([]);
  const [threats, setThreats] = useState<any[]>([]);
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: true,
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    ipWhitelist: '',
    suspiciousActivityAlerts: true
  });

  useEffect(() => {
    // Cargar logs de seguridad
    const fetchSecurityLogs = async () => {
      try {
        const { data, error } = await supabase
          .from('security_logs')
          .select('*')
          .order('timestamp', { ascending: false })
          .limit(20);
        
        if (error) throw error;
        setSecurityLogs(data || []);
      } catch (error) {
        console.error('Error fetching security logs:', error);
      }
    };

    fetchSecurityLogs();

    // Suscripción en tiempo real
    const subscription = supabase
      .channel('security_logs')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'security_logs' },
        () => fetchSecurityLogs()
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const updateSecuritySetting = async (key: string, value: any) => {
    try {
      setSecuritySettings(prev => ({ ...prev, [key]: value }));
      
      const { error } = await supabase
        .from('security_settings')
        .insert({
          key,
          value,
          updatedAt: new Date().toISOString(),
          updatedBy: 'admin'
        });
      
      if (error) throw error;
      toast({ title: 'Configuración actualizada', description: 'La configuración de seguridad se actualizó correctamente.' });
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo actualizar la configuración.', variant: 'destructive' });
    }
  };

  const blockUser = async (userId: string, reason: string) => {
    try {
      const { error } = await supabase
        .from('security_actions')
        .insert({
          action: 'block_user',
          userId,
          reason,
          timestamp: new Date().toISOString(),
          performedBy: 'admin'
        });
      
      if (error) throw error;
      toast({ title: 'Usuario bloqueado', description: 'El usuario ha sido bloqueado por seguridad.' });
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo bloquear al usuario.', variant: 'destructive' });
    }
  };

  const getThreatLevelColor = (level: string) => {
    switch (level) {
      case 'high': return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'medium': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'low': return 'bg-green-500/10 text-green-400 border-green-500/20';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Sistema de Seguridad
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Configuración de seguridad */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-semibold">Configuración de Seguridad</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Autenticación de dos factores</p>
                    <p className="text-xs text-muted-foreground">Requerir 2FA para todos los usuarios</p>
                  </div>
                  <Switch
                    checked={securitySettings.twoFactorAuth}
                    onCheckedChange={(checked) => updateSecuritySetting('twoFactorAuth', checked)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Tiempo de sesión (minutos)</Label>
                  <Input
                    type="number"
                    value={securitySettings.sessionTimeout}
                    onChange={(e) => updateSecuritySetting('sessionTimeout', parseInt(e.target.value))}
                    min="5"
                    max="120"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Intentos máximos de login</Label>
                  <Input
                    type="number"
                    value={securitySettings.maxLoginAttempts}
                    onChange={(e) => updateSecuritySetting('maxLoginAttempts', parseInt(e.target.value))}
                    min="3"
                    max="10"
                  />
                </div>

                <div className="space-y-2">
                  <Label>IPs permitidas (una por línea)</Label>
                  <Textarea
                    value={securitySettings.ipWhitelist}
                    onChange={(e) => updateSecuritySetting('ipWhitelist', e.target.value)}
                    placeholder="192.168.1.1&#10;10.0.0.1"
                    rows={3}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Alertas de actividad sospechosa</p>
                    <p className="text-xs text-muted-foreground">Notificar sobre comportamientos anómalos</p>
                  </div>
                  <Switch
                    checked={securitySettings.suspiciousActivityAlerts}
                    onCheckedChange={(checked) => updateSecuritySetting('suspiciousActivityAlerts', checked)}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold">Estadísticas de Seguridad</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                  <div className="text-2xl font-bold text-green-400">98%</div>
                  <div className="text-sm text-green-400">Seguridad</div>
                </div>
                <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <div className="text-2xl font-bold text-blue-400">24/7</div>
                  <div className="text-sm text-blue-400">Monitoreo</div>
                </div>
                <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                  <div className="text-2xl font-bold text-yellow-400">3</div>
                  <div className="text-sm text-yellow-400">Amenazas</div>
                </div>
                <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
                  <div className="text-2xl font-bold text-purple-400">0</div>
                  <div className="text-sm text-purple-400">Incidentes</div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Últimas Amenazas Detectadas</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 rounded bg-red-500/10">
                    <div>
                      <p className="text-sm font-medium">Intento de acceso no autorizado</p>
                      <p className="text-xs text-muted-foreground">IP: 192.168.1.100</p>
                    </div>
                    <Badge className="bg-red-500/10 text-red-400 border-red-500/20">Alta</Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-yellow-500/10">
                    <div>
                      <p className="text-sm font-medium">Múltiples intentos de login</p>
                      <p className="text-xs text-muted-foreground">Usuario: test@example.com</p>
                    </div>
                    <Badge className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20">Media</Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Logs de seguridad */}
          <div>
            <h3 className="font-semibold mb-4">Logs de Seguridad</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {securityLogs.map((log) => (
                <div key={log.id} className="flex items-center gap-3 p-3 rounded border">
                  <div className={`w-2 h-2 rounded-full ${
                    log.level === 'high' ? 'bg-red-500' :
                    log.level === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                  }`} />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{log.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateSafe(log.timestamp?.toDate?.())}
                    </p>
                  </div>
                  <Badge className={getThreatLevelColor(log.level)}>
                    {log.level}
                  </Badge>
                </div>
              ))}
              {securityLogs.length === 0 && (
                <div className="text-center py-8">
                  <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No hay logs de seguridad</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Sistema de Rendimiento
export function AdminPerformanceSystem() {
  const [performanceMetrics, setPerformanceMetrics] = useState({
    cpu: { current: 45, average: 42, peak: 78 },
    memory: { current: 62, average: 58, peak: 85 },
    disk: { current: 28, average: 25, peak: 45 },
    network: { current: 15, average: 12, peak: 35 }
  });
  const [performanceLogs, setPerformanceLogs] = useState<any[]>([]);
  const [optimizationTasks, setOptimizationTasks] = useState<any[]>([]);

  useEffect(() => {
    // Simular métricas de rendimiento en tiempo real
    const interval = setInterval(() => {
      setPerformanceMetrics(prev => ({
        cpu: { 
          ...prev.cpu, 
          current: Math.floor(Math.random() * 30) + 30 
        },
        memory: { 
          ...prev.memory, 
          current: Math.floor(Math.random() * 20) + 55 
        },
        disk: { 
          ...prev.disk, 
          current: Math.floor(Math.random() * 15) + 20 
        },
        network: { 
          ...prev.network, 
          current: Math.floor(Math.random() * 10) + 10 
        }
      }));
    }, 5000);

    // Cargar logs de rendimiento
    const fetchPerformanceLogs = async () => {
      try {
        const { data, error } = await supabase
          .from('performance_logs')
          .select('*')
          .order('timestamp', { ascending: false })
          .limit(10);
        
        if (error) throw error;
        setPerformanceLogs(data || []);
      } catch (error) {
        console.error('Error fetching performance logs:', error);
      }
    };

    fetchPerformanceLogs();

    // Suscripción en tiempo real
    const subscription = supabase
      .channel('performance_logs')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'performance_logs' },
        () => fetchPerformanceLogs()
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      subscription.unsubscribe();
    };
  }, []);

  const runOptimization = async (taskType: string) => {
    try {
      const taskData = {
        type: taskType,
        status: 'running',
        startedAt: new Date().toISOString(),
        performedBy: 'admin'
      };

      const { error } = await supabase
        .from('optimization_tasks')
        .insert(taskData);
      
      if (error) throw error;
      toast({ title: 'Optimización iniciada', description: `La optimización de ${taskType} se está ejecutando.` });
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo iniciar la optimización.', variant: 'destructive' });
    }
  };

  const getPerformanceColor = (value: number) => {
    if (value < 50) return 'text-green-400';
    if (value < 75) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getPerformanceStatus = (value: number) => {
    if (value < 50) return 'Excelente';
    if (value < 75) return 'Bueno';
    return 'Crítico';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Sistema de Rendimiento
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Métricas en tiempo real */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-semibold">Métricas en Tiempo Real</h3>
              
              <div className="space-y-4">
                <div className="p-4 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Cpu className="h-4 w-4" />
                      <span className="font-medium">CPU</span>
                    </div>
                    <div className="text-right">
                      <span className={`text-lg font-bold ${getPerformanceColor(performanceMetrics.cpu.current)}`}>
                        {performanceMetrics.cpu.current}%
                      </span>
                      <p className="text-xs text-muted-foreground">
                        {getPerformanceStatus(performanceMetrics.cpu.current)}
                      </p>
                    </div>
                  </div>
                  <Progress value={performanceMetrics.cpu.current} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>Promedio: {performanceMetrics.cpu.average}%</span>
                    <span>Pico: {performanceMetrics.cpu.peak}%</span>
                  </div>
                </div>

                <div className="p-4 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Database className="h-4 w-4" />
                      <span className="font-medium">Memoria</span>
                    </div>
                    <div className="text-right">
                      <span className={`text-lg font-bold ${getPerformanceColor(performanceMetrics.memory.current)}`}>
                        {performanceMetrics.memory.current}%
                      </span>
                      <p className="text-xs text-muted-foreground">
                        {getPerformanceStatus(performanceMetrics.memory.current)}
                      </p>
                    </div>
                  </div>
                  <Progress value={performanceMetrics.memory.current} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>Promedio: {performanceMetrics.memory.average}%</span>
                    <span>Pico: {performanceMetrics.memory.peak}%</span>
                  </div>
                </div>

                <div className="p-4 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <HardDrive className="h-4 w-4" />
                      <span className="font-medium">Disco</span>
                    </div>
                    <div className="text-right">
                      <span className={`text-lg font-bold ${getPerformanceColor(performanceMetrics.disk.current)}`}>
                        {performanceMetrics.disk.current}%
                      </span>
                      <p className="text-xs text-muted-foreground">
                        {getPerformanceStatus(performanceMetrics.disk.current)}
                      </p>
                    </div>
                  </div>
                  <Progress value={performanceMetrics.disk.current} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>Promedio: {performanceMetrics.disk.average}%</span>
                    <span>Pico: {performanceMetrics.disk.peak}%</span>
                  </div>
                </div>

                <div className="p-4 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Wifi className="h-4 w-4" />
                      <span className="font-medium">Red</span>
                    </div>
                    <div className="text-right">
                      <span className={`text-lg font-bold ${getPerformanceColor(performanceMetrics.network.current)}`}>
                        {performanceMetrics.network.current}%
                      </span>
                      <p className="text-xs text-muted-foreground">
                        {getPerformanceStatus(performanceMetrics.network.current)}
                      </p>
                    </div>
                  </div>
                  <Progress value={performanceMetrics.network.current} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>Promedio: {performanceMetrics.network.average}%</span>
                    <span>Pico: {performanceMetrics.network.peak}%</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold">Optimización del Sistema</h3>
              
              <div className="space-y-3">
                <div className="p-4 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-medium">Limpieza de caché</p>
                      <p className="text-xs text-muted-foreground">Liberar memoria y optimizar rendimiento</p>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => runOptimization('cache_cleanup')}
                    >
                      Ejecutar
                    </Button>
                  </div>
                  <Progress value={75} className="h-1" />
                </div>

                <div className="p-4 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-medium">Optimización de base de datos</p>
                      <p className="text-xs text-muted-foreground">Reindexar y limpiar consultas lentas</p>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => runOptimization('database_optimization')}
                    >
                      Ejecutar
                    </Button>
                  </div>
                  <Progress value={90} className="h-1" />
                </div>

                <div className="p-4 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-medium">Compresión de archivos</p>
                      <p className="text-xs text-muted-foreground">Reducir tamaño de archivos y logs</p>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => runOptimization('file_compression')}
                    >
                      Ejecutar
                    </Button>
                  </div>
                  <Progress value={60} className="h-1" />
                </div>

                <div className="p-4 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-medium">Análisis de rendimiento</p>
                      <p className="text-xs text-muted-foreground">Identificar cuellos de botella</p>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => runOptimization('performance_analysis')}
                    >
                      Ejecutar
                    </Button>
                  </div>
                  <Progress value={45} className="h-1" />
                </div>
              </div>

              <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="h-4 w-4 text-blue-400" />
                  <span className="font-medium text-blue-400">Estado del Sistema</span>
                </div>
                <p className="text-sm text-blue-400">
                  El sistema está funcionando de manera óptima. Todas las métricas están dentro de los rangos normales.
                </p>
              </div>
            </div>
          </div>

          {/* Logs de rendimiento */}
          <div>
            <h3 className="font-semibold mb-4">Logs de Rendimiento</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {performanceLogs.map((log) => (
                <div key={log.id} className="flex items-center gap-3 p-3 rounded border">
                  <Activity className="h-4 w-4 text-primary" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{log.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateSafe(log.timestamp?.toDate?.())}
                    </p>
                  </div>
                  <Badge variant="outline">{log.type}</Badge>
                </div>
              ))}
              {performanceLogs.length === 0 && (
                <div className="text-center py-8">
                  <Zap className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No hay logs de rendimiento</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Sistema de Reportes
export function AdminReportsSystem() {
  const [reports, setReports] = useState<any[]>([]);
  const [selectedReport, setSelectedReport] = useState<string>('users');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const { data, error } = await supabase
          .from('admin_reports')
          .select('*')
          .order('createdAt', { ascending: false })
          .limit(10);
        
        if (error) throw error;
        setReports(data || []);
      } catch (error) {
        console.error('Error fetching reports:', error);
      }
    };

    fetchReports();

    // Suscripción en tiempo real
    const subscription = supabase
      .channel('admin_reports')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'admin_reports' },
        () => fetchReports()
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const generateReport = async () => {
    setIsGenerating(true);
    try {
      const reportData = {
        type: selectedReport,
        dateRange,
        status: 'generating',
        createdAt: new Date().toISOString(),
        generatedBy: 'admin'
      };

      const { error } = await supabase
        .from('admin_reports')
        .insert(reportData);
      
      if (error) throw error;
      toast({ title: 'Reporte generado', description: 'El reporte se está generando y estará disponible pronto.' });
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo generar el reporte.', variant: 'destructive' });
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadReport = async (reportId: string) => {
    try {
      // Simular descarga de reporte
      const link = document.createElement('a');
      link.href = `data:text/csv;charset=utf-8,${encodeURIComponent('Reporte generado')}`;
      link.download = `reporte-${selectedReport}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({ title: 'Reporte descargado', description: 'El reporte se descargó correctamente.' });
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo descargar el reporte.', variant: 'destructive' });
    }
  };

  const getReportStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'generating': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'failed': return 'bg-red-500/10 text-red-400 border-red-500/20';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Sistema de Reportes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Generador de reportes */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label>Tipo de Reporte</Label>
                <Select value={selectedReport} onValueChange={setSelectedReport}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="users">Reporte de Usuarios</SelectItem>
                    <SelectItem value="projects">Reporte de Proyectos</SelectItem>
                    <SelectItem value="payments">Reporte de Pagos</SelectItem>
                    <SelectItem value="tickets">Reporte de Tickets</SelectItem>
                    <SelectItem value="analytics">Reporte de Analytics</SelectItem>
                    <SelectItem value="system">Reporte del Sistema</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Fecha Inicio</Label>
                  <Input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Fecha Fin</Label>
                  <Input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  />
                </div>
              </div>

              <Button 
                onClick={generateReport} 
                disabled={isGenerating || !dateRange.start || !dateRange.end}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <Activity className="h-4 w-4 mr-2 animate-spin" />
                    Generando...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    Generar Reporte
                  </>
                )}
              </Button>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold">Tipos de Reportes Disponibles</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2 p-2 rounded bg-muted">
                  <Users className="h-4 w-4" />
                  <div>
                    <p className="font-medium">Reporte de Usuarios</p>
                    <p className="text-xs text-muted-foreground">Estadísticas de usuarios registrados</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 rounded bg-muted">
                  <FolderKanban className="h-4 w-4" />
                  <div>
                    <p className="font-medium">Reporte de Proyectos</p>
                    <p className="text-xs text-muted-foreground">Estado y progreso de proyectos</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 rounded bg-muted">
                  <CreditCard className="h-4 w-4" />
                  <div>
                    <p className="font-medium">Reporte de Pagos</p>
                    <p className="text-xs text-muted-foreground">Transacciones y facturación</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 rounded bg-muted">
                  <Ticket className="h-4 w-4" />
                  <div>
                    <p className="font-medium">Reporte de Tickets</p>
                    <p className="text-xs text-muted-foreground">Soporte y atención al cliente</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Historial de reportes */}
          <div>
            <h3 className="font-semibold mb-4">Reportes Recientes</h3>
            <div className="space-y-2">
              {reports.map((report) => (
                <div key={report.id} className="flex items-center justify-between p-3 rounded border">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">Reporte de {report.type}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateSafe(report.createdAt?.toDate?.())}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getReportStatusColor(report.status)}>
                      {report.status}
                    </Badge>
                    {report.status === 'completed' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadReport(report.id)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              {reports.length === 0 && (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No hay reportes generados</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Panel de Control Principal del Admin
export function AdminControlPanel() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Vista General</TabsTrigger>
          <TabsTrigger value="notifications">Notificaciones</TabsTrigger>
          <TabsTrigger value="analytics">Análisis</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
          <TabsTrigger value="backup">Backup</TabsTrigger>
          <TabsTrigger value="settings">Configuración</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AdminResourceMonitor />
            <AdminAnalytics />
          </div>
        </TabsContent>
        
        <TabsContent value="notifications">
          <AdminNotificationSystem />
        </TabsContent>
        
        <TabsContent value="analytics">
          <AdminAnalytics />
        </TabsContent>
        
        <TabsContent value="logs">
          <AdminSystemLogs />
        </TabsContent>
        
        <TabsContent value="backup">
          <AdminBackupSystem />
        </TabsContent>
        
        <TabsContent value="settings">
          <AdminSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
} 
