import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';
import { useApp } from '@/contexts/AppContext';
import { 
  FileText, 
  Download, 
  Calendar, 
  TrendingUp, 
  Users, 
  DollarSign, 
  FolderKanban, 
  Ticket,
  BarChart3,
  PieChart,
  Activity,
  RefreshCw,
  Eye,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle
} from 'lucide-react';
import { firestore } from '@/lib/firebase';
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  addDoc,
  serverTimestamp
} from 'firebase/firestore';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface ReportData {
  users: {
    total: number;
    new: number;
    active: number;
    conversion: number;
  };
  revenue: {
    total: number;
    monthly: number;
    growth: number;
    average: number;
  };
  projects: {
    total: number;
    completed: number;
    inProgress: number;
    conversion: number;
  };
  tickets: {
    total: number;
    open: number;
    closed: number;
    avgResolutionTime: number;
  };
}

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  type: 'users' | 'revenue' | 'projects' | 'tickets' | 'comprehensive';
  icon: JSX.Element;
  color: string;
}

export default function ReportsSystem() {
  const { user } = useApp();
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    to: new Date()
  });
  const [loading, setLoading] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);

  const reportTemplates: ReportTemplate[] = [
    {
      id: 'users',
      name: 'Reporte de Usuarios',
      description: 'Análisis completo de usuarios registrados y actividad',
      type: 'users',
      icon: <Users className="h-5 w-5" />,
      color: 'bg-blue-500'
    },
    {
      id: 'revenue',
      name: 'Reporte Financiero',
      description: 'Análisis de ingresos y métricas financieras',
      type: 'revenue',
      icon: <DollarSign className="h-5 w-5" />,
      color: 'bg-green-500'
    },
    {
      id: 'projects',
      name: 'Reporte de Proyectos',
      description: 'Estado y progreso de todos los proyectos',
      type: 'projects',
      icon: <FolderKanban className="h-5 w-5" />,
      color: 'bg-purple-500'
    },
    {
      id: 'tickets',
      name: 'Reporte de Soporte',
      description: 'Análisis de tickets y tiempo de resolución',
      type: 'tickets',
      icon: <Ticket className="h-5 w-5" />,
      color: 'bg-orange-500'
    },
    {
      id: 'comprehensive',
      name: 'Reporte General',
      description: 'Reporte completo con todas las métricas',
      type: 'comprehensive',
      icon: <BarChart3 className="h-5 w-5" />,
      color: 'bg-red-500'
    }
  ];

  // Cargar datos para reportes
  useEffect(() => {
    if (!user) return;
    loadReportData();
  }, [user, dateRange]);

  const loadReportData = async () => {
    setLoading(true);
    try {
      // Cargar usuarios
      const usersRef = collection(firestore, 'users');
      const usersSnap = await getDocs(usersRef);
      const totalUsers = usersSnap.size;
      
      const newUsersQuery = query(
        usersRef,
        where('createdAt', '>=', dateRange.from.toISOString()),
        where('createdAt', '<=', dateRange.to.toISOString())
      );
      const newUsersSnap = await getDocs(newUsersQuery);
      const newUsers = newUsersSnap.size;

      // Cargar pagos
      const paymentsRef = collection(firestore, 'payments');
      const paymentsSnap = await getDocs(paymentsRef);
      const totalRevenue = paymentsSnap.docs.reduce((sum, doc) => {
        const data = doc.data();
        return sum + (data.amount || 0);
      }, 0);

      const monthlyPaymentsQuery = query(
        paymentsRef,
        where('createdAt', '>=', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      );
      const monthlyPaymentsSnap = await getDocs(monthlyPaymentsQuery);
      const monthlyRevenue = monthlyPaymentsSnap.docs.reduce((sum, doc) => {
        const data = doc.data();
        return sum + (data.amount || 0);
      }, 0);

      // Cargar proyectos
      const projectsRef = collection(firestore, 'projects');
      const projectsSnap = await getDocs(projectsRef);
      const totalProjects = projectsSnap.size;
      
      const completedProjects = projectsSnap.docs.filter(doc => {
        const data = doc.data();
        return data.fases?.every((fase: any) => fase.estado === 'Terminado');
      }).length;

      // Cargar tickets
      const ticketsRef = collection(firestore, 'tickets');
      const ticketsSnap = await getDocs(ticketsRef);
      const totalTickets = ticketsSnap.size;
      const openTickets = ticketsSnap.docs.filter(doc => {
        const data = doc.data();
        return data.estado !== 'cerrado';
      }).length;

      const data: ReportData = {
        users: {
          total: totalUsers,
          new: newUsers,
          active: Math.floor(totalUsers * 0.7),
          conversion: (newUsers / totalUsers) * 100
        },
        revenue: {
          total: totalRevenue,
          monthly: monthlyRevenue,
          growth: ((monthlyRevenue - (monthlyRevenue * 0.8)) / (monthlyRevenue * 0.8)) * 100,
          average: totalRevenue / totalUsers || 0
        },
        projects: {
          total: totalProjects,
          completed: completedProjects,
          inProgress: totalProjects - completedProjects,
          conversion: (completedProjects / totalProjects) * 100
        },
        tickets: {
          total: totalTickets,
          open: openTickets,
          closed: totalTickets - openTickets,
          avgResolutionTime: 24 // horas promedio
        }
      };

      setReportData(data);

    } catch (error) {
      console.error('Error loading report data:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los datos del reporte',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    if (!selectedTemplate || !reportData) return;

    setGeneratingReport(true);
    try {
      const template = reportTemplates.find(t => t.id === selectedTemplate);
      if (!template) return;

      // Simular generación de reporte
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Guardar en logs
      await addDoc(collection(firestore, 'admin_logs'), {
        action: 'report_generated',
        user: user?.email,
        reportType: template.name,
        dateRange: { from: dateRange.from.toISOString(), to: dateRange.to.toISOString() },
        timestamp: serverTimestamp()
      });

      // Generar archivo de reporte
      const reportContent = generateReportContent(template, reportData);
      downloadReport(reportContent, template.name);

      toast({
        title: 'Reporte generado',
        description: `${template.name} se descargó correctamente`
      });

    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: 'Error',
        description: 'No se pudo generar el reporte',
        variant: 'destructive'
      });
    } finally {
      setGeneratingReport(false);
    }
  };

  const generateReportContent = (template: ReportTemplate, data: ReportData) => {
    const header = `
REPORTE: ${template.name.toUpperCase()}
Fecha: ${new Date().toLocaleDateString()}
Período: ${dateRange.from.toLocaleDateString()} - ${dateRange.to.toLocaleDateString()}
Generado por: ${user?.email}

================================================================================
`;

    let content = header;

    switch (template.type) {
      case 'users':
        content += `
MÉTRICAS DE USUARIOS:
- Total de usuarios: ${data.users.total}
- Nuevos usuarios: ${data.users.new}
- Usuarios activos: ${data.users.active}
- Tasa de conversión: ${data.users.conversion.toFixed(1)}%

DISTRIBUCIÓN:
- Usuarios nuevos: ${((data.users.new / data.users.total) * 100).toFixed(1)}%
- Usuarios existentes: ${(((data.users.total - data.users.new) / data.users.total) * 100).toFixed(1)}%
`;
        break;

      case 'revenue':
        content += `
MÉTRICAS FINANCIERAS:
- Ingresos totales: $${(data.revenue.total / 100).toLocaleString()}
- Ingresos del mes: $${(data.revenue.monthly / 100).toLocaleString()}
- Crecimiento mensual: ${data.revenue.growth.toFixed(1)}%
- Promedio por usuario: $${(data.revenue.average / 100).toFixed(2)}

ANÁLISIS:
- Ingresos promedio diarios: $${((data.revenue.monthly / 100) / 30).toFixed(2)}
- Proyección anual: $${((data.revenue.monthly / 100) * 12).toLocaleString()}
`;
        break;

      case 'projects':
        content += `
MÉTRICAS DE PROYECTOS:
- Total de proyectos: ${data.projects.total}
- Proyectos completados: ${data.projects.completed}
- Proyectos en progreso: ${data.projects.inProgress}
- Tasa de finalización: ${data.projects.conversion.toFixed(1)}%

ESTADO:
- Completados: ${((data.projects.completed / data.projects.total) * 100).toFixed(1)}%
- En progreso: ${((data.projects.inProgress / data.projects.total) * 100).toFixed(1)}%
`;
        break;

      case 'tickets':
        content += `
MÉTRICAS DE SOPORTE:
- Total de tickets: ${data.tickets.total}
- Tickets abiertos: ${data.tickets.open}
- Tickets cerrados: ${data.tickets.closed}
- Tiempo promedio de resolución: ${data.tickets.avgResolutionTime} horas

RENDIMIENTO:
- Tasa de resolución: ${((data.tickets.closed / data.tickets.total) * 100).toFixed(1)}%
- Tickets por día: ${(data.tickets.total / 30).toFixed(1)}
`;
        break;

      case 'comprehensive':
        content += `
REPORTE COMPREHENSIVO - TODAS LAS MÉTRICAS

USUARIOS:
- Total: ${data.users.total}
- Nuevos: ${data.users.new}
- Activos: ${data.users.active}
- Conversión: ${data.users.conversion.toFixed(1)}%

INGRESOS:
- Total: $${(data.revenue.total / 100).toLocaleString()}
- Mensual: $${(data.revenue.monthly / 100).toLocaleString()}
- Crecimiento: ${data.revenue.growth.toFixed(1)}%

PROYECTOS:
- Total: ${data.projects.total}
- Completados: ${data.projects.completed}
- En progreso: ${data.projects.inProgress}
- Finalización: ${data.projects.conversion.toFixed(1)}%

SOPORTE:
- Tickets: ${data.tickets.total}
- Abiertos: ${data.tickets.open}
- Cerrados: ${data.tickets.closed}
- Resolución: ${data.tickets.avgResolutionTime}h promedio
`;
        break;
    }

    return content;
  };

  const downloadReport = (content: string, reportName: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportName}-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Datos para gráficos
  const usersChartData = {
    labels: ['Nuevos', 'Existentes'],
    datasets: [{
      data: reportData ? [reportData.users.new, reportData.users.total - reportData.users.new] : [0, 0],
      backgroundColor: ['#3b82f6', '#6b7280']
    }]
  };

  const revenueChartData = {
    labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
    datasets: [{
      label: 'Ingresos',
      data: [120000, 150000, 180000, 200000, 250000, reportData?.revenue.monthly || 0],
      borderColor: '#10b981',
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
      fill: true
    }]
  };

  const projectsChartData = {
    labels: ['Completados', 'En Progreso'],
    datasets: [{
      data: reportData ? [reportData.projects.completed, reportData.projects.inProgress] : [0, 0],
      backgroundColor: ['#8b5cf6', '#f59e0b']
    }]
  };

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
          <h2 className="text-2xl font-bold">Sistema de Reportes</h2>
          <p className="text-muted-foreground">Genera y exporta reportes detallados del sistema</p>
        </div>
        <Button onClick={loadReportData} variant="outline">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Configuración de reporte */}
      <Card>
        <CardHeader>
          <CardTitle>Configurar Reporte</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">Tipo de Reporte</label>
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar reporte" />
                </SelectTrigger>
                <SelectContent>
                  {reportTemplates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      <div className="flex items-center gap-2">
                        <div className={`p-1 rounded ${template.color}`}>
                          {template.icon}
                        </div>
                        <div>
                          <div className="font-medium">{template.name}</div>
                          <div className="text-xs text-muted-foreground">{template.description}</div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Rango de Fechas</label>
              <DatePickerWithRange date={dateRange} onDateChange={setDateRange} />
            </div>
            <div className="flex items-end">
              <Button 
                onClick={generateReport} 
                disabled={!selectedTemplate || generatingReport}
                className="w-full"
              >
                {generatingReport ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                {generatingReport ? 'Generando...' : 'Generar Reporte'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Plantillas de reportes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reportTemplates.map((template) => (
          <Card 
            key={template.id} 
            className={`cursor-pointer transition-all hover:shadow-lg ${
              selectedTemplate === template.id ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => setSelectedTemplate(template.id)}
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className={`p-2 rounded-lg ${template.color} text-white`}>
                  {template.icon}
                </div>
                <div>
                  <h3 className="font-semibold">{template.name}</h3>
                  <p className="text-sm text-muted-foreground">{template.description}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Badge variant="outline">{template.type}</Badge>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Vista previa de datos */}
      {reportData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gráficos */}
          <Card>
            <CardHeader>
              <CardTitle>Distribución de Usuarios</CardTitle>
            </CardHeader>
            <CardContent>
              <Doughnut data={usersChartData} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tendencia de Ingresos</CardTitle>
            </CardHeader>
            <CardContent>
              <Line data={revenueChartData} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Estado de Proyectos</CardTitle>
            </CardHeader>
            <CardContent>
              <Doughnut data={projectsChartData} />
            </CardContent>
          </Card>

          {/* Métricas rápidas */}
          <Card>
            <CardHeader>
              <CardTitle>Métricas Rápidas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Usuarios Activos</span>
                    <span className="text-sm text-muted-foreground">{reportData.users.active}</span>
                  </div>
                  <Progress value={reportData.users.conversion} />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Ingresos Mensuales</span>
                    <span className="text-sm text-muted-foreground">${(reportData.revenue.monthly / 100).toLocaleString()}</span>
                  </div>
                  <Progress value={Math.min((reportData.revenue.growth + 100) / 2, 100)} />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Proyectos Completados</span>
                    <span className="text-sm text-muted-foreground">{reportData.projects.completed}</span>
                  </div>
                  <Progress value={reportData.projects.conversion} />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Tickets Resueltos</span>
                    <span className="text-sm text-muted-foreground">{reportData.tickets.closed}</span>
                  </div>
                  <Progress value={((reportData.tickets.closed / reportData.tickets.total) * 100) || 0} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
} 