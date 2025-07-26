import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, 
  Zap, 
  Database, 
  HardDrive, 
  Wifi, 
  WifiOff,
  Download,
  Upload,
  RefreshCw,
  Settings,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { usePWA } from '@/hooks/usePWA';
import { userCache, projectCache, analyticsCache, clearCache } from '@/lib/cacheService';

interface PerformanceMetrics {
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  network: {
    downlink: number;
    effectiveType: string;
    rtt: number;
  };
  cache: {
    static: number;
    dynamic: number;
    total: number;
  };
  loadTime: number;
  fps: number;
}

export default function PerformanceOptimizer() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [optimizationHistory, setOptimizationHistory] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  
  const pwa = usePWA();

  // Obtener métricas de rendimiento
  const getPerformanceMetrics = useCallback(async (): Promise<PerformanceMetrics> => {
    const memory = (performance as any).memory || {
      usedJSHeapSize: 0,
      totalJSHeapSize: 0
    };

    const connection = (navigator as any).connection || {
      downlink: 0,
      effectiveType: 'unknown',
      rtt: 0
    };

    // Obtener información del cache
    const cacheInfo = await pwa.getCacheInfo() || {};

    return {
      memory: {
        used: Math.round(memory.usedJSHeapSize / 1024 / 1024),
        total: Math.round(memory.totalJSHeapSize / 1024 / 1024),
        percentage: Math.round((memory.usedJSHeapSize / memory.totalJSHeapSize) * 100)
      },
      network: {
        downlink: connection.downlink,
        effectiveType: connection.effectiveType,
        rtt: connection.rtt
      },
      cache: {
        static: cacheInfo.staticFiles || 0,
        dynamic: cacheInfo.dynamicFiles || 0,
        total: (cacheInfo.staticFiles || 0) + (cacheInfo.dynamicFiles || 0)
      },
      loadTime: performance.now(),
      fps: 60 // Placeholder, se calcularía con requestAnimationFrame
    };
  }, [pwa]);

  // Iniciar monitoreo
  const startMonitoring = useCallback(() => {
    setIsMonitoring(true);
    const interval = setInterval(async () => {
      const newMetrics = await getPerformanceMetrics();
      setMetrics(newMetrics);
    }, 2000);

    return () => clearInterval(interval);
  }, [getPerformanceMetrics]);

  // Detener monitoreo
  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false);
  }, []);

  // Optimizar rendimiento
  const optimizePerformance = useCallback(async () => {
    try {
      const optimizations = [];

      // Limpiar cache
      await pwa.clearCache();
      optimizations.push('Cache limpiado');

      // Forzar garbage collection si está disponible
      if ((window as any).gc) {
        (window as any).gc();
        optimizations.push('Garbage collection ejecutado');
      }

      // Limpiar caches específicos
      userCache.clear();
      projectCache.clear();
      analyticsCache.clear();
      optimizations.push('Caches específicos limpiados');

      // Registrar optimización
      const optimization = {
        timestamp: new Date().toISOString(),
        optimizations,
        metrics: await getPerformanceMetrics()
      };

      setOptimizationHistory(prev => [optimization, ...prev.slice(0, 9)]);

      toast({
        title: 'Optimización completada',
        description: `Se realizaron ${optimizations.length} optimizaciones`,
      });

    } catch (error) {
      console.error('Error optimizando rendimiento:', error);
      toast({
        title: 'Error',
        description: 'No se pudo completar la optimización',
        variant: 'destructive'
      });
    }
  }, [pwa, getPerformanceMetrics]);

  // Medir FPS
  const measureFPS = useCallback(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    
    const measure = () => {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime - lastTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        setMetrics(prev => prev ? { ...prev, fps } : null);
        frameCount = 0;
        lastTime = currentTime;
      }
      
      requestAnimationFrame(measure);
    };
    
    requestAnimationFrame(measure);
  }, []);

  // Inicializar métricas
  useEffect(() => {
    getPerformanceMetrics().then(setMetrics);
    measureFPS();
  }, [getPerformanceMetrics, measureFPS]);

  // Iniciar monitoreo automático
  useEffect(() => {
    if (isMonitoring) {
      return startMonitoring();
    }
  }, [isMonitoring, startMonitoring]);

  const getPerformanceStatus = (percentage: number) => {
    if (percentage < 50) return { status: 'excellent', color: 'text-green-500', icon: CheckCircle };
    if (percentage < 75) return { status: 'good', color: 'text-yellow-500', icon: TrendingUp };
    return { status: 'poor', color: 'text-red-500', icon: AlertTriangle };
  };

  const memoryStatus = metrics ? getPerformanceStatus(metrics.memory.percentage) : null;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Optimizador de Rendimiento</h1>
          <p className="text-muted-foreground">
            Monitorea y optimiza el rendimiento de la aplicación
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={isMonitoring ? "destructive" : "default"}
            onClick={isMonitoring ? stopMonitoring : startMonitoring}
          >
            {isMonitoring ? (
              <>
                <Activity className="h-4 w-4 mr-2" />
                Detener Monitoreo
              </>
            ) : (
              <>
                <Activity className="h-4 w-4 mr-2" />
                Iniciar Monitoreo
              </>
            )}
          </Button>
          <Button onClick={optimizePerformance}>
            <Zap className="h-4 w-4 mr-2" />
            Optimizar
          </Button>
        </div>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Memoria</p>
                <p className="text-2xl font-bold">
                  {metrics?.memory.used || 0}MB
                </p>
                <p className="text-xs text-muted-foreground">
                  de {metrics?.memory.total || 0}MB
                </p>
              </div>
              {memoryStatus && (
                <memoryStatus.icon className={`h-8 w-8 ${memoryStatus.color}`} />
              )}
            </div>
            {metrics && (
              <Progress 
                value={metrics.memory.percentage} 
                className="mt-2"
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">FPS</p>
                <p className="text-2xl font-bold">{metrics?.fps || 0}</p>
                <p className="text-xs text-muted-foreground">Frames por segundo</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Conexión</p>
                <p className="text-2xl font-bold">
                  {pwa.isOnline ? (
                    <>
                      <Wifi className="h-6 w-6 text-green-500 inline mr-1" />
                      Online
                    </>
                  ) : (
                    <>
                      <WifiOff className="h-6 w-6 text-red-500 inline mr-1" />
                      Offline
                    </>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  {metrics?.network.effectiveType || 'unknown'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Cache</p>
                <p className="text-2xl font-bold">{metrics?.cache.total || 0}</p>
                <p className="text-xs text-muted-foreground">Archivos cacheados</p>
              </div>
              <Database className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs de información detallada */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="network">Red</TabsTrigger>
          <TabsTrigger value="cache">Cache</TabsTrigger>
          <TabsTrigger value="history">Historial</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Estado General del Sistema</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Memoria del Sistema</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Usado:</span>
                      <span>{metrics?.memory.used || 0} MB</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total:</span>
                      <span>{metrics?.memory.total || 0} MB</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Porcentaje:</span>
                      <span>{metrics?.memory.percentage || 0}%</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Rendimiento</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>FPS:</span>
                      <span>{metrics?.fps || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tiempo de carga:</span>
                      <span>{Math.round(metrics?.loadTime || 0)}ms</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="network" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Información de Red</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Estado:</span>
                  <Badge variant={pwa.isOnline ? "default" : "destructive"}>
                    {pwa.isOnline ? "Conectado" : "Desconectado"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Velocidad de descarga:</span>
                  <span>{metrics?.network.downlink || 0} Mbps</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Tipo de conexión:</span>
                  <span>{metrics?.network.effectiveType || 'unknown'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Latencia (RTT):</span>
                  <span>{metrics?.network.rtt || 0} ms</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cache" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gestión de Cache</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span>Archivos estáticos:</span>
                  <span>{metrics?.cache.static || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Archivos dinámicos:</span>
                  <span>{metrics?.cache.dynamic || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Total:</span>
                  <span>{metrics?.cache.total || 0}</span>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => userCache.clear()}
                >
                  Limpiar Cache de Usuario
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => projectCache.clear()}
                >
                  Limpiar Cache de Proyectos
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => analyticsCache.clear()}
                >
                  Limpiar Cache de Analytics
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Optimizaciones</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {optimizationHistory.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No hay optimizaciones registradas
                  </p>
                ) : (
                  optimizationHistory.map((optimization, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">
                          {new Date(optimization.timestamp).toLocaleString('es-ES')}
                        </span>
                        <Badge variant="outline">
                          {optimization.optimizations.length} optimizaciones
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        {optimization.optimizations.map((opt: string, optIndex: number) => (
                          <div key={optIndex} className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="text-sm">{opt}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 