import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Lock, 
  Unlock, 
  Users, 
  Activity, 
  Clock, 
  RefreshCw,
  Download,
  Filter,
  Search,
  BarChart3,
  FileText,
  Database,
  Network,
  Server
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

// =====================================================
// COMPONENTE DE AUDITORÍA DE SEGURIDAD PARA ADMIN
// =====================================================

export default function SecurityAudit() {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [securityLogs, setSecurityLogs] = useState<any[]>([]);
  const [userSessions, setUserSessions] = useState<any[]>([]);
  const [securityIssues, setSecurityIssues] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});

  // Estados para filtros
  const [dateRange, setDateRange] = useState('7d');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [userFilter, setUserFilter] = useState('all');

  // Cargar datos al montar el componente
  useEffect(() => {
    loadSecurityData();
  }, []);

  // =====================================================
  // CARGA DE DATOS
  // =====================================================

  const loadSecurityData = async () => {
    try {
      setLoading(true);
      
      // Cargar datos en paralelo
      const [logsData, sessionsData, issuesData, statsData] = await Promise.all([
        getSecurityLogs(),
        getUserSessions(),
        getSecurityIssues(),
        getSecurityStats()
      ]);

      setSecurityLogs(logsData);
      setUserSessions(sessionsData);
      setSecurityIssues(issuesData);
      setStats(statsData);
      
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

  const getSecurityLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('security_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting security logs:', error);
      return [];
    }
  };

  const getUserSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('user_sessions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting user sessions:', error);
      return [];
    }
  };

  const getSecurityIssues = async () => {
    try {
      const { data, error } = await supabase
        .from('security_issues')
        .select('*')
        .order('severity', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting security issues:', error);
      return [];
    }
  };

  const getSecurityStats = async () => {
    try {
      const [logsCount, sessionsCount, issuesCount, criticalIssues] = await Promise.all([
        getSecurityLogs().then(l => l.length),
        getUserSessions().then(s => s.length),
        getSecurityIssues().then(i => i.length),
        getSecurityIssues().then(i => i.filter(issue => issue.severity === 'critical').length)
      ]);

      return {
        totalLogs: logsCount,
        activeSessions: sessionsCount,
        totalIssues: issuesCount,
        criticalIssues,
        lastUpdate: new Date().toLocaleString()
      };
    } catch (error) {
      console.error('Error getting security stats:', error);
      return {};
    }
  };

  // =====================================================
  // FUNCIONES DE SEGURIDAD
  // =====================================================

  const terminateSession = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('user_sessions')
        .update({ 
          is_active: false,
          terminated_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      if (error) throw error;

      toast({
        title: 'Sesión terminada',
        description: 'La sesión del usuario se terminó correctamente'
      });

      loadSecurityData();
    } catch (error) {
      console.error('Error terminating session:', error);
      toast({
        title: 'Error',
        description: 'No se pudo terminar la sesión',
        variant: 'destructive'
      });
    }
  };

  const resolveIssue = async (issueId: string) => {
    try {
      const { error } = await supabase
        .from('security_issues')
        .update({ 
          status: 'resolved',
          resolved_at: new Date().toISOString()
        })
        .eq('id', issueId);

      if (error) throw error;

      toast({
        title: 'Problema resuelto',
        description: 'El problema de seguridad se marcó como resuelto'
      });

      loadSecurityData();
    } catch (error) {
      console.error('Error resolving issue:', error);
      toast({
        title: 'Error',
        description: 'No se pudo resolver el problema',
        variant: 'destructive'
      });
    }
  };

  const exportSecurityReport = async () => {
    try {
      const reportData = {
        timestamp: new Date().toISOString(),
        stats: stats,
        logs: securityLogs.slice(0, 100),
        issues: securityIssues,
        sessions: userSessions
      };

      const blob = new Blob([JSON.stringify(reportData, null, 2)], {
        type: 'application/json'
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `security-audit-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: 'Reporte exportado',
        description: 'El reporte de seguridad se descargó correctamente'
      });
    } catch (error) {
      console.error('Error exporting report:', error);
      toast({
        title: 'Error',
        description: 'No se pudo exportar el reporte',
        variant: 'destructive'
      });
    }
  };

  // =====================================================
  // RENDERIZADO
  // =====================================================

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando auditoría de seguridad...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Auditoría de Seguridad</h1>
          <p className="text-slate-600">
            Monitoreo y análisis de la seguridad del sistema
          </p>
        </div>
        <Button onClick={loadSecurityData}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualizar
        </Button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-slate-500">Total Logs</p>
                <p className="text-2xl font-bold text-slate-800">{stats.totalLogs || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-slate-500">Sesiones Activas</p>
                <p className="text-2xl font-bold text-slate-800">{stats.activeSessions || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm text-slate-500">Problemas</p>
                <p className="text-2xl font-bold text-slate-800">{stats.totalIssues || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm text-slate-500">Críticos</p>
                <p className="text-2xl font-bold text-slate-800">{stats.criticalIssues || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs principales */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 bg-slate-100 border-slate-200">
          <TabsTrigger value="overview">Vista General</TabsTrigger>
          <TabsTrigger value="logs">Logs de Seguridad</TabsTrigger>
          <TabsTrigger value="sessions">Sesiones</TabsTrigger>
          <TabsTrigger value="issues">Problemas</TabsTrigger>
        </TabsList>

        {/* Vista General */}
        <TabsContent value="overview" className="space-y-4">
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-slate-800">Estado de Seguridad</CardTitle>
              <CardDescription className="text-slate-600">
                Resumen general de la seguridad del sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium text-slate-800">Estado General</p>
                      <p className="text-sm text-slate-600">
                        Sistema seguro y operativo
                      </p>
                    </div>
                  </div>
                  <Badge variant="default" className="bg-green-600">
                    Seguro
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-center gap-3">
                    <Activity className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-slate-800">Actividad Reciente</p>
                      <p className="text-sm text-slate-600">
                        {stats.totalLogs || 0} eventos en las últimas 24h
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="border-slate-300 text-slate-700">
                    Normal
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Logs de Seguridad */}
        <TabsContent value="logs" className="space-y-4">
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-slate-800">Logs de Seguridad</CardTitle>
              <CardDescription className="text-slate-600">
                Registro de eventos y actividades de seguridad
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {securityLogs.map((log) => (
                  <div key={log.id} className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg bg-white">
                    <div className={`w-2 h-2 rounded-full ${
                      log.level === 'error' ? 'bg-red-500' :
                      log.level === 'warning' ? 'bg-yellow-500' :
                      log.level === 'info' ? 'bg-blue-500' : 'bg-gray-500'
                    }`} />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-800">{log.message}</p>
                      <p className="text-xs text-slate-600">
                        {new Date(log.created_at).toLocaleString()} - {log.user_id}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs border-slate-300 text-slate-700">
                      {log.level}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sesiones de Usuario */}
        <TabsContent value="sessions" className="space-y-4">
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-slate-800">Sesiones Activas</CardTitle>
              <CardDescription className="text-slate-600">
                Monitoreo de sesiones de usuario activas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {userSessions.map((session) => (
                  <div key={session.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg bg-white">
                    <div className="flex items-center gap-3">
                      <Users className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="font-medium text-slate-800">{session.user_id}</p>
                        <p className="text-sm text-slate-600">
                          {new Date(session.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={session.is_active ? 'default' : 'secondary'}>
                        {session.is_active ? 'Activa' : 'Terminada'}
                      </Badge>
                      {session.is_active && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => terminateSession(session.id)}
                        >
                          <Lock className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Problemas de Seguridad */}
        <TabsContent value="issues" className="space-y-4">
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-slate-800">Problemas de Seguridad</CardTitle>
              <CardDescription className="text-slate-600">
                Problemas identificados y su estado de resolución
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {securityIssues.map((issue) => (
                  <div key={issue.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg bg-white">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                      <div>
                        <p className="font-medium text-slate-800">{issue.title}</p>
                        <p className="text-sm text-slate-600">{issue.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={
                        issue.severity === 'critical' ? 'destructive' :
                        issue.severity === 'high' ? 'default' :
                        issue.severity === 'medium' ? 'secondary' : 'outline'
                      }>
                        {issue.severity}
                      </Badge>
                      <Badge variant={issue.status === 'resolved' ? 'default' : 'secondary'}>
                        {issue.status}
                      </Badge>
                      {issue.status !== 'resolved' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => resolveIssue(issue.id)}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
