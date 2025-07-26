import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Bell, 
  BellOff, 
  MessageSquare, 
  FileText, 
  CheckSquare, 
  Users, 
  AlertTriangle,
  Settings,
  Save,
  RotateCcw
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface NotificationPreference {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  channels: {
    push: boolean;
    email: boolean;
    inApp: boolean;
  };
  icon: React.ReactNode;
  category: 'project' | 'communication' | 'system' | 'security';
}

const defaultPreferences: NotificationPreference[] = [
  {
    id: 'new_project',
    name: 'Nuevos Proyectos',
    description: 'Cuando se crea un nuevo proyecto',
    enabled: true,
    channels: { push: true, email: true, inApp: true },
    icon: <FileText className="h-4 w-4" />,
    category: 'project'
  },
  {
    id: 'project_updates',
    name: 'Actualizaciones de Proyecto',
    description: 'Cambios en el estado o progreso del proyecto',
    enabled: true,
    channels: { push: true, email: false, inApp: true },
    icon: <FileText className="h-4 w-4" />,
    category: 'project'
  },
  {
    id: 'task_assigned',
    name: 'Tareas Asignadas',
    description: 'Cuando se te asigna una nueva tarea',
    enabled: true,
    channels: { push: true, email: true, inApp: true },
    icon: <CheckSquare className="h-4 w-4" />,
    category: 'project'
  },
  {
    id: 'task_completed',
    name: 'Tareas Completadas',
    description: 'Cuando se completa una tarea',
    enabled: true,
    channels: { push: false, email: false, inApp: true },
    icon: <CheckSquare className="h-4 w-4" />,
    category: 'project'
  },
  {
    id: 'new_message',
    name: 'Nuevos Mensajes',
    description: 'Mensajes en el chat de colaboración',
    enabled: true,
    channels: { push: true, email: false, inApp: true },
    icon: <MessageSquare className="h-4 w-4" />,
    category: 'communication'
  },
  {
    id: 'file_uploaded',
    name: 'Archivos Subidos',
    description: 'Cuando se sube un nuevo archivo',
    enabled: true,
    channels: { push: false, email: false, inApp: true },
    icon: <FileText className="h-4 w-4" />,
    category: 'project'
  },
  {
    id: 'collaborator_joined',
    name: 'Nuevos Colaboradores',
    description: 'Cuando alguien se une al proyecto',
    enabled: true,
    channels: { push: true, email: false, inApp: true },
    icon: <Users className="h-4 w-4" />,
    category: 'communication'
  },
  {
    id: 'system_maintenance',
    name: 'Mantenimiento del Sistema',
    description: 'Notificaciones de mantenimiento y actualizaciones',
    enabled: true,
    channels: { push: true, email: true, inApp: true },
    icon: <Settings className="h-4 w-4" />,
    category: 'system'
  },
  {
    id: 'security_alerts',
    name: 'Alertas de Seguridad',
    description: 'Alertas importantes de seguridad',
    enabled: true,
    channels: { push: true, email: true, inApp: true },
    icon: <AlertTriangle className="h-4 w-4" />,
    category: 'security'
  }
];

export default function NotificationPreferences() {
  const [preferences, setPreferences] = useState<NotificationPreference[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [globalEnabled, setGlobalEnabled] = useState(true);
  const [quietHours, setQuietHours] = useState(false);
  const [quietStart, setQuietStart] = useState('22:00');
  const [quietEnd, setQuietEnd] = useState('08:00');

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = () => {
    try {
      const saved = localStorage.getItem('notificationPreferences');
      if (saved) {
        const parsed = JSON.parse(saved);
        setPreferences(parsed.preferences || defaultPreferences);
        setGlobalEnabled(parsed.globalEnabled !== false);
        setQuietHours(parsed.quietHours || false);
        setQuietStart(parsed.quietStart || '22:00');
        setQuietEnd(parsed.quietEnd || '08:00');
      } else {
        setPreferences(defaultPreferences);
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
      setPreferences(defaultPreferences);
    }
    setLoading(false);
  };

  const savePreferences = async () => {
    setSaving(true);
    try {
      const data = {
        preferences,
        globalEnabled,
        quietHours,
        quietStart,
        quietEnd,
        lastUpdated: new Date().toISOString()
      };
      
      localStorage.setItem('notificationPreferences', JSON.stringify(data));
      
      // Aquí se enviarían las preferencias al servidor
      // await updateNotificationPreferences(data);
      
      toast({
        title: 'Preferencias guardadas',
        description: 'Tus preferencias de notificación han sido actualizadas'
      });
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron guardar las preferencias',
        variant: 'destructive'
      });
    }
    setSaving(false);
  };

  const resetToDefaults = () => {
    setPreferences(defaultPreferences);
    setGlobalEnabled(true);
    setQuietHours(false);
    setQuietStart('22:00');
    setQuietEnd('08:00');
  };

  const togglePreference = (id: string) => {
    setPreferences(prev => 
      prev.map(pref => 
        pref.id === id ? { ...pref, enabled: !pref.enabled } : pref
      )
    );
  };

  const toggleChannel = (id: string, channel: 'push' | 'email' | 'inApp') => {
    setPreferences(prev => 
      prev.map(pref => 
        pref.id === id ? { 
          ...pref, 
          channels: { 
            ...pref.channels, 
            [channel]: !pref.channels[channel] 
          } 
        } : pref
      )
    );
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'project': return <FileText className="h-4 w-4" />;
      case 'communication': return <MessageSquare className="h-4 w-4" />;
      case 'system': return <Settings className="h-4 w-4" />;
      case 'security': return <AlertTriangle className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'project': return 'bg-blue-100 text-blue-800';
      case 'communication': return 'bg-green-100 text-green-800';
      case 'system': return 'bg-gray-100 text-gray-800';
      case 'security': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const categories = ['project', 'communication', 'system', 'security'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Preferencias de Notificaciones</h2>
          <p className="text-muted-foreground">
            Configura cómo y cuándo recibir notificaciones
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={resetToDefaults}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Restablecer
          </Button>
          <Button onClick={savePreferences} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      </div>

      {/* Global Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Configuración General
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="global-enabled">Notificaciones Globales</Label>
              <p className="text-sm text-muted-foreground">
                Activar o desactivar todas las notificaciones
              </p>
            </div>
            <Switch
              id="global-enabled"
              checked={globalEnabled}
              onCheckedChange={setGlobalEnabled}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="quiet-hours">Horas Silenciosas</Label>
              <p className="text-sm text-muted-foreground">
                No recibir notificaciones durante ciertas horas
              </p>
            </div>
            <Switch
              id="quiet-hours"
              checked={quietHours}
              onCheckedChange={setQuietHours}
            />
          </div>

          {quietHours && (
            <div className="grid grid-cols-2 gap-4 pl-6">
              <div>
                <Label htmlFor="quiet-start">Inicio</Label>
                <input
                  id="quiet-start"
                  type="time"
                  value={quietStart}
                  onChange={(e) => setQuietStart(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2"
                />
              </div>
              <div>
                <Label htmlFor="quiet-end">Fin</Label>
                <input
                  id="quiet-end"
                  type="time"
                  value={quietEnd}
                  onChange={(e) => setQuietEnd(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notification Categories */}
      {categories.map(category => {
        const categoryPreferences = preferences.filter(p => p.category === category);
        const categoryName = {
          project: 'Proyectos',
          communication: 'Comunicación',
          system: 'Sistema',
          security: 'Seguridad'
        }[category];

        return (
          <Card key={category}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getCategoryIcon(category)}
                {categoryName}
                <Badge className={getCategoryColor(category)}>
                  {categoryPreferences.filter(p => p.enabled).length}/{categoryPreferences.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {categoryPreferences.map(preference => (
                <div key={preference.id} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {preference.icon}
                      <div>
                        <Label htmlFor={preference.id} className="font-medium">
                          {preference.name}
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          {preference.description}
                        </p>
                      </div>
                    </div>
                    <Switch
                      id={preference.id}
                      checked={preference.enabled && globalEnabled}
                      onCheckedChange={() => togglePreference(preference.id)}
                      disabled={!globalEnabled}
                    />
                  </div>

                  {preference.enabled && globalEnabled && (
                    <div className="ml-8 space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm">Notificaciones Push</Label>
                        <Switch
                          checked={preference.channels.push}
                          onCheckedChange={() => toggleChannel(preference.id, 'push')}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label className="text-sm">Email</Label>
                        <Switch
                          checked={preference.channels.email}
                          onCheckedChange={() => toggleChannel(preference.id, 'email')}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label className="text-sm">En la Aplicación</Label>
                        <Switch
                          checked={preference.channels.inApp}
                          onCheckedChange={() => toggleChannel(preference.id, 'inApp')}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
} 