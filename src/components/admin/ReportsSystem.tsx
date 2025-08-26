import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  Download, 
  Mail, 
  Calendar, 
  BarChart3, 
  TrendingUp, 
  Users, 
  Target,
  Clock,
  CheckCircle,
  AlertCircle,
  DollarSign,
  Settings,
  RefreshCw
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  type: 'daily' | 'weekly' | 'monthly' | 'custom';
  lastGenerated: Date | null;
  status: 'active' | 'inactive';
  recipients: string[];
  schedule: string;
}

interface ReportData {
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  totalProjects: number;
  completedProjects: number;
  pendingProjects: number;
  totalTickets: number;
  resolvedTickets: number;
  urgentTickets: number;
  totalRevenue: number;
  monthlyRevenue: number;
  averageProjectValue: number;
}

export default function ReportsSystem() {
  const [reportTemplates, setReportTemplates] = useState<ReportTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState('templates');

  // Datos de ejemplo para reportes
  const sampleReportData: ReportData = {
    totalUsers: 156,
    activeUsers: 142,
    newUsers: 23,
    totalProjects: 89,
    completedProjects: 34,
    pendingProjects: 28,
    totalTickets: 108,
    resolvedTickets: 87,
    urgentTickets: 12,
    totalRevenue: 45600,
    monthlyRevenue: 8900,
    averageProjectValue: 512
  };

  // Templates de reportes predefinidos
  const defaultTemplates: ReportTemplate[] = [
    {
      id: '1',
      name: 'Reporte Diario Ejecutivo',
      description: 'Resumen diario de métricas clave del negocio',
      type: 'daily',
      lastGenerated: null,
      status: 'active',
      recipients: ['admin@tuweb-ai.com', 'ceo@tuweb-ai.com'],
      schedule: '09:00'
    },
    {
      id: '2',
      name: 'Reporte Semanal de Proyectos',
      description: 'Estado semanal de todos los proyectos activos',
      type: 'weekly',
      lastGenerated: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      status: 'active',
      recipients: ['pm@tuweb-ai.com', 'team@tuweb-ai.com'],
      schedule: 'Lunes 08:00'
    },
    {
      id: '3',
      name: 'Reporte Mensual Financiero',
      description: 'Análisis mensual de ingresos y métricas financieras',
      type: 'monthly',
      lastGenerated: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      status: 'active',
      recipients: ['finance@tuweb-ai.com', 'admin@tuweb-ai.com'],
      schedule: 'Primer día del mes 09:00'
    }
  ];

  useEffect(() => {
    setReportTemplates(defaultTemplates);
    setReportData(sampleReportData);
  }, []);

  // Generar reporte PDF
  const generatePDFReport = async (template: ReportTemplate) => {
    setGenerating(true);
    try {
      // Simular generación de PDF
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Crear contenido del PDF
      const pdfContent = `
        REPORTE: ${template.name}
        Fecha: ${new Date().toLocaleDateString('es-ES')}
        
        RESUMEN EJECUTIVO:
        - Usuarios totales: ${reportData?.totalUsers}
        - Proyectos activos: ${reportData?.totalProjects}
        - Ingresos mensuales: $${reportData?.monthlyRevenue}
        - Tickets urgentes: ${reportData?.urgentTickets}
        
        MÉTRICAS DETALLADAS:
        - Nuevos usuarios este mes: ${reportData?.newUsers}
        - Proyectos completados: ${reportData?.completedProjects}
        - Tasa de resolución de tickets: ${((reportData?.resolvedTickets! / reportData?.totalTickets!) * 100).toFixed(1)}%
        - Valor promedio por proyecto: $${reportData?.averageProjectValue}
      `;

      // Crear y descargar archivo
      const blob = new Blob([pdfContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reporte_${template.name.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Actualizar último generado
      const updatedTemplates = reportTemplates.map(t => 
        t.id === template.id ? { ...t, lastGenerated: new Date() } : t
      );
      setReportTemplates(updatedTemplates);

      toast({
        title: "Reporte generado exitosamente",
        description: `El reporte "${template.name}" se ha generado y descargado.`,
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Error al generar reporte",
        description: "Hubo un problema al generar el reporte PDF.",
        variant: "destructive"
      });
    } finally {
      setGenerating(false);
    }
  };

  // Enviar reporte por email
  const sendReportByEmail = async (template: ReportTemplate) => {
    setGenerating(true);
    try {
      // Simular envío de email
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: "Reporte enviado por email",
        description: `El reporte "${template.name}" se ha enviado a ${template.recipients.length} destinatarios.`,
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Error al enviar reporte",
        description: "Hubo un problema al enviar el reporte por email.",
        variant: "destructive"
      });
    } finally {
      setGenerating(false);
    }
  };

  // Exportar a Excel/CSV
  const exportToExcel = async () => {
    setGenerating(true);
    try {
      // Simular exportación
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Crear datos CSV
      const csvData = [
        ['Métrica', 'Valor', 'Unidad'],
        ['Usuarios Totales', reportData?.totalUsers, 'usuarios'],
        ['Usuarios Activos', reportData?.activeUsers, 'usuarios'],
        ['Nuevos Usuarios', reportData?.newUsers, 'usuarios'],
        ['Proyectos Totales', reportData?.totalProjects, 'proyectos'],
        ['Proyectos Completados', reportData?.completedProjects, 'proyectos'],
        ['Proyectos Pendientes', reportData?.pendingProjects, 'proyectos'],
        ['Tickets Totales', reportData?.totalTickets, 'tickets'],
        ['Tickets Resueltos', reportData?.resolvedTickets, 'tickets'],
        ['Tickets Urgentes', reportData?.urgentTickets, 'tickets'],
        ['Ingresos Totales', `$${reportData?.totalRevenue}`, 'USD'],
        ['Ingresos Mensuales', `$${reportData?.monthlyRevenue}`, 'USD'],
        ['Valor Promedio Proyecto', `$${reportData?.averageProjectValue}`, 'USD']
      ].map(row => row.join(',')).join('\n');

      // Descargar CSV
      const blob = new Blob([csvData], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `metricas_dashboard_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Datos exportados exitosamente",
        description: "Los datos se han exportado a CSV.",
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Error al exportar",
        description: "Hubo un problema al exportar los datos.",
        variant: "destructive"
      });
    } finally {
      setGenerating(false);
    }
  };

  // Crear nuevo template
  const createNewTemplate = () => {
    const newTemplate: ReportTemplate = {
      id: Date.now().toString(),
      name: 'Nuevo Reporte',
      description: 'Descripción del nuevo reporte',
      type: 'custom',
      lastGenerated: null,
      status: 'active',
      recipients: [],
      schedule: '09:00'
    };
    setReportTemplates([...reportTemplates, newTemplate]);
    setSelectedTemplate(newTemplate);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Sistema de Reportes</h2>
          <p className="text-zinc-400">
            Generación automática de reportes, envío por email y exportación de datos
          </p>
        </div>
        <Button onClick={createNewTemplate} className="bg-blue-600 hover:bg-blue-700">
          <FileText className="h-4 w-4 mr-2" />
          Nuevo Reporte
        </Button>
      </div>

      {/* Tabs principales */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-zinc-800">
          <TabsTrigger value="templates" className="data-[state=active]:bg-zinc-700">
            <FileText className="h-4 w-4 mr-2" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="generation" className="data-[state=active]:bg-zinc-700">
            <BarChart3 className="h-4 w-4 mr-2" />
            Generación
          </TabsTrigger>
          <TabsTrigger value="export" className="data-[state=active]:bg-zinc-700">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </TabsTrigger>
        </TabsList>

        {/* Tab de Templates */}
        <TabsContent value="templates" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reportTemplates.map((template) => (
              <Card 
                key={template.id} 
                className={`bg-zinc-800 border-zinc-700 cursor-pointer transition-all hover:border-zinc-500 ${
                  selectedTemplate?.id === template.id ? 'border-blue-500 ring-2 ring-blue-500/20' : ''
                }`}
                onClick={() => setSelectedTemplate(template)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white text-lg">{template.name}</CardTitle>
                    <Badge variant={template.status === 'active' ? 'default' : 'secondary'}>
                      {template.status === 'active' ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </div>
                  <p className="text-zinc-400 text-sm">{template.description}</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center text-zinc-300">
                      <Calendar className="h-4 w-4 mr-2" />
                      {template.schedule}
                    </div>
                    <div className="flex items-center text-zinc-300">
                      <Mail className="h-4 w-4 mr-2" />
                      {template.recipients.length} destinatarios
                    </div>
                    {template.lastGenerated && (
                      <div className="flex items-center text-zinc-300">
                        <Clock className="h-4 w-4 mr-2" />
                        Último: {template.lastGenerated.toLocaleDateString('es-ES')}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Tab de Generación */}
        <TabsContent value="generation" className="space-y-6">
          {selectedTemplate ? (
            <div className="space-y-4">
              <Card className="bg-zinc-800 border-zinc-700">
                <CardHeader>
                  <CardTitle className="text-white">Generar Reporte: {selectedTemplate.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button 
                      onClick={() => generatePDFReport(selectedTemplate)}
                      disabled={generating}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      {generating ? 'Generando...' : 'Generar PDF'}
                    </Button>
                    <Button 
                      onClick={() => sendReportByEmail(selectedTemplate)}
                      disabled={generating}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      {generating ? 'Enviando...' : 'Enviar por Email'}
                    </Button>
                  </div>
                  
                  <div className="pt-4 border-t border-zinc-700">
                    <h4 className="text-white font-medium mb-2">Destinatarios:</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedTemplate.recipients.map((email, index) => (
                        <Badge key={index} variant="outline" className="text-zinc-300">
                          {email}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-zinc-400 mx-auto mb-4" />
              <p className="text-zinc-400">Selecciona un template de reporte para generar</p>
            </div>
          )}
        </TabsContent>

        {/* Tab de Exportación */}
        <TabsContent value="export" className="space-y-6">
          <Card className="bg-zinc-800 border-zinc-700">
            <CardHeader>
              <CardTitle className="text-white">Exportar Datos del Dashboard</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button 
                  onClick={exportToExcel}
                  disabled={generating}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {generating ? 'Exportando...' : 'Exportar a CSV'}
                </Button>
                <Button 
                  variant="outline"
                  className="border-zinc-600 text-zinc-300 hover:bg-zinc-700"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Exportar a Excel
                </Button>
                <Button 
                  variant="outline"
                  className="border-zinc-600 text-zinc-300 hover:bg-zinc-700"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Exportar a JSON
                </Button>
              </div>
              
              <div className="pt-4 border-t border-zinc-700">
                <h4 className="text-white font-medium mb-2">Datos disponibles para exportar:</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                  <div className="text-zinc-300">• Usuarios</div>
                  <div className="text-zinc-300">• Proyectos</div>
                  <div className="text-zinc-300">• Tickets</div>
                  <div className="text-zinc-300">• Ingresos</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 
