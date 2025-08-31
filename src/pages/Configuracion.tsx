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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
  Unlock,
  FileText
} from 'lucide-react';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { useTranslation } from 'react-i18next';
import i18n from '@/lib/i18n';

export default function Configuracion() {
  const { user, updateUserSettings, projects } = useApp() as AppContextType;
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const { t } = useTranslation();
  
  // Configuración general
  const [generalSettings, setGeneralSettings] = useState({
    language: 'es',
    timezone: 'America/Argentina/Buenos_Aires',
    date_format: 'DD/MM/YYYY',
    time_format: '24h'
  });

  // Configuración de privacidad
  const [privacySettings, setPrivacySettings] = useState({
    profile_visibility: 'public',
    show_email: false,
    show_phone: false,
    allow_analytics: true,
    allow_cookies: true,
    two_factor_auth: false
  });

  // Configuración de rendimiento
  const [performanceSettings, setPerformanceSettings] = useState({
    auto_save: true,
    auto_save_interval: 30,
    cache_enabled: true,
    image_quality: 'high',
    animations_enabled: true,
    low_bandwidth_mode: false
  });

  // Configuración de seguridad
  const [securitySettings, setSecuritySettings] = useState({
    session_timeout: 30,
    max_login_attempts: 5,
    require_password_change: false,
    password_expiry_days: 90,
    login_notifications: true,
    device_management: true
  });

  useEffect(() => {
    if (user) {
      // Cargar configuración guardada del usuario
      setGeneralSettings({
        language: user.language || 'es',
        timezone: user.timezone || 'America/Argentina/Buenos_Aires',
        date_format: user.date_format || 'DD/MM/YYYY',
        time_format: user.time_format || '24h'
      });

      setPrivacySettings({
        profile_visibility: user.profile_visibility || 'public',
        show_email: user.show_email || false,
        show_phone: user.show_phone || false,
        allow_analytics: user.allow_analytics !== false,
        allow_cookies: user.allow_cookies !== false,
        two_factor_auth: user.two_factor_auth || false
      });

      setPerformanceSettings({
        auto_save: user.auto_save !== false,
        auto_save_interval: user.auto_save_interval || 30,
        cache_enabled: user.cache_enabled !== false,
        image_quality: user.image_quality || 'high',
        animations_enabled: user.animations_enabled !== false,
        low_bandwidth_mode: user.low_bandwidth_mode || false
      });

      setSecuritySettings({
        session_timeout: user.session_timeout || 30,
        max_login_attempts: user.max_login_attempts || 5,
        require_password_change: user.require_password_change || false,
        password_expiry_days: user.password_expiry_days || 90,
        login_notifications: user.login_notifications !== false,
        device_management: user.device_management !== false
      });
    }
  }, [user]);

  const handleSaveGeneralSettings = async () => {
    setLoading(true);
    try {
      await updateUserSettings({
        language: generalSettings.language,
        timezone: generalSettings.timezone,
        date_format: generalSettings.date_format,
        time_format: generalSettings.time_format
      });
      
      toast({
        title: 'Configuración guardada',
        description: 'Los cambios se han aplicado correctamente.'
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

  const handleSavePrivacySettings = async () => {
    setLoading(true);
    try {
      await updateUserSettings({
        profile_visibility: privacySettings.profile_visibility,
        show_email: privacySettings.show_email,
        show_phone: privacySettings.show_phone,
        allow_analytics: privacySettings.allow_analytics,
        allow_cookies: privacySettings.allow_cookies,
        two_factor_auth: privacySettings.two_factor_auth
      });
      
      toast({
        title: 'Configuración guardada',
        description: 'Los cambios de privacidad se han aplicado correctamente.'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudieron guardar los cambios de privacidad.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSavePerformanceSettings = async () => {
    setLoading(true);
    try {
      await updateUserSettings({
        auto_save: performanceSettings.auto_save,
        auto_save_interval: performanceSettings.auto_save_interval,
        cache_enabled: performanceSettings.cache_enabled,
        image_quality: performanceSettings.image_quality,
        animations_enabled: performanceSettings.animations_enabled,
        low_bandwidth_mode: performanceSettings.low_bandwidth_mode
      });
      
      toast({
        title: 'Configuración guardada',
        description: 'Los cambios de rendimiento se han aplicado correctamente.'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudieron guardar los cambios de rendimiento.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSecuritySettings = async () => {
    setLoading(true);
    try {
      await updateUserSettings({
        session_timeout: securitySettings.session_timeout,
        max_login_attempts: securitySettings.max_login_attempts,
        require_password_change: securitySettings.require_password_change,
        password_expiry_days: securitySettings.password_expiry_days,
        login_notifications: securitySettings.login_notifications,
        device_management: securitySettings.device_management
      });
      
      toast({
        title: 'Configuración guardada',
        description: 'Los cambios de seguridad se han aplicado correctamente.'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudieron guardar los cambios de seguridad.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAllSettings = async () => {
    setLoading(true);
    try {
      await updateUserSettings({
        ...generalSettings,
        ...privacySettings,
        ...performanceSettings,
        ...securitySettings
      });
      
      toast({
        title: 'Configuración guardada',
        description: 'Todas las configuraciones se han guardado correctamente.'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudieron guardar todas las configuraciones.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando configuración...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30">
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header con diseño claro */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200/50">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-800">Configuración</h1>
              <p className="text-slate-600 mt-2">
                Personaliza tu experiencia en la plataforma
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <FileText className="h-4 w-4" />
                <span>Proyectos: {projects?.length || 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs de configuración */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-white rounded-2xl shadow-lg border border-slate-200/50 p-1">
            <TabsTrigger 
              value="general" 
              className="data-[state=active]:bg-blue-500 data-[state=active]:text-white rounded-xl"
            >
              General
            </TabsTrigger>
            <TabsTrigger 
              value="privacidad" 
              className="data-[state=active]:bg-blue-500 data-[state=active]:text-white rounded-xl"
            >
              Privacidad
            </TabsTrigger>
            <TabsTrigger 
              value="rendimiento" 
              className="data-[state=active]:bg-blue-500 data-[state=active]:text-white rounded-xl"
            >
              Rendimiento
            </TabsTrigger>
            <TabsTrigger 
              value="seguridad" 
              className="data-[state=active]:bg-blue-500 data-[state=active]:text-white rounded-xl"
            >
              Seguridad
            </TabsTrigger>
          </TabsList>

          {/* Configuración General */}
          <TabsContent value="general" className="space-y-6">
            <Card className="bg-white rounded-2xl shadow-lg border border-slate-200/50">
              <CardHeader>
                <CardTitle className="text-xl text-slate-800 flex items-center gap-2">
                  <Globe className="h-5 w-5 text-blue-600" />
                  Configuración General
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="language" className="text-sm font-medium text-slate-700">
                      Idioma
                    </Label>
                    <Select
                      value={generalSettings.language}
                      onValueChange={(value) => setGeneralSettings({...generalSettings, language: value})}
                    >
                      <SelectTrigger className="border-slate-300 focus:border-blue-500 focus:ring-blue-500">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="es">Español</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="pt">Português</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="timezone" className="text-sm font-medium text-slate-700">
                      Zona horaria
                    </Label>
                    <Select
                      value={generalSettings.timezone}
                      onValueChange={(value) => setGeneralSettings({...generalSettings, timezone: value})}
                    >
                      <SelectTrigger className="border-slate-300 focus:border-blue-500 focus:ring-blue-500">
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
                    <Label htmlFor="dateFormat" className="text-sm font-medium text-slate-700">
                      Formato de fecha
                    </Label>
                    <Select
                      value={generalSettings.dateFormat}
                      onValueChange={(value) => setGeneralSettings({...generalSettings, dateFormat: value})}
                    >
                      <SelectTrigger className="border-slate-300 focus:border-blue-500 focus:ring-blue-500">
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
                    <Label htmlFor="timeFormat" className="text-sm font-medium text-slate-700">
                      Formato de hora
                    </Label>
                    <Select
                      value={generalSettings.timeFormat}
                      onValueChange={(value) => setGeneralSettings({...generalSettings, timeFormat: value})}
                    >
                      <SelectTrigger className="border-slate-300 focus:border-blue-500 focus:ring-blue-500">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="24h">24 horas</SelectItem>
                        <SelectItem value="12h">12 horas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button
                    onClick={handleSaveGeneralSettings}
                    disabled={loading}
                    className="bg-gradient-to-r from-blue-500 via-purple-600 to-fuchsia-600 hover:from-blue-600 hover:to-fuchsia-700 shadow-lg text-white font-medium"
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Guardar cambios
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Configuración de Privacidad */}
          <TabsContent value="privacidad" className="space-y-6">
            <Card className="bg-white rounded-2xl shadow-lg border border-slate-200/50">
              <CardHeader>
                <CardTitle className="text-xl text-slate-800 flex items-center gap-2">
                  <Shield className="h-5 w-5 text-green-600" />
                  Configuración de Privacidad
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                    <div className="space-y-1">
                      <Label className="text-sm font-medium text-slate-700">
                        Visibilidad del perfil
                      </Label>
                      <p className="text-xs text-slate-500">
                        Controla quién puede ver tu información
                      </p>
                    </div>
                    <Select
                      value={privacySettings.profileVisibility}
                      onValueChange={(value) => setPrivacySettings({...privacySettings, profileVisibility: value})}
                    >
                      <SelectTrigger className="w-32 border-slate-300 focus:border-blue-500 focus:ring-blue-500">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">Público</SelectItem>
                        <SelectItem value="friends">Amigos</SelectItem>
                        <SelectItem value="private">Privado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                    <div className="space-y-1">
                      <Label className="text-sm font-medium text-slate-700">
                        Mostrar email
                      </Label>
                      <p className="text-xs text-slate-500">
                        Permite que otros usuarios vean tu email
                      </p>
                    </div>
                    <Switch
                      checked={privacySettings.showEmail}
                      onCheckedChange={(checked) => setPrivacySettings({...privacySettings, showEmail: checked})}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                    <div className="space-y-1">
                      <Label className="text-sm font-medium text-slate-700">
                        Mostrar teléfono
                      </Label>
                      <p className="text-xs text-slate-500">
                        Permite que otros usuarios vean tu teléfono
                      </p>
                    </div>
                    <Switch
                      checked={privacySettings.showPhone}
                      onCheckedChange={(checked) => setPrivacySettings({...privacySettings, showPhone: checked})}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                    <div className="space-y-1">
                      <Label className="text-sm font-medium text-slate-700">
                        Análisis y cookies
                      </Label>
                      <p className="text-xs text-slate-500">
                        Permite el uso de cookies para mejorar la experiencia
                      </p>
                    </div>
                    <Switch
                      checked={privacySettings.allowCookies}
                      onCheckedChange={(checked) => setPrivacySettings({...privacySettings, allowCookies: checked})}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                    <div className="space-y-1">
                      <Label className="text-sm font-medium text-slate-700">
                        Autenticación de dos factores
                      </Label>
                      <p className="text-xs text-slate-500">
                        Añade una capa extra de seguridad a tu cuenta
                      </p>
                    </div>
                    <Switch
                      checked={privacySettings.twoFactorAuth}
                      onCheckedChange={(checked) => setPrivacySettings({...privacySettings, twoFactorAuth: checked})}
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button
                    onClick={handleSavePrivacySettings}
                    disabled={loading}
                    className="bg-gradient-to-r from-green-500 via-emerald-600 to-teal-600 hover:from-green-600 hover:to-teal-700 shadow-lg text-white font-medium"
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : (
                      <Shield className="h-4 w-4 mr-2" />
                    )}
                    Guardar cambios
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Configuración de Rendimiento */}
          <TabsContent value="rendimiento" className="space-y-6">
            <Card className="bg-white rounded-2xl shadow-lg border border-slate-200/50">
              <CardHeader>
                <CardTitle className="text-xl text-slate-800 flex items-center gap-2">
                  <Monitor className="h-5 w-5 text-purple-600" />
                  Configuración de Rendimiento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                    <div className="space-y-1">
                      <Label className="text-sm font-medium text-slate-700">
                        Guardado automático
                      </Label>
                      <p className="text-xs text-slate-500">
                        Guarda automáticamente tus cambios
                      </p>
                    </div>
                    <Switch
                      checked={performanceSettings.autoSave}
                      onCheckedChange={(checked) => setPerformanceSettings({...performanceSettings, autoSave: checked})}
                    />
                  </div>

                  {performanceSettings.autoSave && (
                    <div className="space-y-2 p-4 bg-blue-50 rounded-xl border-l-4 border-blue-500">
                      <Label className="text-sm font-medium text-blue-700">
                        Intervalo de guardado: {performanceSettings.autoSaveInterval} segundos
                      </Label>
                      <Slider
                        value={[performanceSettings.autoSaveInterval]}
                        onValueChange={(value) => setPerformanceSettings({...performanceSettings, autoSaveInterval: value[0]})}
                        max={120}
                        min={10}
                        step={10}
                        className="w-full"
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                    <div className="space-y-1">
                      <Label className="text-sm font-medium text-slate-700">
                        Cache habilitado
                      </Label>
                      <p className="text-xs text-slate-500">
                        Mejora la velocidad de carga
                      </p>
                    </div>
                    <Switch
                      checked={performanceSettings.cacheEnabled}
                      onCheckedChange={(checked) => setPerformanceSettings({...performanceSettings, cacheEnabled: checked})}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                    <div className="space-y-1">
                      <Label className="text-sm font-medium text-slate-700">
                        Calidad de imagen
                      </Label>
                      <p className="text-xs text-slate-500">
                        Balance entre calidad y velocidad
                      </p>
                    </div>
                    <Select
                      value={performanceSettings.imageQuality}
                      onValueChange={(value) => setPerformanceSettings({...performanceSettings, imageQuality: value})}
                    >
                      <SelectTrigger className="w-32 border-slate-300 focus:border-blue-500 focus:ring-blue-500">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Baja</SelectItem>
                        <SelectItem value="medium">Media</SelectItem>
                        <SelectItem value="high">Alta</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                    <div className="space-y-1">
                      <Label className="text-sm font-medium text-slate-700">
                        Animaciones
                      </Label>
                      <p className="text-xs text-slate-500">
                        Habilita las animaciones de la interfaz
                      </p>
                    </div>
                    <Switch
                      checked={performanceSettings.animationsEnabled}
                      onCheckedChange={(checked) => setPerformanceSettings({...performanceSettings, animationsEnabled: checked})}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                    <div className="space-y-1">
                      <Label className="text-sm font-medium text-slate-700">
                        Modo de bajo ancho de banda
                      </Label>
                      <p className="text-xs text-slate-500">
                        Optimiza para conexiones lentas
                      </p>
                    </div>
                    <Switch
                      checked={performanceSettings.lowBandwidthMode}
                      onCheckedChange={(checked) => setPerformanceSettings({...performanceSettings, lowBandwidthMode: checked})}
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button
                    onClick={handleSavePerformanceSettings}
                    disabled={loading}
                    className="bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 hover:from-purple-600 hover:to-red-600 shadow-lg text-white font-medium"
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : (
                      <Monitor className="h-4 w-4 mr-2" />
                    )}
                    Guardar cambios
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Configuración de Seguridad */}
          <TabsContent value="seguridad" className="space-y-6">
            <Card className="bg-white rounded-2xl shadow-lg border border-slate-200/50">
              <CardHeader>
                <CardTitle className="text-xl text-slate-800 flex items-center gap-2">
                  <Lock className="h-5 w-5 text-red-600" />
                  Configuración de Seguridad
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2 p-4 bg-slate-50 rounded-xl">
                    <Label className="text-sm font-medium text-slate-700">
                      Tiempo de sesión: {securitySettings.sessionTimeout} minutos
                    </Label>
                    <Slider
                      value={[securitySettings.sessionTimeout]}
                      onValueChange={(value) => setSecuritySettings({...securitySettings, sessionTimeout: value[0]})}
                      max={120}
                      min={15}
                      step={15}
                      className="w-full"
                    />
                    <p className="text-xs text-slate-500">
                      Tiempo antes de que se cierre la sesión por inactividad
                    </p>
                  </div>

                  <div className="space-y-2 p-4 bg-slate-50 rounded-xl">
                    <Label className="text-sm font-medium text-slate-700">
                      Intentos máximos de login: {securitySettings.maxLoginAttempts}
                    </Label>
                    <Slider
                      value={[securitySettings.maxLoginAttempts]}
                      onValueChange={(value) => setSecuritySettings({...securitySettings, maxLoginAttempts: value[0]})}
                      max={10}
                      min={3}
                      step={1}
                      className="w-full"
                    />
                    <p className="text-xs text-slate-500">
                      Número de intentos antes de bloquear la cuenta
                    </p>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                    <div className="space-y-1">
                      <Label className="text-sm font-medium text-slate-700">
                        Cambio obligatorio de contraseña
                      </Label>
                      <p className="text-xs text-slate-500">
                        Fuerza el cambio de contraseña periódicamente
                      </p>
                    </div>
                    <Switch
                      checked={securitySettings.requirePasswordChange}
                      onCheckedChange={(checked) => setSecuritySettings({...securitySettings, requirePasswordChange: checked})}
                    />
                  </div>

                  {securitySettings.requirePasswordChange && (
                    <div className="space-y-2 p-4 bg-blue-50 rounded-xl border-l-4 border-blue-500">
                      <Label className="text-sm font-medium text-blue-700">
                        Días antes de expirar: {securitySettings.passwordExpiryDays}
                      </Label>
                      <Slider
                        value={[securitySettings.passwordExpiryDays]}
                        onValueChange={(value) => setSecuritySettings({...securitySettings, passwordExpiryDays: value[0]})}
                        max={365}
                        min={30}
                        step={30}
                        className="w-full"
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                    <div className="space-y-1">
                      <Label className="text-sm font-medium text-slate-700">
                        Notificaciones de login
                      </Label>
                      <p className="text-xs text-slate-500">
                        Recibe alertas cuando se inicie sesión en tu cuenta
                      </p>
                    </div>
                    <Switch
                      checked={securitySettings.loginNotifications}
                      onCheckedChange={(checked) => setSecuritySettings({...securitySettings, loginNotifications: checked})}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                    <div className="space-y-1">
                      <Label className="text-sm font-medium text-slate-700">
                        Gestión de dispositivos
                      </Label>
                      <p className="text-xs text-slate-500">
                        Permite gestionar dispositivos conectados
                      </p>
                    </div>
                    <Switch
                      checked={securitySettings.deviceManagement}
                      onCheckedChange={(checked) => setSecuritySettings({...securitySettings, deviceManagement: checked})}
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button
                    onClick={handleSaveSecuritySettings}
                    disabled={loading}
                    className="bg-gradient-to-r from-red-500 via-pink-500 to-purple-500 hover:from-red-600 hover:to-purple-600 shadow-lg text-white font-medium"
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : (
                      <Lock className="h-4 w-4 mr-2" />
                    )}
                    Guardar cambios
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Botón para guardar toda la configuración */}
        <div className="flex justify-center">
          <Button
            onClick={handleSaveAllSettings}
            disabled={loading}
            size="lg"
            className="bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-600 hover:from-indigo-600 hover:to-pink-700 shadow-lg text-white font-medium px-8"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
            ) : (
              <Save className="h-5 w-5 mr-2" />
            )}
            Guardar toda la configuración
          </Button>
        </div>
      </div>
    </div>
  );
} 
