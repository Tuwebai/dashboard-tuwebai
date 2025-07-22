import { useApp } from '@/contexts/AppContext';
import type { AppContextType } from '@/contexts/AppContext';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { toast } from '@/hooks/use-toast';
import { firestore } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { 
  Settings, 
  Palette, 
  Globe, 
  Shield, 
  Monitor, 
  Smartphone, 
  Save, 
  RefreshCw,
  Trash2,
  Download,
  Upload,
  Database,
  Bell,
  Eye,
  EyeOff,
  Lock,
  Unlock
} from 'lucide-react';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { useTranslation } from 'react-i18next';
import i18n from '@/lib/i18n';

export default function Configuracion() {
  const { user, updateUserSettings } = useApp() as AppContextType;
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const { t } = useTranslation();
  
  // Configuración general
  const [generalSettings, setGeneralSettings] = useState({
    language: 'es',
    timezone: 'America/Argentina/Buenos_Aires',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24h'
  });

  // Configuración de privacidad
  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: 'public',
    showEmail: false,
    showPhone: false,
    allowAnalytics: true,
    allowCookies: true,
    twoFactorAuth: false
  });

  // Configuración de notificaciones
  const [notificationSettings, setNotificationSettings] = useState({
    pushNotifications: true,
    emailNotifications: true,
    smsNotifications: false,
    soundEnabled: true,
    vibrationEnabled: true,
    quietHours: false,
    quietHoursStart: '22:00',
    quietHoursEnd: '08:00'
  });

  // Configuración de rendimiento
  const [performanceSettings, setPerformanceSettings] = useState({
    autoSave: true,
    autoSaveInterval: 30,
    cacheEnabled: true,
    imageQuality: 'high',
    animationsEnabled: true,
    lowBandwidthMode: false
  });

  // Configuración de seguridad
  const [securitySettings, setSecuritySettings] = useState({
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    requirePasswordChange: false,
    passwordExpiryDays: 90,
    loginNotifications: true,
    deviceManagement: true
  });

  useEffect(() => {
    if (user) {
      // Cargar configuración guardada del usuario
      setGeneralSettings({
        language: user.language || 'es',
        timezone: user.timezone || 'America/Argentina/Buenos_Aires',
        dateFormat: user.dateFormat || 'DD/MM/YYYY',
        timeFormat: user.timeFormat || '24h'
      });

      setPrivacySettings({
        profileVisibility: user.profileVisibility || 'public',
        showEmail: user.showEmail || false,
        showPhone: user.showPhone || false,
        allowAnalytics: user.allowAnalytics !== false,
        allowCookies: user.allowCookies !== false,
        twoFactorAuth: user.twoFactorAuth || false
      });

      setNotificationSettings({
        pushNotifications: user.pushNotifications !== false,
        emailNotifications: user.emailNotifications !== false,
        smsNotifications: user.smsNotifications || false,
        soundEnabled: user.soundEnabled !== false,
        vibrationEnabled: user.vibrationEnabled !== false,
        quietHours: user.quietHours || false,
        quietHoursStart: user.quietHoursStart || '22:00',
        quietHoursEnd: user.quietHoursEnd || '08:00'
      });

      setPerformanceSettings({
        autoSave: user.autoSave !== false,
        autoSaveInterval: user.autoSaveInterval || 30,
        cacheEnabled: user.cacheEnabled !== false,
        imageQuality: user.imageQuality || 'high',
        animationsEnabled: user.animationsEnabled !== false,
        lowBandwidthMode: user.lowBandwidthMode || false
      });

      setSecuritySettings({
        sessionTimeout: user.sessionTimeout || 30,
        maxLoginAttempts: user.maxLoginAttempts || 5,
        requirePasswordChange: user.requirePasswordChange || false,
        passwordExpiryDays: user.passwordExpiryDays || 90,
        loginNotifications: user.loginNotifications !== false,
        deviceManagement: user.deviceManagement !== false
      });
    }
  }, [user]);

  const handleSaveSettings = async (settingsType: string) => {
    if (!user) return;
    setLoading(true);
    let updates: any = {};
    switch (settingsType) {
      case 'general':
        updates = { ...generalSettings };
        break;
      case 'privacy':
        updates = { ...privacySettings };
        break;
      case 'notifications':
        updates = { ...notificationSettings };
        break;
      case 'performance':
        updates = { ...performanceSettings };
        break;
      case 'security':
        updates = { ...securitySettings };
        break;
      case 'all':
        updates = {
          ...generalSettings,
          ...privacySettings,
          ...notificationSettings,
          ...performanceSettings,
          ...securitySettings
        };
        break;
    }
    try {
      await updateUserSettings(updates);
      toast({
        title: 'Configuración guardada',
        description: 'Los cambios han sido guardados correctamente.'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudieron guardar los cambios.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetSettings = () => {
    if (confirm('¿Estás seguro de que quieres restablecer todas las configuraciones a los valores predeterminados?')) {
      // Resetear a valores por defecto
      setGeneralSettings({
        language: 'es',
        timezone: 'America/Argentina/Buenos_Aires',
        dateFormat: 'DD/MM/YYYY',
        timeFormat: '24h'
      });

      setPrivacySettings({
        profileVisibility: 'public',
        showEmail: false,
        showPhone: false,
        allowAnalytics: true,
        allowCookies: true,
        twoFactorAuth: false
      });

      setNotificationSettings({
        pushNotifications: true,
        emailNotifications: true,
        smsNotifications: false,
        soundEnabled: true,
        vibrationEnabled: true,
        quietHours: false,
        quietHoursStart: '22:00',
        quietHoursEnd: '08:00'
      });

      setPerformanceSettings({
        autoSave: true,
        autoSaveInterval: 30,
        cacheEnabled: true,
        imageQuality: 'high',
        animationsEnabled: true,
        lowBandwidthMode: false
      });

      setSecuritySettings({
        sessionTimeout: 30,
        maxLoginAttempts: 5,
        requirePasswordChange: false,
        passwordExpiryDays: 90,
        loginNotifications: true,
        deviceManagement: true
      });

      toast({
        title: 'Configuración restablecida',
        description: 'Todas las configuraciones han sido restablecidas a los valores predeterminados.'
      });
    }
  };

  const handleExportSettings = () => {
    const settings = {
      general: generalSettings,
      privacy: privacySettings,
      notifications: notificationSettings,
      performance: performanceSettings,
      security: securitySettings,
      exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `configuracion-${user?.email}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'Configuración exportada',
      description: 'Tu configuración ha sido descargada como archivo JSON.'
    });
  };

  const handleImportSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const settings = JSON.parse(e.target?.result as string);
          
          if (settings.general) setGeneralSettings(settings.general);
          if (settings.privacy) setPrivacySettings(settings.privacy);
          if (settings.notifications) setNotificationSettings(settings.notifications);
          if (settings.performance) setPerformanceSettings(settings.performance);
          if (settings.security) setSecuritySettings(settings.security);

          toast({
            title: 'Configuración importada',
            description: 'La configuración ha sido importada correctamente.'
          });
        } catch (error) {
          toast({
            title: 'Error',
            description: 'El archivo no es válido.',
            variant: 'destructive'
          });
        }
      };
      reader.readAsText(file);
    }
  };

  if (!user) return null;

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'privacy', label: 'Privacidad', icon: Shield },
    { id: 'notifications', label: 'Notificaciones', icon: Bell },
    { id: 'performance', label: 'Rendimiento', icon: Monitor },
    { id: 'security', label: 'Seguridad', icon: Lock }
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('Configuración')}</h1>
          <p className="text-muted-foreground">{t('Personaliza tu experiencia en la plataforma')}</p>
        </div>
        <div className="flex gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" onClick={handleExportSettings}>
                  <Download className="h-4 w-4 mr-2" />
                  {t('Exportar')}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t('Descargar')}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Label htmlFor="import-settings" className="cursor-pointer">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline">
                    <Upload className="h-4 w-4 mr-2" />
                    {t('Importar')}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t('Subir')}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </Label>
          <input
            id="import-settings"
            type="file"
            accept=".json"
            onChange={handleImportSettings}
            className="hidden"
          />
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" onClick={handleResetSettings}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {t('Restablecer')}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t('Restablecer')}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-muted p-1 rounded-lg">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <TooltipProvider key={tab.id}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={activeTab === tab.id ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setActiveTab(tab.id)}
                    className="flex items-center gap-2"
                  >
                    <Icon className="h-4 w-4" />
                    {t(tab.label)}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t(tab.label.split(' ')[0])}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}
      </div>

      {/* Contenido de las tabs */}
      <div className="space-y-6">
        {/* Configuración General */}
        {activeTab === 'general' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                {t('Configuración')} {t('General')}
              </CardTitle>
              <CardDescription>
                {t('Personaliza tu experiencia en la plataforma')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="language">{t('Idioma')}</Label>
                  <Select value={generalSettings.language} onValueChange={(value) => {
                    setGeneralSettings(prev => ({ ...prev, language: value }));
                    i18n.changeLanguage(value);
                  }}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="es">{t('Español')}</SelectItem>
                      <SelectItem value="en">{t('English')}</SelectItem>
                      <SelectItem value="pt">{t('Português')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timezone">{t('Zona horaria')}</Label>
                  <Select value={generalSettings.timezone} onValueChange={(value) => setGeneralSettings(prev => ({ ...prev, timezone: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/Argentina/Buenos_Aires">Buenos Aires (GMT-3)</SelectItem>
                      <SelectItem value="America/New_York">New York (GMT-5)</SelectItem>
                      <SelectItem value="Europe/Madrid">Madrid (GMT+1)</SelectItem>
                      <SelectItem value="UTC">UTC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dateFormat">{t('Formato de fecha')}</Label>
                  <Select value={generalSettings.dateFormat} onValueChange={(value) => setGeneralSettings(prev => ({ ...prev, dateFormat: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timeFormat">{t('Formato de hora')}</Label>
                  <Select value={generalSettings.timeFormat} onValueChange={(value) => setGeneralSettings(prev => ({ ...prev, timeFormat: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="12h">12 horas</SelectItem>
                      <SelectItem value="24h">24 horas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={() => handleSaveSettings('general')} disabled={loading}>
                  {loading ? t('Guardando...') : <><Save className="h-4 w-4 mr-2" />{t('Guardar cambios')}</>}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Configuración de Privacidad */}
        {activeTab === 'privacy' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                {t('Privacidad')} {t('y')} {t('Datos')}
              </CardTitle>
              <CardDescription>
                {t('Controla cómo se comparten y utilizan tus datos')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="profileVisibility">{t('Visibilidad del perfil')}</Label>
                  <Select value={privacySettings.profileVisibility} onValueChange={(value) => setPrivacySettings(prev => ({ ...prev, profileVisibility: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">{t('Público')}</SelectItem>
                      <SelectItem value="private">{t('Privado')}</SelectItem>
                      <SelectItem value="contacts">{t('Solo contactos')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">{t('Mostrar email en perfil')}</Label>
                      <p className="text-xs text-muted-foreground">{t('Permite que otros usuarios vean tu email')}</p>
                    </div>
                    <Switch
                      checked={privacySettings.showEmail}
                      onCheckedChange={(checked) => setPrivacySettings(prev => ({ ...prev, showEmail: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">{t('Mostrar teléfono en perfil')}</Label>
                      <p className="text-xs text-muted-foreground">{t('Permite que otros usuarios vean tu teléfono')}</p>
                    </div>
                    <Switch
                      checked={privacySettings.showPhone}
                      onCheckedChange={(checked) => setPrivacySettings(prev => ({ ...prev, showPhone: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">{t('Permitir análisis')}</Label>
                      <p className="text-xs text-muted-foreground">{t('Ayuda a mejorar la plataforma con datos anónimos')}</p>
                    </div>
                    <Switch
                      checked={privacySettings.allowAnalytics}
                      onCheckedChange={(checked) => setPrivacySettings(prev => ({ ...prev, allowAnalytics: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">{t('Permitir cookies')}</Label>
                      <p className="text-xs text-muted-foreground">{t('Cookies necesarias para el funcionamiento')}</p>
                    </div>
                    <Switch
                      checked={privacySettings.allowCookies}
                      onCheckedChange={(checked) => setPrivacySettings(prev => ({ ...prev, allowCookies: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">{t('Autenticación de dos factores')}</Label>
                      <p className="text-xs text-muted-foreground">{t('Añade una capa extra de seguridad')}</p>
                    </div>
                    <Switch
                      checked={privacySettings.twoFactorAuth}
                      onCheckedChange={(checked) => setPrivacySettings(prev => ({ ...prev, twoFactorAuth: checked }))}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={() => handleSaveSettings('privacy')} disabled={loading}>
                  {loading ? t('Guardando...') : <><Save className="h-4 w-4 mr-2" />{t('Guardar cambios')}</>}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Configuración de Notificaciones */}
        {activeTab === 'notifications' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                {t('Notificaciones')}
              </CardTitle>
              <CardDescription>
                {t('Configura cómo y cuándo recibir notificaciones')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">{t('Notificaciones push')}</Label>
                    <p className="text-xs text-muted-foreground">{t('Recibe notificaciones en tiempo real')}</p>
                  </div>
                  <Switch
                    checked={notificationSettings.pushNotifications}
                    onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, pushNotifications: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">{t('Notificaciones por email')}</Label>
                    <p className="text-xs text-muted-foreground">{t('Recibe notificaciones importantes por email')}</p>
                  </div>
                  <Switch
                    checked={notificationSettings.emailNotifications}
                    onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, emailNotifications: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">{t('Notificaciones por SMS')}</Label>
                    <p className="text-xs text-muted-foreground">{t('Recibe notificaciones críticas por SMS')}</p>
                  </div>
                  <Switch
                    checked={notificationSettings.smsNotifications}
                    onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, smsNotifications: checked }))}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">{t('Sonidos')}</Label>
                    <p className="text-xs text-muted-foreground">{t('Reproducir sonidos en notificaciones')}</p>
                  </div>
                  <Switch
                    checked={notificationSettings.soundEnabled}
                    onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, soundEnabled: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">{t('Vibración')}</Label>
                    <p className="text-xs text-muted-foreground">{t('Vibración en dispositivos móviles')}</p>
                  </div>
                  <Switch
                    checked={notificationSettings.vibrationEnabled}
                    onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, vibrationEnabled: checked }))}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">{t('Horas silenciosas')}</Label>
                    <p className="text-xs text-muted-foreground">{t('No recibir notificaciones en horarios específicos')}</p>
                  </div>
                  <Switch
                    checked={notificationSettings.quietHours}
                    onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, quietHours: checked }))}
                  />
                </div>

                {notificationSettings.quietHours && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="quietHoursStart">{t('Inicio')}</Label>
                      <Input
                        id="quietHoursStart"
                        type="time"
                        value={notificationSettings.quietHoursStart}
                        onChange={(e) => setNotificationSettings(prev => ({ ...prev, quietHoursStart: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="quietHoursEnd">{t('Fin')}</Label>
                      <Input
                        id="quietHoursEnd"
                        type="time"
                        value={notificationSettings.quietHoursEnd}
                        onChange={(e) => setNotificationSettings(prev => ({ ...prev, quietHoursEnd: e.target.value }))}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={() => handleSaveSettings('notifications')} disabled={loading}>
                  {loading ? t('Guardando...') : <><Save className="h-4 w-4 mr-2" />{t('Guardar cambios')}</>}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Configuración de Rendimiento */}
        {activeTab === 'performance' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                {t('Rendimiento')}
              </CardTitle>
              <CardDescription>
                {t('Optimiza el rendimiento de la aplicación')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">{t('Guardado automático')}</Label>
                    <p className="text-xs text-muted-foreground">{t('Guardar cambios automáticamente')}</p>
                  </div>
                  <Switch
                    checked={performanceSettings.autoSave}
                    onCheckedChange={(checked) => setPerformanceSettings(prev => ({ ...prev, autoSave: checked }))}
                  />
                </div>

                {performanceSettings.autoSave && (
                  <div className="space-y-2">
                    <Label>{t('Intervalo de guardado automático')}: {performanceSettings.autoSaveInterval} {t('segundos')}</Label>
                    <Slider
                      value={[performanceSettings.autoSaveInterval]}
                      onValueChange={(value) => setPerformanceSettings(prev => ({ ...prev, autoSaveInterval: value[0] }))}
                      max={300}
                      min={10}
                      step={10}
                      className="w-full"
                    />
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">{t('Habilitar caché')}</Label>
                    <p className="text-xs text-muted-foreground">{t('Mejora la velocidad de carga')}</p>
                  </div>
                  <Switch
                    checked={performanceSettings.cacheEnabled}
                    onCheckedChange={(checked) => setPerformanceSettings(prev => ({ ...prev, cacheEnabled: checked }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="imageQuality">{t('Calidad de imagen')}</Label>
                  <Select value={performanceSettings.imageQuality} onValueChange={(value) => setPerformanceSettings(prev => ({ ...prev, imageQuality: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">{t('Baja (más rápido)')}</SelectItem>
                      <SelectItem value="medium">{t('Media')}</SelectItem>
                      <SelectItem value="high">{t('Alta (mejor calidad)')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">{t('Animaciones')}</Label>
                    <p className="text-xs text-muted-foreground">{t('Mostrar animaciones y transiciones')}</p>
                  </div>
                  <Switch
                    checked={performanceSettings.animationsEnabled}
                    onCheckedChange={(checked) => setPerformanceSettings(prev => ({ ...prev, animationsEnabled: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">{t('Modo de bajo ancho de banda')}</Label>
                    <p className="text-xs text-muted-foreground">{t('Optimizar para conexiones lentas')}</p>
                  </div>
                  <Switch
                    checked={performanceSettings.lowBandwidthMode}
                    onCheckedChange={(checked) => setPerformanceSettings(prev => ({ ...prev, lowBandwidthMode: checked }))}
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={() => handleSaveSettings('performance')} disabled={loading}>
                  {loading ? t('Guardando...') : <><Save className="h-4 w-4 mr-2" />{t('Guardar cambios')}</>}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Configuración de Seguridad */}
        {activeTab === 'security' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                {t('Seguridad')}
              </CardTitle>
              <CardDescription>
                {t('Configura las opciones de seguridad de tu cuenta')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>{t('Tiempo de sesión')}: {securitySettings.sessionTimeout} {t('minutos')}</Label>
                  <Slider
                    value={[securitySettings.sessionTimeout]}
                    onValueChange={(value) => setSecuritySettings(prev => ({ ...prev, sessionTimeout: value[0] }))}
                    max={120}
                    min={15}
                    step={15}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t('Intentos máximos de login')}: {securitySettings.maxLoginAttempts}</Label>
                  <Slider
                    value={[securitySettings.maxLoginAttempts]}
                    onValueChange={(value) => setSecuritySettings(prev => ({ ...prev, maxLoginAttempts: value[0] }))}
                    max={10}
                    min={3}
                    step={1}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t('Expiración de contraseña')}: {securitySettings.passwordExpiryDays} {t('días')}</Label>
                  <Slider
                    value={[securitySettings.passwordExpiryDays]}
                    onValueChange={(value) => setSecuritySettings(prev => ({ ...prev, passwordExpiryDays: value[0] }))}
                    max={365}
                    min={30}
                    step={30}
                    className="w-full"
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">{t('Requerir cambio de contraseña')}</Label>
                    <p className="text-xs text-muted-foreground">{t('Forzar cambio de contraseña periódico')}</p>
                  </div>
                  <Switch
                    checked={securitySettings.requirePasswordChange}
                    onCheckedChange={(checked) => setSecuritySettings(prev => ({ ...prev, requirePasswordChange: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">{t('Notificaciones de login')}</Label>
                    <p className="text-xs text-muted-foreground">{t('Recibir alertas de nuevos inicios de sesión')}</p>
                  </div>
                  <Switch
                    checked={securitySettings.loginNotifications}
                    onCheckedChange={(checked) => setSecuritySettings(prev => ({ ...prev, loginNotifications: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">{t('Gestión de dispositivos')}</Label>
                    <p className="text-xs text-muted-foreground">{t('Controlar dispositivos conectados')}</p>
                  </div>
                  <Switch
                    checked={securitySettings.deviceManagement}
                    onCheckedChange={(checked) => setSecuritySettings(prev => ({ ...prev, deviceManagement: checked }))}
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={() => handleSaveSettings('security')} disabled={loading}>
                  {loading ? t('Guardando...') : <><Save className="h-4 w-4 mr-2" />{t('Guardar cambios')}</>}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Botón para guardar todo */}
      <div className="flex justify-center">
        <Button onClick={() => handleSaveSettings('all')} disabled={loading} size="lg">
          {loading ? t('Guardando toda la configuración...') : <><Save className="h-4 w-4 mr-2" />{t('Guardar toda la configuración')}</>}
        </Button>
      </div>
    </div>
  );
} 