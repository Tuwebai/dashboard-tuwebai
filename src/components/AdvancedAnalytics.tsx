import { useState, useMemo } from 'react';
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
  Activity
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

    // Progreso por día (simulado)
    const progressByDay = dates.map(date => {
      const dayProjects = projects.filter(p => 
        new Date(p.createdAt) <= new Date(date) && 
        (new Date(p.updatedAt) >= new Date(date) || getProjectStatus(p) !== 'Completado')
      );
      return dayProjects.length > 0 
        ? Math.round(dayProjects.reduce((acc, p) => acc + calculateProjectProgress(p), 0) / dayProjects.length)
        : 0;
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

  return (
    <div className="space-y-6">
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
        <Card>
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
        <Card>
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
      <Card>
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
    </div>
  );
} 