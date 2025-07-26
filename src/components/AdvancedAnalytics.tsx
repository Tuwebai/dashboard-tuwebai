import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ComposedChart
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  FileText, 
  DollarSign, 
  Calendar,
  Download,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Target,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Filter,
  RefreshCw
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface AnalyticsData {
  projects: {
    total: number;
    active: number;
    completed: number;
    pending: number;
    monthlyGrowth: number;
  };
  users: {
    total: number;
    active: number;
    newThisMonth: number;
    growthRate: number;
  };
  revenue: {
    total: number;
    thisMonth: number;
    growth: number;
    averagePerProject: number;
  };
  performance: {
    averageCompletionTime: number;
    satisfactionRate: number;
    onTimeDelivery: number;
    qualityScore: number;
  };
  timeSeriesData: Array<{
    date: string;
    projects: number;
    users: number;
    revenue: number;
    tasks: number;
  }>;
  projectTypes: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  userActivity: Array<{
    hour: number;
    activeUsers: number;
  }>;
  taskStatus: Array<{
    status: string;
    count: number;
    color: string;
  }>;
  revenueByMonth: Array<{
    month: string;
    revenue: number;
    projects: number;
  }>;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export default function AdvancedAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  const [chartType, setChartType] = useState('line');
  const [selectedMetric, setSelectedMetric] = useState('projects');

  useEffect(() => {
    loadAnalyticsData();
  }, [timeRange]);

  const loadAnalyticsData = async () => {
    setLoading(true);
    try {
      // Simular carga de datos - en producción esto vendría de una API
      const mockData: AnalyticsData = {
        projects: {
          total: 156,
          active: 89,
          completed: 67,
          pending: 23,
          monthlyGrowth: 12.5
        },
        users: {
          total: 1247,
          active: 892,
          newThisMonth: 45,
          growthRate: 8.3
        },
        revenue: {
          total: 125000,
          thisMonth: 18500,
          growth: 15.2,
          averagePerProject: 801
        },
        performance: {
          averageCompletionTime: 18.5,
          satisfactionRate: 94.2,
          onTimeDelivery: 87.3,
          qualityScore: 91.8
        },
        timeSeriesData: generateTimeSeriesData(),
        projectTypes: [
          { name: 'Web Development', value: 45, color: '#0088FE' },
          { name: 'Mobile Apps', value: 28, color: '#00C49F' },
          { name: 'E-commerce', value: 22, color: '#FFBB28' },
          { name: 'Consulting', value: 15, color: '#FF8042' }
        ],
        userActivity: generateUserActivityData(),
        taskStatus: [
          { status: 'Completado', count: 234, color: '#00C49F' },
          { status: 'En Progreso', count: 156, color: '#FFBB28' },
          { status: 'Pendiente', count: 89, color: '#FF8042' },
          { status: 'Cancelado', count: 12, color: '#FF0000' }
        ],
        revenueByMonth: generateRevenueData()
      };

      setData(mockData);
    } catch (error) {
      console.error('Error loading analytics data:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los datos de analytics',
        variant: 'destructive'
      });
    }
    setLoading(false);
  };

  const generateTimeSeriesData = () => {
    const data = [];
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      data.push({
        date: date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }),
        projects: Math.floor(Math.random() * 10) + 5,
        users: Math.floor(Math.random() * 50) + 20,
        revenue: Math.floor(Math.random() * 2000) + 500,
        tasks: Math.floor(Math.random() * 30) + 15
      });
    }
    return data;
  };

  const generateUserActivityData = () => {
    const data = [];
    for (let hour = 0; hour < 24; hour++) {
      data.push({
        hour,
        activeUsers: Math.floor(Math.random() * 100) + 20
      });
    }
    return data;
  };

  const generateRevenueData = () => {
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return months.map((month, index) => ({
      month,
      revenue: Math.floor(Math.random() * 25000) + 10000,
      projects: Math.floor(Math.random() * 20) + 10
    }));
  };

  const getGrowthIcon = (value: number) => {
    return value >= 0 ? <TrendingUp className="h-4 w-4 text-green-500" /> : <TrendingDown className="h-4 w-4 text-red-500" />;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('es-ES').format(num);
  };

  const renderMetricCard = (title: string, value: any, icon: React.ReactNode, growth?: number, subtitle?: string) => (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
            {growth !== undefined && (
              <div className="flex items-center gap-1 mt-1">
                {getGrowthIcon(growth)}
                <span className={`text-xs ${growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {growth >= 0 ? '+' : ''}{growth.toFixed(1)}%
                </span>
              </div>
            )}
          </div>
          <div className="text-muted-foreground">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center p-8">
        <p className="text-muted-foreground">No hay datos disponibles</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics Avanzados</h1>
          <p className="text-muted-foreground">
            Métricas detalladas y análisis de rendimiento
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
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
          <Button variant="outline" onClick={loadAnalyticsData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {renderMetricCard(
          'Proyectos Totales',
          data.projects.total,
          <FileText className="h-8 w-8" />,
          data.projects.monthlyGrowth
        )}
        {renderMetricCard(
          'Usuarios Activos',
          data.users.active,
          <Users className="h-8 w-8" />,
          data.users.growthRate
        )}
        {renderMetricCard(
          'Ingresos del Mes',
          formatCurrency(data.revenue.thisMonth),
          <DollarSign className="h-8 w-8" />,
          data.revenue.growth
        )}
        {renderMetricCard(
          'Tasa de Satisfacción',
          `${data.performance.satisfactionRate}%`,
          <CheckCircle className="h-8 w-8" />
        )}
      </div>

      {/* Charts */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Vista General</TabsTrigger>
          <TabsTrigger value="revenue">Ingresos</TabsTrigger>
          <TabsTrigger value="performance">Rendimiento</TabsTrigger>
          <TabsTrigger value="activity">Actividad</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Time Series Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Tendencias en el Tiempo
                </div>
                <div className="flex items-center gap-2">
                  <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="projects">Proyectos</SelectItem>
                      <SelectItem value="users">Usuarios</SelectItem>
                      <SelectItem value="revenue">Ingresos</SelectItem>
                      <SelectItem value="tasks">Tareas</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={chartType} onValueChange={setChartType}>
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="line">Línea</SelectItem>
                      <SelectItem value="area">Área</SelectItem>
                      <SelectItem value="bar">Barras</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                {chartType === 'line' ? (
                  <LineChart data={data.timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey={selectedMetric} 
                      stroke="#0088FE" 
                      strokeWidth={2}
                      dot={{ fill: '#0088FE', strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                ) : chartType === 'area' ? (
                  <AreaChart data={data.timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey={selectedMetric} 
                      stroke="#0088FE" 
                      fill="#0088FE" 
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                ) : (
                  <BarChart data={data.timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey={selectedMetric} fill="#0088FE" />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Project Types and Task Status */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="h-5 w-5" />
                  Tipos de Proyecto
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={data.projectTypes}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {data.projectTypes.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Estado de Tareas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.taskStatus} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="status" type="category" width={100} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8884d8">
                      {data.taskStatus.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Análisis de Ingresos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={data.revenueByMonth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="revenue" fill="#8884d8" name="Ingresos" />
                  <Line yAxisId="right" type="monotone" dataKey="projects" stroke="#ff7300" name="Proyectos" />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Métricas de Rendimiento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart data={[
                  {
                    metric: 'Tiempo Promedio',
                    value: data.performance.averageCompletionTime,
                    fullMark: 30
                  },
                  {
                    metric: 'Satisfacción',
                    value: data.performance.satisfactionRate,
                    fullMark: 100
                  },
                  {
                    metric: 'Entrega a Tiempo',
                    value: data.performance.onTimeDelivery,
                    fullMark: 100
                  },
                  {
                    metric: 'Calidad',
                    value: data.performance.qualityScore,
                    fullMark: 100
                  }
                ]}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="metric" />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} />
                  <Radar name="Rendimiento" dataKey="value" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Actividad de Usuarios por Hora
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={data.userActivity}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="activeUsers" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 