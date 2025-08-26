import React, { useEffect, useState } from 'react';
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
  Filler,
  RadialLinearScale,
  LineController,
  BarController,
  DoughnutController
} from 'chart.js';
import { Line, Bar, Doughnut, Radar } from 'react-chartjs-2';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Download, Mail, TrendingUp, Users, DollarSign, Target, Activity } from 'lucide-react';

// Registrar componentes de Chart.js
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
  Filler,
  RadialLinearScale,
  LineController,
  BarController,
  DoughnutController
);

interface ChartData {
  userGrowth: {
    labels: string[];
    datasets: any[];
  };
  monthlyRevenue: {
    labels: string[];
    datasets: any[];
  };
  projectDistribution: {
    labels: string[];
    datasets: any[];
  };
  ticketPriority: {
    labels: string[];
    datasets: any[];
  };
  systemActivity: {
    labels: string[];
    datasets: any[];
  };
}

interface ExecutiveChartsProps {
  refreshData: () => void;
  lastUpdate: Date;
}

export default function ExecutiveCharts({ refreshData, lastUpdate }: ExecutiveChartsProps) {
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [timeRange, setTimeRange] = useState('30d');
  const [loading, setLoading] = useState(true);

  // Generar datos de ejemplo basados en métricas reales
  const generateChartData = () => {
    const now = new Date();
    const labels = [];
    
    // Generar etiquetas de fechas según el rango seleccionado
    if (timeRange === '7d') {
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        labels.push(date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }));
      }
    } else if (timeRange === '30d') {
      for (let i = 29; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        labels.push(date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }));
      }
    } else if (timeRange === '90d') {
      for (let i = 89; i >= 0; i -= 3) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        labels.push(date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }));
      }
    }

    // Simular datos reales con tendencias
    const userGrowthData = labels.map((_, index) => {
      const baseUsers = 150;
      const growthRate = 0.05; // 5% de crecimiento diario
      return Math.floor(baseUsers * Math.pow(1 + growthRate, index) + Math.random() * 10);
    });

    const revenueData = labels.map((_, index) => {
      const baseRevenue = 2500;
      const volatility = 0.15; // 15% de volatilidad
      return Math.floor(baseRevenue * (1 + (Math.random() - 0.5) * volatility));
    });

    setChartData({
      userGrowth: {
        labels,
        datasets: [
          {
            label: 'Usuarios Activos',
            data: userGrowthData,
            borderColor: 'rgb(59, 130, 246)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            fill: true,
            tension: 0.4,
            pointBackgroundColor: 'rgb(59, 130, 246)',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6
          }
        ]
      },
      monthlyRevenue: {
        labels,
        datasets: [
          {
            label: 'Ingresos Mensuales ($)',
            data: revenueData,
            backgroundColor: 'rgba(34, 197, 94, 0.8)',
            borderColor: 'rgb(34, 197, 94)',
            borderWidth: 2,
            borderRadius: 4,
            borderSkipped: false
          }
        ]
      },
      projectDistribution: {
        labels: ['En Desarrollo', 'Completados', 'Pendientes', 'Pausados'],
        datasets: [
          {
            data: [35, 28, 22, 15],
            backgroundColor: [
              'rgba(59, 130, 246, 0.8)',
              'rgba(34, 197, 94, 0.8)',
              'rgba(251, 191, 36, 0.8)',
              'rgba(239, 68, 68, 0.8)'
            ],
            borderColor: [
              'rgb(59, 130, 246)',
              'rgb(34, 197, 94)',
              'rgb(251, 191, 36)',
              'rgb(239, 68, 68)'
            ],
            borderWidth: 2,
            hoverOffset: 4
          }
        ]
      },
      ticketPriority: {
        labels: ['Críticos', 'Altos', 'Medios', 'Bajos'],
        datasets: [
          {
            label: 'Tickets por Prioridad',
            data: [12, 28, 45, 23],
            backgroundColor: [
              'rgba(239, 68, 68, 0.8)',
              'rgba(251, 191, 36, 0.8)',
              'rgba(59, 130, 246, 0.8)',
              'rgba(34, 197, 94, 0.8)'
            ],
            borderColor: [
              'rgb(239, 68, 68)',
              'rgb(251, 191, 36)',
              'rgb(59, 130, 246)',
              'rgb(34, 197, 94)'
            ],
            borderWidth: 2
          }
        ]
      },
      systemActivity: {
        labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
        datasets: [
          {
            label: 'Actividad del Sistema',
            data: [85, 92, 78, 95, 88, 65, 72],
            borderColor: 'rgb(147, 51, 234)',
            backgroundColor: 'rgba(147, 51, 234, 0.1)',
            fill: true,
            tension: 0.4,
            pointBackgroundColor: 'rgb(147, 51, 234)',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 4
          }
        ]
      }
    });
  };

  useEffect(() => {
    generateChartData();
    setLoading(false);
  }, [timeRange]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#e5e7eb',
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#e5e7eb',
        borderColor: '#374151',
        borderWidth: 1
      }
    },
    scales: {
      x: {
        ticks: {
          color: '#9ca3af'
        },
        grid: {
          color: '#374151'
        }
      },
      y: {
        ticks: {
          color: '#9ca3af'
        },
        grid: {
          color: '#374151'
        }
      }
    }
  };

  const doughnutOptions = {
    ...chartOptions,
    plugins: {
      ...chartOptions.plugins,
      legend: {
        ...chartOptions.plugins.legend,
        position: 'bottom' as const
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con controles */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Dashboard Ejecutivo</h2>
          <p className="text-zinc-400">
            Análisis visual de métricas clave • Última actualización: {lastUpdate.toLocaleTimeString()}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32 bg-zinc-800 border-zinc-600 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-zinc-800 border-zinc-600">
              <SelectItem value="7d">Últimos 7 días</SelectItem>
              <SelectItem value="30d">Últimos 30 días</SelectItem>
              <SelectItem value="90d">Últimos 90 días</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={refreshData} variant="outline" size="sm" className="border-zinc-600 text-zinc-300 hover:bg-zinc-800">
            <TrendingUp className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Gráficos en grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Crecimiento de Usuarios */}
        <Card className="bg-zinc-800 border-zinc-700">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-white">
              <Users className="h-5 w-5 mr-2 text-blue-400" />
              Crecimiento de Usuarios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <Line data={chartData!.userGrowth} options={chartOptions} />
            </div>
          </CardContent>
        </Card>

        {/* Ingresos Mensuales */}
        <Card className="bg-zinc-800 border-zinc-700">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-white">
              <DollarSign className="h-5 w-5 mr-2 text-green-400" />
              Ingresos Mensuales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <Bar data={chartData!.monthlyRevenue} options={chartOptions} />
            </div>
          </CardContent>
        </Card>

        {/* Distribución de Proyectos */}
        <Card className="bg-zinc-800 border-zinc-700">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-white">
              <Target className="h-5 w-5 mr-2 text-purple-400" />
              Distribución de Proyectos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <Doughnut data={chartData!.projectDistribution} options={doughnutOptions} />
            </div>
          </CardContent>
        </Card>

        {/* Tickets por Prioridad */}
        <Card className="bg-zinc-800 border-zinc-700">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-white">
              <Activity className="h-5 w-5 mr-2 text-orange-400" />
              Tickets por Prioridad
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <Bar data={chartData!.ticketPriority} options={chartOptions} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Actividad del Sistema (ancho completo) */}
      <Card className="bg-zinc-800 border-zinc-700">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center text-white">
            <Activity className="h-5 w-5 mr-2 text-purple-400" />
            Actividad del Sistema (Última Semana)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <Line data={chartData!.systemActivity} options={chartOptions} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
