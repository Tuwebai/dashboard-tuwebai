import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart, 
  LineChart, 
  PieChart, 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  Clock,
  DollarSign,
  Users,
  FileText,
  CheckCircle,
  AlertTriangle,
  Target,
  Zap,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  Ticket,
  BarChart3,
  CheckSquare
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Timestamp } from 'firebase/firestore';
import { exportCompleteReport, exportProjects } from '@/utils/exportUtils';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { motion, AnimatePresence } from 'framer-motion';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function AdvancedAnalytics() {
  const { projects, user } = useApp();
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [metricType, setMetricType] = useState<'overview' | 'projects' | 'performance' | 'trends'>('overview');

  // --- ESTADO GLOBAL DE PAGOS, TICKETS Y TAREAS ---
  const [allPayments, setAllPayments] = useState<any[]>([]);
  const [allTickets, setAllTickets] = useState<any[]>([]);
  const [allTasks, setAllTasks] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('__all__');
  useEffect(() => {
    // Cargar pagos
    getDocs(collection(firestore, 'pagos')).then(snap => setAllPayments(snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
    // Cargar tickets
    getDocs(collection(firestore, 'tickets')).then(snap => setAllTickets(snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
    // Cargar tareas
    getDocs(collection(firestore, 'tasks')).then(snap => setAllTasks(snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
  }, []);
  // Filtrar por proyecto seleccionado
  const filteredPayments = useMemo(() => selectedProjectId !== '__all__' ? allPayments.filter(p => p.projectId === selectedProjectId) : allPayments, [allPayments, selectedProjectId]);
  const filteredTickets = useMemo(() => selectedProjectId !== '__all__' ? allTickets.filter(t => t.projectId === selectedProjectId) : allTickets, [allTickets, selectedProjectId]);
  const filteredTasks = useMemo(() => selectedProjectId !== '__all__' ? allTasks.filter(t => t.projectId === selectedProjectId) : allTasks, [allTasks, selectedProjectId]);
  // --- FIN ESTADO GLOBAL ---

  // --- LÍNEA DE TIEMPO DE ACTIVIDAD ---
  const { logs } = useApp();
  const timelineEvents = useMemo(() => {
    let events: any[] = [];
    // Logs de proyectos
    events = events.concat(
      logs
        .filter(log => !selectedProjectId || log.projectId === selectedProjectId)
        .map(log => ({
          type: 'log',
          action: log.action,
          user: log.user,
          timestamp: log.timestamp,
          projectId: log.projectId
        }))
    );
    // Pagos
    events = events.concat(
      filteredPayments.map(p => ({
        type: 'payment',
        action: p.estado === 'completado' ? 'Pago completado' : 'Pago registrado',
        user: p.userEmail,
        timestamp: p.fecha,
        amount: p.monto,
        projectId: p.projectId
      }))
    );
    // Tickets
    events = events.concat(
      filteredTickets.map(t => ({
        type: 'ticket',
        action: t.estado === 'cerrado' ? 'Ticket cerrado' : 'Ticket creado',
        user: t.userEmail,
        timestamp: t.createdAt || t.fecha,
        projectId: t.projectId
      }))
    );
    // Tareas
    events = events.concat(
      filteredTasks.map(task => ({
        type: 'task',
        action: task.status === 'completed' ? 'Tarea completada' : 'Tarea creada',
        user: task.assignedByName,
        timestamp: task.createdAt,
        projectId: task.projectId
      }))
    );
    // Ordenar por fecha descendente
    return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [logs, filteredPayments, filteredTickets, filteredTasks, selectedProjectId]);
  // --- FIN LÍNEA DE TIEMPO ---

  // Función para obtener el estado del proyecto
  const getProjectStatus = (project: any) => {
    if (!project.fases || project.fases.length === 0) return 'Sin iniciar';
    
    const completedPhases = project.fases.filter((f: any) => f.estado === 'Terminado').length;
    const totalPhases = project.fases.length;
    
    if (completedPhases === 0) return 'Sin iniciar';
    if (completedPhases === totalPhases) return 'Completado';
    if (completedPhases > totalPhases / 2) return 'En progreso avanzado';
    return 'En progreso';
  };

  // Función para calcular progreso
  const calculateProjectProgress = (project: any) => {
    if (!project.fases || project.fases.length === 0) return 0;
    const completedPhases = project.fases.filter((f: any) => f.estado === 'Terminado').length;
    return Math.round((completedPhases / project.fases.length) * 100);
  };

  // Calcular métricas básicas
  const metrics = useMemo(() => {
    const totalProjects = projects.length;
    const completedProjects = projects.filter(p => getProjectStatus(p) === 'Completado').length;
    const inProgressProjects = projects.filter(p => getProjectStatus(p).includes('progreso')).length;
    const pendingProjects = projects.filter(p => getProjectStatus(p) === 'Sin iniciar').length;
    
    const totalProgress = projects.reduce((acc, p) => acc + calculateProjectProgress(p), 0);
    const averageProgress = totalProjects > 0 ? Math.round(totalProgress / totalProjects) : 0;
    
    const totalPhases = projects.reduce((acc, p) => acc + (p.fases?.length || 0), 0);
    const completedPhases = projects.reduce((acc, p) => 
      acc + (p.fases?.filter(f => f.estado === 'Terminado').length || 0), 0);
    
    const totalComments = projects.reduce((acc, p) => 
      acc + (p.fases?.reduce((total, fase) => 
        total + (fase.comentarios?.length || 0), 0) || 0), 0);

    return {
      totalProjects,
      completedProjects,
      inProgressProjects,
      pendingProjects,
      averageProgress,
      totalPhases,
      completedPhases,
      totalComments,
      completionRate: totalProjects > 0 ? Math.round((completedProjects / totalProjects) * 100) : 0,
      phaseCompletionRate: totalPhases > 0 ? Math.round((completedPhases / totalPhases) * 100) : 0
    };
  }, [projects]);

  function getDateISO(dateVal: any): string {
    if (!dateVal) return '';
    if (typeof dateVal === 'string') return dateVal.split('T')[0];
    if (typeof dateVal.toDate === 'function') return dateVal.toDate().toISOString().split('T')[0];
    if (dateVal instanceof Date) return dateVal.toISOString().split('T')[0];
    return '';
  }

  // Datos para gráficos
  const chartData = useMemo(() => {
    const now = new Date();
    const daysAgo = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
    
    // Generar fechas para el rango
    const dates = Array.from({ length: daysAgo }, (_, i) => {
      const date = new Date(now);
      date.setDate(date.getDate() - (daysAgo - 1 - i));
      return date.toISOString().split('T')[0];
    });

    // Proyectos por tipo
    const projectTypes = projects.reduce((acc, p) => {
      acc[p.type] = (acc[p.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Proyectos por estado
    const projectStatuses = projects.reduce((acc, p) => {
      const status = getProjectStatus(p);
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Progreso por día (usando progressHistory real)
    const progressByDay = dates.map(date => {
      // Para cada proyecto, busca el snapshot de ese día (o el más reciente anterior)
      const progresses = projects.map(p => {
        if (!p.progressHistory || p.progressHistory.length === 0) return null;
        // Buscar el snapshot más reciente hasta ese día
        const snapshots = p.progressHistory.filter((h: any) => getDateISO(h.date) <= date);
        if (snapshots.length === 0) return null;
        // Tomar el último snapshot antes o en ese día
        const last = snapshots.reduce((a: any, b: any) => (getDateISO(a.date) > getDateISO(b.date) ? a : b));
        return last.progress;
      }).filter(v => v !== null);
      return progresses.length > 0 ? Math.round(progresses.reduce((a, b) => a + b, 0) / progresses.length) : 0;
    });

    return {
      projectTypes,
      projectStatuses,
      progressByDay,
      dates
    };
  }, [projects, timeRange]);

  // Gráfico de tipos de proyecto
  const typeChartData = {
    labels: Object.keys(chartData.projectTypes),
    datasets: [{
      data: Object.values(chartData.projectTypes),
      backgroundColor: [
        'rgba(59, 130, 246, 0.8)',
        'rgba(147, 51, 234, 0.8)',
        'rgba(16, 185, 129, 0.8)',
        'rgba(245, 158, 11, 0.8)',
        'rgba(239, 68, 68, 0.8)'
      ],
      borderWidth: 2,
      borderColor: [
        'rgba(59, 130, 246, 1)',
        'rgba(147, 51, 234, 1)',
        'rgba(16, 185, 129, 1)',
        'rgba(245, 158, 11, 1)',
        'rgba(239, 68, 68, 1)'
      ]
    }]
  };

  // Gráfico de progreso temporal
  const progressChartData = {
    labels: chartData.dates.map(date => new Date(date).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })),
    datasets: [{
      label: 'Progreso Promedio (%)',
      data: chartData.progressByDay,
      borderColor: 'rgba(59, 130, 246, 1)',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      fill: true,
      tension: 0.4,
      pointBackgroundColor: 'rgba(59, 130, 246, 1)',
      pointBorderColor: '#fff',
      pointBorderWidth: 2
    }]
  };

  // Gráfico de estados de proyecto
  const statusChartData = {
    labels: Object.keys(chartData.projectStatuses),
    datasets: [{
      data: Object.values(chartData.projectStatuses),
      backgroundColor: [
        'rgba(16, 185, 129, 0.8)',
        'rgba(59, 130, 246, 0.8)',
        'rgba(245, 158, 11, 0.8)',
        'rgba(156, 163, 175, 0.8)'
      ],
      borderWidth: 2,
      borderColor: [
        'rgba(16, 185, 129, 1)',
        'rgba(59, 130, 246, 1)',
        'rgba(245, 158, 11, 1)',
        'rgba(156, 163, 175, 1)'
      ]
    }]
  };

  // Insights automáticos
  const insights = useMemo(() => {
    const insights = [];
    
    if (metrics.completionRate > 80) {
      insights.push({
        type: 'success',
        title: 'Excelente tasa de finalización',
        description: `El ${metrics.completionRate}% de tus proyectos han sido completados exitosamente.`
      });
    } else if (metrics.completionRate < 50) {
      insights.push({
        type: 'warning',
        title: 'Oportunidad de mejora',
        description: `Solo el ${metrics.completionRate}% de tus proyectos han sido completados. Considera revisar tu proceso.`
      });
    }

    if (metrics.averageProgress > 75) {
      insights.push({
        type: 'success',
        title: 'Progreso sólido',
        description: `El progreso promedio de tus proyectos es del ${metrics.averageProgress}%.`
      });
    }

    if (metrics.pendingProjects > metrics.inProgressProjects) {
      insights.push({
        type: 'info',
        title: 'Proyectos pendientes',
        description: `Tienes ${metrics.pendingProjects} proyectos sin iniciar. Considera comenzar con los más prioritarios.`
      });
    }

    if (metrics.totalComments > 0) {
      insights.push({
        type: 'info',
        title: 'Comunicación activa',
        description: `Se han realizado ${metrics.totalComments} comentarios en total, mostrando buena comunicación.`
      });
    }

    return insights;
  }, [metrics]);

  // --- COMPARATIVAS Y TENDENCIAS ---
  // Calcular progreso promedio por mes (actual y anterior)
  const now = new Date();
  const getMonthKey = (date: Date) => `${date.getFullYear()}-${(date.getMonth()+1).toString().padStart(2,'0')}`;
  const thisMonthKey = getMonthKey(now);
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthKey = getMonthKey(lastMonth);
  // Progreso promedio este mes y anterior
  const progressByMonth: Record<string, number[]> = {};
  projects.forEach(p => {
    (p.progressHistory || []).forEach(h => {
      const m = getMonthFromAnyDate(h.date);
      if (!progressByMonth[m]) progressByMonth[m] = [];
      progressByMonth[m].push(h.progress);
    });
  });
  const avgProgress = (arr: number[]) => arr.length ? Math.round(arr.reduce((a,b)=>a+b,0)/arr.length) : 0;
  const thisMonthProgress = avgProgress(progressByMonth[thisMonthKey] || []);
  const lastMonthProgress = avgProgress(progressByMonth[lastMonthKey] || []);
  const progressDiff = thisMonthProgress - lastMonthProgress;
  // Proyectos creados/finalizados por mes (últimos 12 meses)
  const months = Array.from({length:12},(_,i)=>{
    const d = new Date(now.getFullYear(), now.getMonth()-11+i, 1);
    return getMonthKey(d);
  });
  const createdByMonth: Record<string, number> = {};
  const finishedByMonth: Record<string, number> = {};
  function getMonthFromAnyDate(dateVal: any): string {
    if (!dateVal) return '';
    if (typeof dateVal === 'string') return dateVal.slice(0, 7);
    if (typeof dateVal.toDate === 'function') return dateVal.toDate().toISOString().slice(0, 7);
    if (dateVal instanceof Date) return dateVal.toISOString().slice(0, 7);
    return '';
  }
  projects.forEach(p => {
    const created = getMonthFromAnyDate(p.createdAt);
    if (months.includes(created)) createdByMonth[created] = (createdByMonth[created]||0)+1;
    // Buscar primer día en que progreso llegó a 100%
    const finished = (p.progressHistory||[]).find(h=>h.progress===100);
    const finishedMonth = finished ? getMonthFromAnyDate(finished.date) : '';
    if (finished && months.includes(finishedMonth))
      finishedByMonth[finishedMonth] = (finishedByMonth[finishedMonth]||0)+1;
  });
  const createdArr = months.map(m=>createdByMonth[m]||0);
  const finishedArr = months.map(m=>finishedByMonth[m]||0);
  // --- FIN COMPARATIVAS Y TENDENCIAS ---

  // --- ALERTAS DE PROYECTOS ESTANCADOS O SIN ACTIVIDAD ---
  const nowDate = new Date();
  const estancados = projects.filter(p => {
    if (!p.progressHistory || p.progressHistory.length === 0) return false;
    const last = p.progressHistory.reduce((a, b) => (getDateISO(a.date) > getDateISO(b.date) ? a : b));
    const lastDate = new Date(getDateISO(last.date));
    return (nowDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24) > 15 && last.progress < 100;
  });
  const sinActividad = projects.filter(p => {
    const allComentarios = (p.fases||[]).flatMap(f=>f.comentarios||[]);
    if (allComentarios.length === 0) return true;
    const last = allComentarios.reduce((a, b) => (getDateISO(a.fecha) > getDateISO(b.fecha) ? a : b));
    const lastDate = new Date(getDateISO(last.fecha));
    return (nowDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24) > 15;
  });
  // --- FIN ALERTAS DE PROYECTOS ESTANCADOS O SIN ACTIVIDAD ---

  return (
    <div className="space-y-6" id="analytics-section">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Análisis Avanzado</h2>
          <p className="text-muted-foreground">Métricas detalladas y insights de tus proyectos</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 días</SelectItem>
              <SelectItem value="30d">30 días</SelectItem>
              <SelectItem value="90d">90 días</SelectItem>
              <SelectItem value="1y">1 año</SelectItem>
            </SelectContent>
          </Select>
          <Select value={metricType} onValueChange={(value: any) => setMetricType(value)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="overview">Vista general</SelectItem>
              <SelectItem value="projects">Proyectos</SelectItem>
              <SelectItem value="performance">Rendimiento</SelectItem>
              <SelectItem value="trends">Tendencias</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      {/* Alertas y recomendaciones */}
      {(estancados.length > 0 || sinActividad.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {estancados.length > 0 && (
            <div className="p-4 rounded-lg border bg-yellow-500/10 border-yellow-500/20">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                <h4 className="font-semibold text-sm">Proyectos estancados</h4>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                {estancados.length} proyecto(s) llevan más de 15 días sin avance. Revisa el progreso y considera reasignar tareas o contactar a los responsables.
              </p>
              <ul className="text-xs text-yellow-700 list-disc ml-5">
                {estancados.map(p => <li key={p.id}>{p.name}</li>)}
              </ul>
            </div>
          )}
          {sinActividad.length > 0 && (
            <div className="p-4 rounded-lg border bg-orange-500/10 border-orange-500/20">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                <h4 className="font-semibold text-sm">Proyectos sin actividad</h4>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                {sinActividad.length} proyecto(s) llevan más de 15 días sin comentarios o interacción. Considera enviar un recordatorio o revisar con el equipo.
              </p>
              <ul className="text-xs text-orange-700 list-disc ml-5">
                {sinActividad.map(p => <li key={p.id}>{p.name}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Selector de proyecto */}
      <div className="flex items-center gap-4 mb-4">
        <label className="text-sm font-medium">Filtrar por proyecto:</label>
        <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Todos los proyectos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Todos los proyectos</SelectItem>
            {projects.map(p => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Métricas globales de pagos, tickets y tareas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CreditCard className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Pagos registrados</p>
                <p className="text-2xl font-bold">{filteredPayments.length}</p>
              </div>
            </div>
            <div className="mt-2 text-sm text-muted-foreground">Total: ${filteredPayments.reduce((acc, p) => acc + (Number(p.monto) || 0), 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Ticket className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Tickets</p>
                <p className="text-2xl font-bold">{filteredTickets.length}</p>
              </div>
            </div>
            <div className="mt-2 text-sm text-muted-foreground">Abiertos: {filteredTickets.filter(t => t.estado !== 'cerrado').length} | Cerrados: {filteredTickets.filter(t => t.estado === 'cerrado').length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckSquare className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Tareas</p>
                <p className="text-2xl font-bold">{filteredTasks.length}</p>
              </div>
            </div>
            <div className="mt-2 text-sm text-muted-foreground">Completadas: {filteredTasks.filter(t => t.status === 'completed').length} | Pendientes: {filteredTasks.filter(t => t.status !== 'completed').length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Proyectos</p>
                <p className="text-2xl font-bold">{metrics.totalProjects}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
            <div className="mt-4">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Completados:</span>
                <span className="font-medium">{metrics.completedProjects}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Progreso Promedio</p>
                <p className="text-2xl font-bold">{metrics.averageProgress}%</p>
              </div>
              <Target className="h-8 w-8 text-green-500" />
            </div>
            <div className="mt-4">
              <Progress value={metrics.averageProgress} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tasa de Finalización</p>
                <p className="text-2xl font-bold">{metrics.completionRate}%</p>
              </div>
              <CheckCircle className="h-8 w-8 text-purple-500" />
            </div>
            <div className="mt-4">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">En progreso:</span>
                <span className="font-medium">{metrics.inProgressProjects}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Actividad Total</p>
                <p className="text-2xl font-bold">{metrics.totalComments}</p>
              </div>
              <Activity className="h-8 w-8 text-orange-500" />
            </div>
            <div className="mt-4">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Fases completadas:</span>
                <span className="font-medium">{metrics.completedPhases}/{metrics.totalPhases}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Progreso temporal */}
        <Card id="progress-temporal-chart">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Progreso Temporal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Line 
              data={progressChartData} 
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    display: false
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                      callback: function(value) {
                        return value + '%';
                      }
                    }
                  }
                }
              }}
            />
          </CardContent>
        </Card>

        {/* Tipos de proyecto */}
        <Card id="tipo-proyecto-chart">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Distribución por Tipo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Doughnut 
              data={typeChartData} 
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: 'bottom'
                  }
                }
              }}
            />
          </CardContent>
        </Card>
      </div>

      {/* Estados de proyecto */}
      <Card id="estado-proyecto-chart">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart className="h-5 w-5" />
            Estados de Proyectos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <Bar 
              data={statusChartData} 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      stepSize: 1
                    }
                  }
                }
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Insights Automáticos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {insights.map((insight, index) => (
              <div 
                key={index}
                className={`p-4 rounded-lg border ${
                  insight.type === 'success' ? 'bg-green-500/10 border-green-500/20' :
                  insight.type === 'warning' ? 'bg-yellow-500/10 border-yellow-500/20' :
                  'bg-blue-500/10 border-blue-500/20'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  {insight.type === 'success' && <CheckCircle className="h-4 w-4 text-green-500" />}
                  {insight.type === 'warning' && <AlertTriangle className="h-4 w-4 text-yellow-500" />}
                  {insight.type === 'info' && <Activity className="h-4 w-4 text-blue-500" />}
                  <h4 className="font-semibold text-sm">
                    {insight.title}
                  </h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  {insight.description}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Comparativas y tendencias */}
      <Card id="comparativas-tendencias-chart">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Comparativas y Tendencias
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Progreso promedio mes actual vs anterior */}
            <div className="flex flex-col gap-2 p-2">
              <div className="text-sm text-muted-foreground">Progreso promedio este mes</div>
              <div className="flex items-center gap-2 text-2xl font-bold">
                {thisMonthProgress}%
                {progressDiff > 0 && <span className="text-green-500 flex items-center text-base"><ArrowUpRight className="h-4 w-4" />+{progressDiff}%</span>}
                {progressDiff < 0 && <span className="text-red-500 flex items-center text-base"><ArrowDownRight className="h-4 w-4" />{progressDiff}%</span>}
                {progressDiff === 0 && <span className="text-muted-foreground text-base">=</span>}
              </div>
              <div className="text-xs text-muted-foreground">Mes anterior: {lastMonthProgress}%</div>
            </div>
            {/* Gráfico de proyectos creados/finalizados por mes */}
            <div className="p-2">
              <div className="text-sm text-muted-foreground mb-1">Proyectos creados y finalizados (últimos 12 meses)</div>
              <Bar
                data={{
                  labels: months.map(m=>{
                    const [y,mo]=m.split('-');
                    return `${mo}/${y.slice(2)}`;
                  }),
                  datasets: [
                    {
                      label: 'Creados',
                      data: createdArr,
                      backgroundColor: 'rgba(59,130,246,0.7)',
                    },
                    {
                      label: 'Finalizados',
                      data: finishedArr,
                      backgroundColor: 'rgba(16,185,129,0.7)',
                    }
                  ]
                }}
                options={{
                  responsive: true,
                  plugins: { legend: { position: 'bottom' } },
                  scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
                }}
                height={180}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Métricas detalladas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Eficiencia</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Tasa de finalización</span>
                <span>{metrics.completionRate}%</span>
              </div>
              <Progress value={metrics.completionRate} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Completación de fases</span>
                <span>{metrics.phaseCompletionRate}%</span>
              </div>
              <Progress value={metrics.phaseCompletionRate} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Distribución</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm">Completados</span>
              <Badge variant="outline" className="bg-green-500/10 text-green-400">
                {metrics.completedProjects}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">En progreso</span>
              <Badge variant="outline" className="bg-blue-500/10 text-blue-400">
                {metrics.inProgressProjects}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Pendientes</span>
              <Badge variant="outline" className="bg-gray-500/10 text-gray-400">
                {metrics.pendingProjects}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Actividad</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm">Total fases</span>
              <span className="font-medium">{metrics.totalPhases}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Fases completadas</span>
              <span className="font-medium">{metrics.completedPhases}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Comentarios</span>
              <span className="font-medium">{metrics.totalComments}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Línea de tiempo animada de actividad */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Historial de Actividad
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
            <AnimatePresence>
              {timelineEvents.map((event, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -40 }}
                  transition={{ duration: 0.3, delay: idx * 0.03 }}
                  className="flex items-start gap-3 p-3 rounded-lg bg-muted/10 border border-border shadow-sm"
                >
                  <div className="mt-1">
                    {event.type === 'log' && <BarChart3 className="h-5 w-5 text-blue-500" />}
                    {event.type === 'payment' && <CreditCard className="h-5 w-5 text-green-500" />}
                    {event.type === 'ticket' && <Ticket className="h-5 w-5 text-orange-500" />}
                    {event.type === 'task' && <CheckSquare className="h-5 w-5 text-purple-500" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">
                        {event.action}
                      </span>
                      {event.amount && (
                        <span className="text-xs bg-green-500/10 text-green-600 rounded px-2 py-0.5 ml-2">
                          +${event.amount}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {event.user && <span className="mr-2">{event.user}</span>}
                      {event.timestamp && <span>{new Date(event.timestamp).toLocaleString('es-ES')}</span>}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {timelineEvents.length === 0 && (
              <div className="text-center text-muted-foreground py-8">No hay eventos registrados.</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 