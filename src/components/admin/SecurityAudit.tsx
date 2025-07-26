import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/hooks/use-toast';
import { useApp } from '@/contexts/AppContext';
import { 
  Shield, 
  AlertTriangle, 
  Eye, 
  Lock, 
  Unlock, 
  User, 
  Clock, 
  MapPin,
  Activity,
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Download,
  Search,
  Filter,
  Trash2,
  Ban,
  Key,
  Database,
  Server,
  Network,
  FileText,
  Settings
} from 'lucide-react';
import { firestore } from '@/lib/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit, 
  addDoc,
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore';

interface SecurityLog {
  id: string;
  action: string;
  user: string;
  userEmail: string;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'auth' | 'data' | 'system' | 'payment' | 'admin';
  details: any;
  location?: string;
  success: boolean;
}

interface SecurityAlert {
  id: string;
  type: 'failed_login' | 'suspicious_activity' | 'data_breach' | 'system_error';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  resolved: boolean;
  user?: string;
  ipAddress?: string;
}

interface SecurityStats {
  totalLogs: number;
  failedLogins: number;
  suspiciousActivities: number;
  dataAccess: number;
  systemErrors: number;
  last24h: number;
  last7d: number;
  last30d: number;
}

export default function SecurityAudit() {
  const { user } = useApp();
  const [securityLogs, setSecurityLogs] = useState<SecurityLog[]>([]);
  const [securityAlerts, setSecurityAlerts] = useState<SecurityAlert[]>([]);
  const [securityStats, setSecurityStats] = useState<SecurityStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [timeFilter, setTimeFilter] = useState('24h');

  // Cargar logs de seguridad
  useEffect(() => {
    if (!user) return;
    
    loadSecurityData();
    setupRealtimeListeners();
  }, [user, timeFilter]);

  const loadSecurityData = async () => {
    setLoading(true);
    try {
      // Cargar logs de seguridad
      const logsRef = collection(firestore, 'security_logs');
      const logsQuery = query(
        logsRef,
        orderBy('timestamp', 'desc'),
        limit(100)
      );
      
      const logsSnap = await getDocs(logsQuery);
      const logs = logsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SecurityLog[];
      
      setSecurityLogs(logs);

      // Generar alertas de seguridad
      generateSecurityAlerts(logs);

      // Calcular estadísticas
      calculateSecurityStats(logs);

      // Guardar en logs de auditoría
      await addDoc(collection(firestore, 'admin_logs'), {
        action: 'security_audit_viewed',
        user: user.email,
        timestamp: serverTimestamp(),
        details: { logsCount: logs.length }
      });

    } catch (error) {
      console.error('Error loading security data:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los datos de seguridad',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeListeners = () => {
    // Escuchar nuevos logs en tiempo real
    const logsRef = collection(firestore, 'security_logs');
    const logsQuery = query(logsRef, orderBy('timestamp', 'desc'), limit(10));
    
    return onSnapshot(logsQuery, (snapshot) => {
      const newLogs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SecurityLog[];
      
      setSecurityLogs(prev => {
        const updated = [...newLogs, ...prev.filter(log => 
          !newLogs.find(newLog => newLog.id === log.id)
        )];
        return updated.slice(0, 100);
      });
    });
  };

  const generateSecurityAlerts = (logs: SecurityLog[]) => {
    const alerts: SecurityAlert[] = [];

    // Detectar intentos de login fallidos
    const failedLogins = logs.filter(log => 
      log.action === 'login_failed' && 
      new Date(log.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000)
    );

    if (failedLogins.length > 5) {
      alerts.push({
        id: 'failed_login_alert',
        type: 'failed_login',
        title: 'Múltiples intentos de login fallidos',
        description: `${failedLogins.length} intentos de login fallidos en las últimas 24 horas`,
        severity: 'high',
        timestamp: new Date().toISOString(),
        resolved: false,
        ipAddress: failedLogins[0]?.ipAddress
      });
    }

    // Detectar actividades sospechosas
    const suspiciousActivities = logs.filter(log => 
      log.severity === 'high' || log.severity === 'critical'
    );

    if (suspiciousActivities.length > 0) {
      alerts.push({
        id: 'suspicious_activity_alert',
        type: 'suspicious_activity',
        title: 'Actividad sospechosa detectada',
        description: `${suspiciousActivities.length} actividades de alta severidad detectadas`,
        severity: 'critical',
        timestamp: new Date().toISOString(),
        resolved: false
      });
    }

    setSecurityAlerts(alerts);
  };

  const calculateSecurityStats = (logs: SecurityLog[]) => {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const stats: SecurityStats = {
      totalLogs: logs.length,
      failedLogins: logs.filter(log => log.action === 'login_failed').length,
      suspiciousActivities: logs.filter(log => log.severity === 'high' || log.severity === 'critical').length,
      dataAccess: logs.filter(log => log.category === 'data').length,
      systemErrors: logs.filter(log => log.action === 'system_error').length,
      last24h: logs.filter(log => new Date(log.timestamp) > last24h).length,
      last7d: logs.filter(log => new Date(log.timestamp) > last7d).length,
      last30d: logs.filter(log => new Date(log.timestamp) > last30d).length
    };

    setSecurityStats(stats);
  };

  const resolveAlert = async (alertId: string) => {
    try {
      setSecurityAlerts(prev => prev.map(alert => 
        alert.id === alertId ? { ...alert, resolved: true } : alert
      ));

      await addDoc(collection(firestore, 'admin_logs'), {
        action: 'security_alert_resolved',
        user: user?.email,
        alertId,
        timestamp: serverTimestamp()
      });

      toast({
        title: 'Alerta resuelta',
        description: 'La alerta de seguridad fue marcada como resuelta'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo resolver la alerta',
        variant: 'destructive'
      });
    }
  };

  const exportSecurityLogs = async () => {
    try {
      const data = {
        logs: securityLogs,
        alerts: securityAlerts,
        stats: securityStats,
        exportedAt: new Date().toISOString(),
        exportedBy: user?.email
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `security-logs-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: 'Logs exportados',
        description: 'Los logs de seguridad se descargaron correctamente'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudieron exportar los logs',
        variant: 'destructive'
      });
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'high': return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      case 'medium': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'low': return 'bg-green-500/10 text-green-400 border-green-500/20';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'auth': return <Key className="h-4 w-4" />;
      case 'data': return <Database className="h-4 w-4" />;
      case 'system': return <Server className="h-4 w-4" />;
      case 'payment': return <FileText className="h-4 w-4" />;
      case 'admin': return <Settings className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const filteredLogs = securityLogs.filter(log => {
    const matchesSearch = log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.ipAddress.includes(searchTerm);
    const matchesSeverity = severityFilter === 'all' || log.severity === severityFilter;
    const matchesCategory = categoryFilter === 'all' || log.category === categoryFilter;
    
    return matchesSearch && matchesSeverity && matchesCategory;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Seguridad y Auditoría</h2>
          <p className="text-muted-foreground">Monitoreo de seguridad y logs de auditoría</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={loadSecurityData} variant="outline">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button onClick={exportSecurityLogs}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Estadísticas de seguridad */}
      {securityStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-red-500/10 rounded-lg">
                  <AlertTriangle className="h-6 w-6 text-red-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Logins Fallidos</p>
                  <p className="text-2xl font-bold">{securityStats.failedLogins}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-orange-500/10 rounded-lg">
                  <Shield className="h-6 w-6 text-orange-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Actividades Sospechosas</p>
                  <p className="text-2xl font-bold">{securityStats.suspiciousActivities}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-500/10 rounded-lg">
                  <Database className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Accesos a Datos</p>
                  <p className="text-2xl font-bold">{securityStats.dataAccess}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-500/10 rounded-lg">
                  <Server className="h-6 w-6 text-purple-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Errores del Sistema</p>
                  <p className="text-2xl font-bold">{securityStats.systemErrors}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Alertas de seguridad */}
      {securityAlerts.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertCircle className="h-5 w-5" />
              Alertas de Seguridad
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {securityAlerts.filter(alert => !alert.resolved).map((alert) => (
                <div key={alert.id} className="flex items-center justify-between p-3 bg-white rounded border">
                  <div>
                    <div className="font-semibold text-red-700">{alert.title}</div>
                    <div className="text-sm text-red-600">{alert.description}</div>
                    <div className="text-xs text-red-500 mt-1">
                      {new Date(alert.timestamp).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getSeverityColor(alert.severity)}>
                      {alert.severity}
                    </Badge>
                    <Button size="sm" onClick={() => resolveAlert(alert.id)}>
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="logs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="logs">Logs de Seguridad</TabsTrigger>
          <TabsTrigger value="activity">Actividad Reciente</TabsTrigger>
          <TabsTrigger value="alerts">Alertas</TabsTrigger>
        </TabsList>

        {/* Logs de Seguridad */}
        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Logs de Seguridad</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Filtros */}
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Label>Buscar</Label>
                    <Input
                      placeholder="Buscar por acción, usuario o IP..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Severidad</Label>
                    <Select value={severityFilter} onValueChange={setSeverityFilter}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas</SelectItem>
                        <SelectItem value="low">Baja</SelectItem>
                        <SelectItem value="medium">Media</SelectItem>
                        <SelectItem value="high">Alta</SelectItem>
                        <SelectItem value="critical">Crítica</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Categoría</Label>
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas</SelectItem>
                        <SelectItem value="auth">Autenticación</SelectItem>
                        <SelectItem value="data">Datos</SelectItem>
                        <SelectItem value="system">Sistema</SelectItem>
                        <SelectItem value="payment">Pagos</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Lista de logs */}
                <ScrollArea className="h-96">
                  <div className="space-y-2">
                    {filteredLogs.map((log) => (
                      <div key={log.id} className="flex items-center justify-between p-3 bg-muted rounded border">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-background rounded">
                            {getCategoryIcon(log.category)}
                          </div>
                          <div>
                            <div className="font-semibold">{log.action}</div>
                            <div className="text-sm text-muted-foreground">
                              {log.userEmail} • {log.ipAddress}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(log.timestamp).toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getSeverityColor(log.severity)}>
                            {log.severity}
                          </Badge>
                          {log.success ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Actividad Reciente */}
        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Actividad Reciente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-muted rounded">
                    <div className="text-2xl font-bold">{securityStats?.last24h}</div>
                    <div className="text-sm text-muted-foreground">Últimas 24h</div>
                  </div>
                  <div className="text-center p-4 bg-muted rounded">
                    <div className="text-2xl font-bold">{securityStats?.last7d}</div>
                    <div className="text-sm text-muted-foreground">Últimos 7 días</div>
                  </div>
                  <div className="text-center p-4 bg-muted rounded">
                    <div className="text-2xl font-bold">{securityStats?.last30d}</div>
                    <div className="text-sm text-muted-foreground">Últimos 30 días</div>
                  </div>
                </div>

                <div className="space-y-2">
                  {securityLogs.slice(0, 10).map((log) => (
                    <div key={log.id} className="flex items-center gap-3 p-3 bg-muted rounded">
                      <div className="w-2 h-2 rounded-full bg-primary"></div>
                      <div className="flex-1">
                        <div className="font-medium">{log.action}</div>
                        <div className="text-sm text-muted-foreground">
                          {log.userEmail} • {log.ipAddress}
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alertas */}
        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Alertas de Seguridad</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {securityAlerts.length === 0 ? (
                  <div className="text-center py-8">
                    <Shield className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Sin alertas activas</h3>
                    <p className="text-muted-foreground">El sistema está funcionando correctamente</p>
                  </div>
                ) : (
                  securityAlerts.map((alert) => (
                    <div key={alert.id} className={`p-4 rounded border ${
                      alert.resolved ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className={`font-semibold ${
                            alert.resolved ? 'text-green-700' : 'text-red-700'
                          }`}>
                            {alert.title}
                          </div>
                          <div className={`text-sm ${
                            alert.resolved ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {alert.description}
                          </div>
                          <div className={`text-xs mt-1 ${
                            alert.resolved ? 'text-green-500' : 'text-red-500'
                          }`}>
                            {new Date(alert.timestamp).toLocaleString()}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getSeverityColor(alert.severity)}>
                            {alert.severity}
                          </Badge>
                          {alert.resolved ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <Button size="sm" onClick={() => resolveAlert(alert.id)}>
                              Resolver
                            </Button>
                          )}
                        </div>
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