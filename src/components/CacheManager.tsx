import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Trash2, 
  RefreshCw, 
  HardDrive, 
  Wifi, 
  WifiOff,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';
import { useServiceWorker, formatBytes } from '@/utils/serviceWorker';
import { useOnlineStatus } from '@/utils/serviceWorker';

// =====================================================
// COMPONENTE DE GESTIÓN DE CACHE
// =====================================================

interface CacheManagerProps {
  className?: string;
}

export default function CacheManager({ className }: CacheManagerProps) {
  const { status, cacheSize, clearCache, checkForUpdates, refreshCacheSize } = useServiceWorker();
  const isOnline = useOnlineStatus();
  const [isClearing, setIsClearing] = React.useState(false);
  const [isChecking, setIsChecking] = React.useState(false);

  const handleClearCache = async () => {
    setIsClearing(true);
    try {
      await clearCache();
      await refreshCacheSize();
    } catch (error) {
      console.error('Error clearing cache:', error);
    } finally {
      setIsClearing(false);
    }
  };

  const handleCheckUpdates = async () => {
    setIsChecking(true);
    try {
      await checkForUpdates();
    } catch (error) {
      console.error('Error checking updates:', error);
    } finally {
      setIsChecking(false);
    }
  };

  const getStatusColor = () => {
    if (!status.isSupported) return 'destructive';
    if (!status.isRegistered) return 'secondary';
    if (!status.isActive) return 'warning';
    return 'default';
  };

  const getStatusText = () => {
    if (!status.isSupported) return 'No soportado';
    if (!status.isRegistered) return 'No registrado';
    if (!status.isActive) return 'Inactivo';
    return 'Activo';
  };

  const getStatusIcon = () => {
    if (!status.isSupported) return <AlertCircle className="h-4 w-4" />;
    if (!status.isRegistered) return <Info className="h-4 w-4" />;
    if (!status.isActive) return <AlertCircle className="h-4 w-4" />;
    return <CheckCircle className="h-4 w-4" />;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HardDrive className="h-5 w-5" />
          Gestión de Cache
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Estado de Conectividad */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isOnline ? (
              <Wifi className="h-4 w-4 text-green-500" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-500" />
            )}
            <span className="text-sm font-medium">
              {isOnline ? 'En línea' : 'Sin conexión'}
            </span>
          </div>
          <Badge variant={isOnline ? 'default' : 'destructive'}>
            {isOnline ? 'Online' : 'Offline'}
          </Badge>
        </div>

        {/* Estado del Service Worker */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Service Worker</span>
            <Badge variant={getStatusColor()} className="flex items-center gap-1">
              {getStatusIcon()}
              {getStatusText()}
            </Badge>
          </div>
          {status.scope && (
            <p className="text-xs text-muted-foreground">
              Alcance: {status.scope}
            </p>
          )}
        </div>

        {/* Tamaño del Cache */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Tamaño del Cache</span>
            <span className="text-sm font-mono">
              {formatBytes(cacheSize)}
            </span>
          </div>
          <Progress 
            value={Math.min((cacheSize / (5 * 1024 * 1024)) * 100, 100)} 
            className="h-2"
          />
          <p className="text-xs text-muted-foreground">
            Límite recomendado: 5MB
          </p>
        </div>

        {/* Acciones */}
        <div className="flex flex-col gap-2">
          <Button
            onClick={handleClearCache}
            disabled={isClearing || !status.isActive}
            variant="outline"
            size="sm"
            className="w-full"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {isClearing ? 'Limpiando...' : 'Limpiar Cache'}
          </Button>
          
          <Button
            onClick={handleCheckUpdates}
            disabled={isChecking || !status.isActive}
            variant="outline"
            size="sm"
            className="w-full"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isChecking ? 'animate-spin' : ''}`} />
            {isChecking ? 'Verificando...' : 'Verificar Actualizaciones'}
          </Button>
        </div>

        {/* Información Adicional */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• El cache mejora la velocidad de carga</p>
          <p>• Los datos se sincronizan automáticamente</p>
          <p>• Funciona offline para recursos cacheados</p>
        </div>
      </CardContent>
    </Card>
  );
}
