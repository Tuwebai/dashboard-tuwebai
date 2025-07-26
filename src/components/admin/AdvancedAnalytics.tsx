import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { toast } from '@/hooks/use-toast';
import { useApp } from '@/contexts/AppContext';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  DollarSign, 
  ShoppingCart, 
  Eye, 
  MousePointer,
  Clock,
  Target,
  BarChart3,
  PieChart,
  Activity,
  Download,
  RefreshCw,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Circle
} from 'lucide-react';
import { firestore } from '@/lib/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit, 
  startAfter,
  serverTimestamp,
  addDoc
} from 'firebase/firestore';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

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

interface AnalyticsData {
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
  engagement: {
    pageViews: number;
    sessions: number;
    bounceRate: number;
    avgSessionTime: number;
  };
}

interface FunnelData {
  stage: string;
  count: number;
  conversion: number;
}

interface UserBehavior {
  page: string;
  views: number;
  uniqueUsers: number;
  avgTime: number;
  bounceRate: number;
}

export default function AdvancedAnalytics() {
  const { user } = useApp();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [funnelData, setFunnelData] = useState<FunnelData[]>([]);
  const [userBehavior, setUserBehavior] = useState<UserBehavior[]>([]);
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 días atrás
    to: new Date()
  });
  const [timeRange, setTimeRange] = useState('30d');
  const [loading, setLoading] = useState(true);

  // Cargar datos de analytics
  useEffect(() => {
    loadAnalyticsData();
  }, [dateRange, timeRange]);

  const loadAnalyticsData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Cargar usuarios
      const usersRef = collection(firestore, 'users');
      const usersSnap = await getDocs(usersRef);
      const totalUsers = usersSnap.size;
      
      // Usuarios nuevos en el rango de fechas
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

      // Pagos del mes
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

      // Calcular métricas de engagement (simuladas)
      const engagement = {
        pageViews: Math.floor(Math.random() * 10000) + 5000,
        sessions: Math.floor(Math.random() * 2000) + 1000,
        bounceRate: Math.random() * 30 + 20,
        avgSessionTime: Math.floor(Math.random() * 300) + 120
      };

      // Calcular crecimiento
      const previousMonthRevenue = monthlyRevenue * 0.8; // Simulado
      const revenueGrowth = ((monthlyRevenue - previousMonthRevenue) / previousMonthRevenue) * 100;

      const data: AnalyticsData = {
        users: {
          total: totalUsers,
          new: newUsers,
          active: Math.floor(totalUsers * 0.7), // 70% usuarios activos
          conversion: (newUsers / totalUsers) * 100
        },
        revenue: {
          total: totalRevenue,
          monthly: monthlyRevenue,
          growth: revenueGrowth,
          average: totalRevenue / totalUsers || 0
        },
        projects: {
          total: totalProjects,
          completed: completedProjects,
          inProgress: totalProjects - completedProjects,
          conversion: (completedProjects / totalProjects) * 100
        },
        engagement: engagement
      };

      setAnalyticsData(data);

      // Generar datos del funnel
      generateFunnelData(data);
      
      // Generar datos de comportamiento de usuario
      generateUserBehaviorData();

      // Guardar en logs
      await addDoc(collection(firestore, 'admin_logs'), {
        action: 'analytics_viewed',
        user: user.email,
        dateRange: { from: dateRange.from.toISOString(), to: dateRange.to.toISOString() },
        timestamp: serverTimestamp()
      });

    } catch (error) {
      console.error('Error loading analytics:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los datos de analytics',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const generateFunnelData = (data: AnalyticsData) => {
    const funnel: FunnelData[] = [
      {
        stage: 'Visitantes',
        count: Math.floor(data.engagement.pageViews * 0.3),
        conversion: 100
      },
      {
        stage: 'Registros',
        count: data.users.new,
        conversion: (data.users.new / Math.floor(data.engagement.pageViews * 0.3)) * 100
      },
      {
        stage: 'Proyectos Creados',
        count: data.projects.total,
        conversion: (data.projects.total / data.users.new) * 100
      },
      {
        stage: 'Pagos Realizados',
        count: Math.floor(data.revenue.total / 99900), // Asumiendo $999 promedio
        conversion: (Math.floor(data.revenue.total / 99900) / data.projects.total) * 100
      }
    ];
    setFunnelData(funnel);
  };

  const generateUserBehaviorData = () => {
    const behavior: UserBehavior[] = [
      {
        page: '/dashboard',
        views: 15420,
        uniqueUsers: 1234,
        avgTime: 245,
        bounceRate: 15.2
      },
      {
        page: '/proyectos',
        views: 8920,
        uniqueUsers: 756,
        avgTime: 180,
        bounceRate: 22.1
      },
      {
        page: '/facturacion',
        views: 5430,
        uniqueUsers: 432,
        avgTime: 120,
        bounceRate: 28.5
      },
      {
        page: '/soporte',
        views: 3210,
        uniqueUsers: 298,
        avgTime: 95,
        bounceRate: 35.2
      }
    ];
    setUserBehavior(behavior);
  };

  const exportAnalytics = async () => {
    try {
      const data = {
        analytics: analyticsData,
        funnel: funnelData,
        behavior: userBehavior,
        dateRange,
        exportedAt: new Date().toISOString()
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: 'Analytics exportado',
        description: 'Los datos se descargaron correctamente'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo exportar los datos',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="text-center py-8">
        <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No hay datos disponibles</h3>
        <p className="text-muted-foreground">Los datos de analytics aparecerán aquí</p>
      </div>
    );
  }

  // Datos para gráficos
  const revenueChartData = {
    labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Ingresos',
        data: [120000, 150000, 180000, 200000, 250000, analyticsData.revenue.monthly],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true
      }
    ]
  };

  const userGrowthData = {
    labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Usuarios',
        data: [50, 75, 120, 180, 250, analyticsData.users.total],
        backgroundColor: 'rgba(34, 197, 94, 0.8)'
      }
    ]
  };

  const funnelChartData = {
    labels: funnelData.map(f => f.stage),
    datasets: [
      {
        data: funnelData.map(f => f.count),
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)'
        ]
      }
    ]
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Analytics Avanzado</h2>
          <p className="text-muted-foreground">Métricas detalladas y análisis de comportamiento</p>
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
          <Button onClick={loadAnalyticsData} variant="outline">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button onClick={exportAnalytics}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Usuarios Totales</p>
                <p className="text-2xl font-bold">{analyticsData.users.total.toLocaleString()}</p>
                <div className="flex items-center gap-1 mt-1">
                  <ArrowUpRight className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-green-500">+{analyticsData.users.new}</span>
                </div>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ingresos Totales</p>
                <p className="text-2xl font-bold">${(analyticsData.revenue.total / 100).toLocaleString()}</p>
                <div className="flex items-center gap-1 mt-1">
                  {analyticsData.revenue.growth > 0 ? (
                    <ArrowUpRight className="h-4 w-4 text-green-500" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 text-red-500" />
                  )}
                  <span className={`text-sm ${analyticsData.revenue.growth > 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {analyticsData.revenue.growth > 0 ? '+' : ''}{analyticsData.revenue.growth.toFixed(1)}%
                  </span>
                </div>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Proyectos</p>
                <p className="text-2xl font-bold">{analyticsData.projects.total}</p>
                <div className="flex items-center gap-1 mt-1">
                  <Circle className="h-3 w-3 text-green-500 fill-green-500" />
                  <span className="text-sm text-muted-foreground">{analyticsData.projects.completed} completados</span>
                </div>
              </div>
              <ShoppingCart className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Sesiones</p>
                <p className="text-2xl font-bold">{analyticsData.engagement.sessions.toLocaleString()}</p>
                <div className="flex items-center gap-1 mt-1">
                  <Clock className="h-3 w-3 text-blue-500" />
                  <span className="text-sm text-muted-foreground">{analyticsData.engagement.avgSessionTime}s promedio</span>
                </div>
              </div>
              <Eye className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Vista General</TabsTrigger>
          <TabsTrigger value="funnel">Funnel de Conversión</TabsTrigger>
          <TabsTrigger value="behavior">Comportamiento</TabsTrigger>
          <TabsTrigger value="revenue">Ingresos</TabsTrigger>
        </TabsList>

        {/* Vista General */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Crecimiento de Usuarios</CardTitle>
              </CardHeader>
              <CardContent>
                <Bar data={userGrowthData} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Ingresos Mensuales</CardTitle>
              </CardHeader>
              <CardContent>
                <Line data={revenueChartData} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Funnel de Conversión */}
        <TabsContent value="funnel" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Funnel de Conversión</CardTitle>
              </CardHeader>
              <CardContent>
                <Doughnut data={funnelChartData} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Detalles del Funnel</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {funnelData.map((stage, index) => (
                    <div key={stage.stage} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-semibold">{stage.stage}</div>
                          <div className="text-sm text-muted-foreground">
                            {stage.conversion.toFixed(1)}% conversión
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{stage.count.toLocaleString()}</div>
                        <div className="text-sm text-muted-foreground">usuarios</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Comportamiento de Usuario */}
        <TabsContent value="behavior" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Comportamiento por Página</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {userBehavior.map((page) => (
                  <div key={page.page} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        <MousePointer className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <div className="font-semibold">{page.page}</div>
                        <div className="text-sm text-muted-foreground">
                          {page.uniqueUsers.toLocaleString()} usuarios únicos
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{page.views.toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground">vistas</div>
                      <div className="text-xs text-muted-foreground">
                        {page.avgTime}s promedio • {page.bounceRate.toFixed(1)}% rebote
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Análisis de Ingresos */}
        <TabsContent value="revenue" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <DollarSign className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold">${(analyticsData.revenue.total / 100).toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">Ingresos Totales</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <Target className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold">${(analyticsData.revenue.monthly / 100).toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">Este Mes</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <TrendingUp className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold">${(analyticsData.revenue.average / 100).toFixed(0)}</div>
                  <div className="text-sm text-muted-foreground">Promedio por Usuario</div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Tendencia de Ingresos</CardTitle>
            </CardHeader>
            <CardContent>
              <Line data={revenueChartData} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 