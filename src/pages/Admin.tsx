import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { useTranslation } from 'react-i18next';
import { toast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { 
  Users, 
  FolderOpen, 
  Ticket, 
  CreditCard, 
  TrendingUp, 
  BarChart3, 
  Settings,
  Plus,
  Search,
  Filter,
  Calendar,
  DollarSign,
  CheckCircle,
  Clock,
  AlertCircle,
  Edit,
  Trash2,
  Eye,
  RefreshCw,
  FileText,
  BarChart,
  Zap
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { notificationService } from '@/lib/notificationService';
import { ProjectsManagement } from '@/components/admin/ProjectsManagement';
import NotificationsManager from '@/components/admin/NotificationsManager';
import NotificationBell from '@/components/admin/NotificationBell';
import ExecutiveCharts from '@/components/admin/ExecutiveCharts';
import AutomationSystem from '@/components/admin/AutomationSystem';
import AdvancedTicketManager from '@/components/AdvancedTicketManager';


export default function Admin() {
  const { t } = useTranslation();
  const { user } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [activeSection, setActiveSection] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [proyectos, setProyectos] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [pagos, setPagos] = useState<any[]>([]);
  const [comentario, setComentario] = useState('');
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());


  // Cargar datos desde Supabase
  const loadData = async () => {
    try {
      setLoading(true);
      
      // Cargar usuarios con información adicional
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (usersError) throw usersError;
      setUsuarios(usersData || []);

      // Cargar proyectos con información detallada
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (projectsError) throw projectsError;
      setProyectos(projectsData || []);

      // Cargar tickets con prioridades
      const { data: ticketsData, error: ticketsError } = await supabase
        .from('tickets')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (ticketsError) throw ticketsError;
      setTickets(ticketsData || []);

      // Cargar pagos con información financiera
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (paymentsError) throw paymentsError;
      setPagos(paymentsData || []);

    } catch (error) {
      console.error('Error loading admin data:', error);
      toast({ title: 'Error', description: 'No se pudieron cargar los datos.', variant: 'destructive' });
    } finally {
      setLoading(false);
      setLastUpdate(new Date());
      
      // Crear notificación del sistema sobre la carga de datos
      try {
        if (user.role === 'admin') {
          await notificationService.createSystemNotification(
            'Datos del Sistema Cargados',
            `Se han cargado ${usuarios.length} usuarios, ${proyectos.length} proyectos, ${tickets.length} tickets y ${pagos.length} pagos.`,
            'info',
            'system',
            false
          );
        }
      } catch (notificationError) {
        console.error('Error creating system notification:', notificationError);
      }
    }
  };

  // Función para actualizar datos en tiempo real
  const refreshData = async () => {
    await loadData();
    setLastUpdate(new Date());
    toast({ title: 'Actualizado', description: 'Datos actualizados correctamente.' });
  };

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/dashboard');
      return;
    }

    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      setActiveSection(hash || 'dashboard');
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);

    loadData();
    
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [user, navigate]);



  // MÉTRICAS AVANZADAS
  const usuariosActivos = usuarios.length;
  const usuariosNuevos = usuarios.filter(u => {
    const userDate = new Date(u.created_at);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return userDate >= thirtyDaysAgo;
  }).length;
  
  const proyectosEnCurso = proyectos.filter(p => p.status !== 'completed').length;
  const proyectosCompletados = proyectos.filter(p => p.status === 'completed').length;
  const proyectosPendientes = proyectos.filter(p => p.status === 'pending').length;
  const proyectosEnDesarrollo = proyectos.filter(p => p.status === 'development').length;
  
  const ingresosTotales = pagos.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
  const ingresosEsteMes = pagos.filter(p => {
    const paymentDate = new Date(p.created_at);
    const currentMonth = new Date();
    return paymentDate.getMonth() === currentMonth.getMonth() && 
           paymentDate.getFullYear() === currentMonth.getFullYear();
  }).reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
  
  const ticketsAbiertos = tickets.filter(t => t.status !== 'closed').length;
  const ticketsCerrados = tickets.filter(t => t.status === 'closed').length;
  const ticketsUrgentes = tickets.filter(t => t.priority === 'high' && t.status !== 'closed').length;
  const ticketsEnProgreso = tickets.filter(t => t.status === 'in_progress').length;
  
  // Cálculo de tasas y porcentajes
  const tasaCompletacionProyectos = proyectos.length > 0 ? Math.round((proyectosCompletados / proyectos.length) * 100) : 0;
  const tasaResolucionTickets = tickets.length > 0 ? Math.round((ticketsCerrados / tickets.length) * 100) : 0;
  const crecimientoUsuarios = usuarios.length > 0 ? Math.round((usuariosNuevos / usuarios.length) * 100) : 0;

  // Funciones de gestión
  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', userId);
      
      if (error) throw error;
      
      // Crear notificación automática
      try {
        const user = usuarios.find(u => u.id === userId);
        if (user) {
          await notificationService.createNotification({
            user_id: userId,
            title: 'Rol Actualizado',
            message: `Tu rol ha sido cambiado a: ${newRole}`,
            type: 'info',
            category: 'user',
            action_url: '/admin/usuarios'
          });
        }
      } catch (notificationError) {
        console.error('Error creating notification:', notificationError);
      }
      
      toast({ title: 'Éxito', description: 'Rol de usuario actualizado.' });
      loadData(); // Recargar datos
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo actualizar el rol.', variant: 'destructive' });
    }
  };

  const updateTicketStatus = async (ticketId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ status: newStatus })
        .eq('id', ticketId);
      
      if (error) throw error;
      
      // Crear notificación automática
      try {
        const ticket = tickets.find(t => t.id === ticketId);
        if (ticket) {
          const isUrgent = ticket.priority === 'high';
          await notificationService.createNotification({
            user_id: ticket.user_id || ticket.owner_id || user.id,
            title: `Ticket ${newStatus}`,
            message: `El ticket "${ticket.title || 'Sin título'}" ha sido marcado como ${newStatus}`,
            type: newStatus === 'closed' ? 'success' : 'info',
            category: 'ticket',
            is_urgent: isUrgent,
            action_url: '/admin/tickets'
          });
        }
      } catch (notificationError) {
        console.error('Error creating notification:', notificationError);
      }
      
      toast({ title: 'Éxito', description: 'Estado del ticket actualizado.' });
      loadData(); // Recargar datos
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo actualizar el ticket.', variant: 'destructive' });
    }
  };

  const updatePaymentStatus = async (paymentId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('payments')
        .update({ status: newStatus })
        .eq('id', paymentId);
      
      if (error) throw error;
      
      // Crear notificación automática
      try {
        const payment = pagos.find(p => p.id === paymentId);
        if (payment) {
          await notificationService.createNotification({
            user_id: payment.user_id || payment.owner_id || user.id,
            title: `Pago ${newStatus}`,
            message: `El pago de $${payment.amount || 0} ha sido marcado como ${newStatus}`,
            type: newStatus === 'completed' ? 'success' : newStatus === 'failed' ? 'error' : 'info',
            category: 'payment',
            action_url: '/admin/pagos'
          });
        }
      } catch (notificationError) {
        console.error('Error creating notification:', notificationError);
      }
      
      toast({ title: 'Éxito', description: 'Estado del pago actualizado.' });
      loadData(); // Recargar datos
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo actualizar el pago.', variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          <p className="mt-4 text-white">Cargando panel de administración...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Panel de Administración</h1>
          <p className="text-gray-400">Gestiona usuarios, proyectos, tickets y pagos</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="text-right">
            <div className="text-xs text-gray-400">
              Última actualización: {lastUpdate.toLocaleTimeString()}
            </div>
          </div>
          <NotificationBell />
          <Button
            onClick={refreshData}
            variant="outline"
            size="sm"
            className="border-zinc-600 text-zinc-300 hover:bg-zinc-800"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
          <Badge variant="secondary" className="text-sm">
            Admin
          </Badge>
        </div>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-zinc-800 border-zinc-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Usuarios Activos</CardTitle>
            <Users className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{usuariosActivos}</div>
            <div className="flex items-center space-x-2 mt-1">
              <span className="text-xs text-green-400">+{usuariosNuevos} este mes</span>
              <span className="text-xs text-gray-400">({crecimientoUsuarios}%)</span>
            </div>
            <p className="text-xs text-gray-400">Total de usuarios registrados</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-800 border-zinc-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Proyectos en Curso</CardTitle>
            <FolderOpen className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{proyectosEnCurso}</div>
            <div className="flex items-center space-x-2 mt-1">
              <span className="text-xs text-blue-400">{proyectosEnDesarrollo} desarrollo</span>
              <span className="text-xs text-yellow-400">{proyectosPendientes} pendientes</span>
            </div>
            <p className="text-xs text-gray-400">Tasa: {tasaCompletacionProyectos}% completados</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-800 border-zinc-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Tickets Abiertos</CardTitle>
            <Ticket className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{ticketsAbiertos}</div>
            <div className="flex items-center space-x-2 mt-1">
              <span className="text-xs text-red-400">{ticketsUrgentes} urgentes</span>
              <span className="text-xs text-blue-400">{ticketsEnProgreso} en progreso</span>
            </div>
            <p className="text-xs text-gray-400">Tasa: {tasaResolucionTickets}% resueltos</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-800 border-zinc-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Ingresos Totales</CardTitle>
            <DollarSign className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">${ingresosTotales.toLocaleString()}</div>
            <div className="flex items-center space-x-2 mt-1">
              <span className="text-xs text-green-400">${ingresosEsteMes.toLocaleString()} este mes</span>
            </div>
            <p className="text-xs text-gray-400">Total de pagos</p>
          </CardContent>
        </Card>
      </div>

      {/* Contenido principal */}
      <div className="space-y-6">

        {activeSection === 'dashboard' && (
          <div className="grid grid-cols-1 gap-6">
            <div>
              <Card className="bg-zinc-800 border-zinc-700">
                <CardHeader>
                  <CardTitle className="text-white">Resumen General</CardTitle>
                  <CardDescription className="text-gray-400">
                    Vista general de la actividad del sistema
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-4">Estadísticas Rápidas</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300">Usuarios totales:</span>
                          <Badge variant="secondary">{usuariosActivos}</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300">Nuevos este mes:</span>
                          <Badge variant="default">+{usuariosNuevos}</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300">Proyectos activos:</span>
                          <Badge variant="secondary">{proyectosEnCurso}</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300">Tasa éxito:</span>
                          <Badge variant="outline">{tasaCompletacionProyectos}%</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300">Tickets abiertos:</span>
                          <Badge variant="destructive">{ticketsAbiertos}</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300">Urgentes:</span>
                          <Badge variant="destructive">{ticketsUrgentes}</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300">Ingresos totales:</span>
                          <Badge variant="secondary">${ingresosTotales.toLocaleString()}</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300">Este mes:</span>
                          <Badge variant="default">${ingresosEsteMes.toLocaleString()}</Badge>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-4">Acciones Rápidas</h3>
                      <div className="space-y-3">
                        <Button 
                          variant="outline" 
                          className="w-full justify-start"
                          onClick={() => {
                            setActiveSection('usuarios');
                            window.location.hash = 'usuarios';
                          }}
                        >
                          <Users className="h-4 w-4 mr-2" />
                          Gestionar Usuarios
                        </Button>
                        <Button 
                          variant="outline" 
                          className="w-full justify-start"
                          onClick={() => {
                            setActiveSection('proyectos');
                            window.location.hash = 'proyectos';
                          }}
                        >
                          <FolderOpen className="h-4 w-4 mr-2" />
                          Ver Proyectos
                        </Button>
                        <Button 
                          variant="outline" 
                          className="w-full justify-start"
                          onClick={() => {
                            setActiveSection('tickets');
                            window.location.hash = 'tickets';
                          }}
                        >
                          <Ticket className="h-4 w-4 mr-2" />
                          Revisar Tickets
                        </Button>
                        <Button 
                          variant="outline" 
                          className="w-full justify-start"
                          onClick={() => {
                            setActiveSection('pagos');
                            window.location.hash = 'pagos';
                          }}
                        >
                          <CreditCard className="h-4 w-4 mr-2" />
                          Gestionar Pagos
                        </Button>
                        <Button 
                          variant="outline" 
                          className="w-full justify-start"
                          onClick={() => {
                            setActiveSection('advanced-analytics');
                            window.location.hash = 'advanced-analytics';
                          }}
                        >
                          <BarChart className="h-4 w-4 mr-2" />
                          Analytics Avanzado
                        </Button>

                        <Button 
                          variant="outline" 
                          className="w-full justify-start"
                          onClick={() => {
                            setActiveSection('automation');
                            window.location.hash = 'automation';
                          }}
                        >
                          <Zap className="h-4 w-4 mr-2" />
                          Sistema de Automatización
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeSection === 'usuarios' && (
          <Card className="bg-zinc-800 border-zinc-700">
            <CardHeader>
              <CardTitle className="text-white">Gestión de Usuarios</CardTitle>
              <CardDescription className="text-gray-400">
                Administra los usuarios del sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {usuarios.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-400">No hay usuarios registrados</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {usuarios.map((usuario) => (
                      <div key={usuario.id} className="flex items-center justify-between p-4 bg-zinc-700 rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="h-10 w-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                            {usuario.full_name?.charAt(0) || usuario.email?.charAt(0)}
                          </div>
                          <div>
                            <p className="text-white font-medium">{usuario.full_name || 'Sin nombre'}</p>
                            <p className="text-gray-400 text-sm">{usuario.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={usuario.role === 'admin' ? 'destructive' : 'secondary'}>
                            {usuario.role}
                          </Badge>
                          <Select
                            value={usuario.role}
                            onValueChange={(value) => updateUserRole(usuario.id, value)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="user">Usuario</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {activeSection === 'proyectos' && (
          <ProjectsManagement />
        )}

        {activeSection === 'tickets' && (
          <AdvancedTicketManager 
            tickets={tickets}
            updateTicketStatus={updateTicketStatus}
            updateUserRole={updateUserRole}
            refreshData={loadData}
            lastUpdate={lastUpdate}
          />
        )}

        {activeSection === 'pagos' && (
          <Card className="bg-zinc-800 border-zinc-700">
            <CardHeader>
              <CardTitle className="text-white">Gestión de Pagos</CardTitle>
              <CardDescription className="text-gray-400">
                Administra los pagos del sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pagos.length === 0 ? (
                  <div className="text-center py-8">
                    <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-400">No hay pagos registrados</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pagos.map((pago) => (
                      <div key={pago.id} className="flex items-center justify-between p-4 bg-zinc-700 rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="h-10 w-10 bg-gradient-to-br from-green-600 to-emerald-600 rounded-full flex items-center justify-center text-white">
                            <DollarSign className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-white font-medium">${pago.amount || 0}</p>
                            <p className="text-gray-400 text-sm">{pago.description || 'Sin descripción'}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={pago.status === 'completed' ? 'default' : 'secondary'}>
                            {pago.status || 'pending'}
                          </Badge>
                          <Select
                            value={pago.status || 'pending'}
                            onValueChange={(value) => updatePaymentStatus(pago.id, value)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pendiente</SelectItem>
                              <SelectItem value="completed">Completado</SelectItem>
                              <SelectItem value="failed">Fallido</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {activeSection === 'advanced-analytics' && (
          <ExecutiveCharts 
            refreshData={loadData}
            lastUpdate={lastUpdate}
          />
        )}

        {activeSection === 'automation' && (
          <AutomationSystem />
        )}

        {activeSection === 'notifications' && (
          <NotificationsManager />
        )}

        {activeSection === 'settings' && (
          <Card className="bg-zinc-800 border-zinc-700">
            <CardHeader>
              <CardTitle className="text-white">Configuración del Sistema</CardTitle>
              <CardDescription className="text-gray-400">
                Configura los parámetros generales del sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="bg-zinc-700 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-white mb-4">Configuración General</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-white font-medium">Nombre del Sistema</label>
                      <Input 
                        defaultValue="TuWebAI Dashboard" 
                        className="mt-2 bg-zinc-600 border-zinc-500 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-white font-medium">Zona Horaria</label>
                      <Select defaultValue="utc">
                        <SelectTrigger className="mt-2 bg-zinc-600 border-zinc-500 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="utc">UTC</SelectItem>
                          <SelectItem value="est">EST</SelectItem>
                          <SelectItem value="pst">PST</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-white font-medium">Idioma</label>
                      <Select defaultValue="es">
                        <SelectTrigger className="mt-2 bg-zinc-600 border-zinc-500 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="es">Español</SelectItem>
                          <SelectItem value="en">English</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    Guardar Configuración
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>


    </div>
  );
} 
