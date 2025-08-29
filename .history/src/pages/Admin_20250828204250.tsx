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
  Zap,
  UserCog,
  Cog
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { notificationService } from '@/lib/notificationService';
import { ProjectsManagement } from '@/components/admin/ProjectsManagement';
import NotificationsManager from '@/components/admin/NotificationsManager';
import NotificationBell from '@/components/admin/NotificationBell';
import ExecutiveCharts from '@/components/admin/ExecutiveCharts';
import AutomationSystem from '@/components/admin/AutomationSystem';
import AdvancedTicketManager from '@/components/AdvancedTicketManager';
import AutoVersionCreator from '@/components/admin/AutoVersionCreator';
import AdvancedTools from '@/components/admin/AdvancedTools';
import { VersionManagement } from '@/components/admin/VersionManagement';
import SecurityAudit from '@/components/admin/SecurityAudit';


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
      await notificationService.createNotification({
        title: 'Rol de Usuario Actualizado',
        message: `El rol del usuario ha sido cambiado a ${newRole}`,
        type: 'info',
        user_id: userId,
        category: 'user'
      });

      // Recargar datos
      await loadData();
      
      toast({ title: 'Éxito', description: 'Rol de usuario actualizado correctamente.' });
    } catch (error) {
      console.error('Error updating user role:', error);
      toast({ title: 'Error', description: 'No se pudo actualizar el rol del usuario.', variant: 'destructive' });
    }
  };

  const updateProjectStatus = async (projectId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('projects')
        .update({ status: newStatus })
        .eq('id', projectId);
      
      if (error) throw error;
      
      // Crear notificación automática
      await notificationService.createNotification({
        title: 'Estado de Proyecto Actualizado',
        message: `El proyecto ha sido marcado como ${newStatus}`,
        type: 'info',
        user_id: user.id,
        category: 'project'
      });

      // Recargar datos
      await loadData();
      
      toast({ title: 'Éxito', description: 'Estado del proyecto actualizado correctamente.' });
    } catch (error) {
      console.error('Error updating project status:', error);
      toast({ title: 'Error', description: 'No se pudo actualizar el estado del proyecto.', variant: 'destructive' });
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
      await notificationService.createNotification({
        title: 'Estado de Ticket Actualizado',
        message: `El ticket ha sido marcado como ${newStatus}`,
        type: 'info',
        user_id: user.id,
        category: 'ticket'
      });

      // Recargar datos
      await loadData();
      
      toast({ title: 'Éxito', description: 'Estado del ticket actualizado correctamente.' });
    } catch (error) {
      console.error('Error updating ticket status:', error);
      toast({ title: 'Error', description: 'No se pudo actualizar el estado del ticket.', variant: 'destructive' });
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
      await notificationService.createNotification({
        title: 'Estado de Pago Actualizado',
        message: `El pago ha sido marcado como ${newStatus}`,
        type: 'info',
        user_id: user.id,
        category: 'payment'
      });

      // Recargar datos
      await loadData();
      
      toast({ title: 'Éxito', description: 'Estado del pago actualizado correctamente.' });
    } catch (error) {
      console.error('Error updating payment status:', error);
      toast({ title: 'Error', description: 'No se pudo actualizar el estado del pago.', variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <div className="h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 text-lg">Cargando panel de administración...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 flex flex-col">
      {/* Header del Admin */}
      <div className="flex-shrink-0 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Panel de Administración</h1>
            <p className="text-slate-600 mt-2">Gestiona usuarios, proyectos, tickets y pagos</p>
            <p className="text-sm text-slate-500 mt-1">Última actualización: {lastUpdate.toLocaleTimeString()}</p>
          </div>
          <div className="flex items-center gap-4">
            <NotificationBell />
            <Button onClick={loadData} className="bg-blue-600 hover:bg-blue-700">
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
          </div>
        </div>
      </div>

      {/* Contenido Principal con Layout Responsivo */}
      <div className="flex-1 flex flex-col min-h-0 px-8 pb-6">
        
        {/* Cards de Estadísticas Principales */}
        <div className="flex-shrink-0 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-6">
          
          {/* Card Usuarios */}
          <div className="relative group cursor-pointer">
            <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-slate-200/50 backdrop-blur-sm overflow-hidden bg-gradient-to-br from-blue-50 via-blue-25 to-indigo-50">
              <div className="flex items-center justify-center w-14 h-14 rounded-2xl mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300 bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                <Users size={28} />
              </div>
              <div className="text-4xl font-bold text-slate-800 mb-2 group-hover:scale-105 transition-transform duration-300">
                {usuariosActivos}
              </div>
              <div className="text-lg font-semibold text-slate-600 mb-1">
                Usuarios Activos
              </div>
              <div className="text-sm text-slate-500 flex items-center space-x-1">
                <span className="text-green-600 font-semibold">+{usuariosNuevos}</span>
                <span>este mes ({crecimientoUsuarios}%)</span>
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-all duration-1000"></div>
            </div>
          </div>

          {/* Card Proyectos */}
          <div className="relative group cursor-pointer">
            <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-slate-200/50 backdrop-blur-sm overflow-hidden bg-gradient-to-br from-emerald-50 via-emerald-25 to-teal-50">
              <div className="flex items-center justify-center w-14 h-14 rounded-2xl mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
                <FolderOpen size={28} />
              </div>
              <div className="text-4xl font-bold text-slate-800 mb-2 group-hover:scale-105 transition-transform duration-300">
                {proyectosEnCurso}
              </div>
              <div className="text-lg font-semibold text-slate-600 mb-1">
                Proyectos en Curso
              </div>
              <div className="text-sm text-slate-500 flex items-center space-x-1">
                <span className="text-blue-600 font-semibold">{proyectosEnDesarrollo}</span>
                <span>desarrollo, </span>
                <span className="text-yellow-600 font-semibold">{proyectosPendientes}</span>
                <span>pendientes</span>
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-all duration-1000"></div>
            </div>
          </div>

          {/* Card Tickets */}
          <div className="relative group cursor-pointer">
            <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-slate-200/50 backdrop-blur-sm overflow-hidden bg-gradient-to-br from-amber-50 via-amber-25 to-orange-50">
              <div className="flex items-center justify-center w-14 h-14 rounded-2xl mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300 bg-gradient-to-br from-amber-500 to-amber-600 text-white">
                <Ticket size={28} />
              </div>
              <div className="text-4xl font-bold text-slate-800 mb-2 group-hover:scale-105 transition-transform duration-300">
                {ticketsAbiertos}
              </div>
              <div className="text-lg font-semibold text-slate-600 mb-1">
                Tickets Abiertos
              </div>
              <div className="text-sm text-slate-500 flex items-center space-x-1">
                <span className="text-red-600 font-semibold">{ticketsUrgentes}</span>
                <span>urgentes, </span>
                <span className="text-blue-600 font-semibold">{ticketsEnProgreso}</span>
                <span>en progreso</span>
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-all duration-1000"></div>
            </div>
          </div>

          {/* Card Ingresos */}
          <div className="relative group cursor-pointer">
            <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-slate-200/50 backdrop-blur-sm overflow-hidden bg-gradient-to-br from-violet-50 via-violet-25 to-purple-50">
              <div className="flex items-center justify-center w-14 h-14 rounded-2xl mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300 bg-gradient-to-br from-violet-500 to-violet-600 text-white">
                <DollarSign size={28} />
              </div>
              <div className="text-4xl font-bold text-slate-800 mb-2 group-hover:scale-105 transition-transform duration-300">
                ${ingresosTotales.toLocaleString()}
              </div>
              <div className="text-lg font-semibold text-slate-600 mb-1">
                Ingresos Totales
              </div>
              <div className="text-sm text-slate-500 flex items-center space-x-1">
                <span className="text-green-600 font-semibold">${ingresosEsteMes.toLocaleString()}</span>
                <span>este mes</span>
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-all duration-1000"></div>
            </div>
          </div>
        </div>

        {/* Contenido Principal con Layout Adaptativo */}
        <div className="flex-1 min-h-0">
          
          {activeSection === 'dashboard' && (
            <div className="h-full grid grid-cols-1 xl:grid-cols-2 gap-8">
              
              {/* Card Estadísticas Rápidas */}
              <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-200/50 flex flex-col">
                <div className="flex-shrink-0">
                  <div className="text-2xl font-bold text-slate-800 mb-2 flex items-center space-x-3">
                    <TrendingUp size={24} className="text-blue-600" />
                    <span>Estadísticas Rápidas</span>
                  </div>
                  <p className="text-slate-500 text-base mb-8">
                    Vista general de la actividad del sistema
                  </p>
                </div>
                <div className="flex-1 space-y-4 overflow-y-auto">
                  <div className="flex items-center justify-between py-4 border-b border-slate-100 last:border-b-0 group hover:bg-slate-50 rounded-lg transition-all duration-200 px-4">
                    <span className="text-slate-600 font-medium flex items-center space-x-3">
                      <Users size={16} className="text-blue-500" />
                      <span>Usuarios totales:</span>
                    </span>
                    <Badge className="px-5 py-3 rounded-2xl text-base font-bold transition-all duration-200 bg-blue-500 text-white shadow-lg group-hover:bg-blue-600 group-hover:scale-105">
                      {usuariosActivos}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between py-4 border-b border-slate-100 last:border-b-0 group hover:bg-slate-50 rounded-lg transition-all duration-200 px-4">
                    <span className="text-slate-600 font-medium flex items-center space-x-3">
                      <Users size={16} className="text-green-500" />
                      <span>Nuevos este mes:</span>
                    </span>
                    <Badge className="px-5 py-3 rounded-2xl text-base font-bold transition-all duration-200 bg-emerald-500 text-white shadow-lg group-hover:bg-emerald-600 group-hover:scale-105">
                      +{usuariosNuevos}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between py-4 border-b border-slate-100 last:border-b-0 group hover:bg-slate-50 rounded-lg transition-all duration-200 px-4">
                    <span className="text-slate-600 font-medium flex items-center space-x-3">
                      <FolderOpen size={16} className="text-emerald-500" />
                      <span>Proyectos activos:</span>
                    </span>
                    <Badge className="px-5 py-3 rounded-2xl text-base font-bold transition-all duration-200 bg-emerald-500 text-white shadow-lg group-hover:bg-emerald-600 group-hover:scale-105">
                      {proyectosEnCurso}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between py-4 border-b border-slate-100 last:border-b-0 group hover:bg-slate-50 rounded-lg transition-all duration-200 px-4">
                    <span className="text-slate-600 font-medium flex items-center space-x-3">
                      <CheckCircle size={16} className="text-green-500" />
                      <span>Tasa éxito:</span>
                    </span>
                    <Badge className="px-5 py-3 rounded-2xl text-base font-bold transition-all duration-200 bg-green-500 text-white shadow-lg group-hover:bg-green-600 group-hover:scale-105">
                      {tasaCompletacionProyectos}%
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between py-4 border-b border-slate-100 last:border-b-0 group hover:bg-slate-50 rounded-lg transition-all duration-200 px-4">
                    <span className="text-slate-600 font-medium flex items-center space-x-3">
                      <Ticket size={16} className="text-amber-500" />
                      <span>Tickets abiertos:</span>
                    </span>
                    <Badge className="px-5 py-3 rounded-2xl text-base font-bold transition-all duration-200 bg-amber-500 text-white shadow-lg group-hover:bg-amber-600 group-hover:scale-105">
                      {ticketsAbiertos}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between py-4 border-b border-slate-100 last:border-b-0 group hover:bg-slate-50 rounded-lg transition-all duration-200 px-4">
                    <span className="text-slate-600 font-medium flex items-center space-x-3">
                      <AlertCircle size={16} className="text-red-500" />
                      <span>Urgentes:</span>
                    </span>
                    <Badge className="px-5 py-3 rounded-2xl text-base font-bold transition-all duration-200 bg-red-500 text-white shadow-lg group-hover:bg-red-600 group-hover:scale-105">
                      {ticketsUrgentes}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between py-4 border-b border-slate-100 last:border-b-0 group hover:bg-slate-50 rounded-lg transition-all duration-200 px-4">
                    <span className="text-slate-600 font-medium flex items-center space-x-3">
                      <DollarSign size={16} className="text-violet-500" />
                      <span>Ingresos totales:</span>
                    </span>
                    <Badge className="px-5 py-3 rounded-2xl text-base font-bold transition-all duration-200 bg-violet-500 text-white shadow-lg group-hover:bg-violet-600 group-hover:scale-105">
                      ${ingresosTotales.toLocaleString()}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between py-4 border-b border-slate-100 last:border-b-0 group hover:bg-slate-50 rounded-lg transition-all duration-200 px-4">
                    <span className="text-slate-600 font-medium flex items-center space-x-3">
                      <Calendar size={16} className="text-blue-500" />
                      <span>Este mes:</span>
                    </span>
                    <Badge className="px-5 py-3 rounded-2xl text-base font-bold transition-all duration-200 bg-blue-500 text-white shadow-lg group-hover:bg-blue-600 group-hover:scale-105">
                      ${ingresosEsteMes.toLocaleString()}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Card Acciones Rápidas */}
              <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-200/50 flex flex-col">
                <div className="flex-shrink-0">
                  <div className="text-2xl font-bold text-slate-800 mb-2 flex items-center space-x-3">
                    <Zap size={24} className="text-yellow-600" />
                    <span>Acciones Rápidas</span>
                  </div>
                  <p className="text-slate-500 text-base mb-8">
                    Acceso directo a las funciones principales
                  </p>
                </div>
                <div className="flex-1 space-y-4">
                  <Button 
                    onClick={() => setActiveSection('usuarios')} 
                    className="w-full justify-start h-14 text-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 hover:border-slate-300 transition-all duration-200"
                  >
                    <Users size={20} className="mr-3 text-blue-600" />
                    Gestionar Usuarios
                  </Button>
                  <Button 
                    onClick={() => setActiveSection('proyectos')} 
                    className="w-full justify-start h-14 text-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 hover:border-slate-300 transition-all duration-200"
                  >
                    <FolderOpen size={20} className="mr-3 text-emerald-600" />
                    Ver Proyectos
                  </Button>
                  <Button 
                    onClick={() => setActiveSection('tickets')} 
                    className="w-full justify-start h-14 text-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 hover:border-slate-300 transition-all duration-200"
                  >
                    <Ticket size={20} className="mr-3 text-amber-600" />
                    Revisar Tickets
                  </Button>
                  <Button 
                    onClick={() => setActiveSection('pagos')} 
                    className="w-full justify-start h-14 text-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 hover:border-slate-300 transition-all duration-200"
                  >
                    <CreditCard size={20} className="mr-3 text-violet-600" />
                    Gestionar Pagos
                  </Button>
                  <Button 
                    onClick={() => setActiveSection('analytics')} 
                    className="w-full justify-start h-14 text-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 hover:border-slate-300 transition-all duration-200"
                  >
                    <BarChart3 size={20} className="mr-3 text-indigo-600" />
                    Analytics Avanzado
                  </Button>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'usuarios' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-200/50">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800">Gestión de Usuarios</h2>
                    <p className="text-slate-600">Administra usuarios del sistema</p>
                  </div>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo Usuario
                  </Button>
                </div>
                
                <div className="space-y-4">
                  {usuarios.map((usuario) => (
                    <div key={usuario.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Users className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">{usuario.email}</p>
                          <p className="text-sm text-slate-600">Rol: {usuario.role}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateUserRole(usuario.id, usuario.role === 'admin' ? 'user' : 'admin')}
                          className="border-slate-200 text-slate-700 hover:bg-slate-100"
                        >
                          Cambiar Rol
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeSection === 'proyectos' && (
            <ProjectsManagement />
          )}

          {activeSection === 'tickets' && (
            <AdvancedTicketManager />
          )}

          {activeSection === 'pagos' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-200/50">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800">Gestión de Pagos</h2>
                    <p className="text-slate-600">Administra pagos y facturación</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  {pagos.map((pago) => (
                    <div key={pago.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <CreditCard className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">${pago.amount}</p>
                          <p className="text-sm text-slate-600">Estado: {pago.status}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updatePaymentStatus(pago.id, pago.status === 'pending' ? 'completed' : 'pending')}
                          className="border-slate-200 text-slate-700 hover:bg-slate-100"
                        >
                          Cambiar Estado
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeSection === 'analytics' && (
            <ExecutiveCharts 
              refreshData={loadData}
              lastUpdate={lastUpdate}
            />
          )}

          {activeSection === 'automation' && (
            <AutomationSystem />
          )}

          {activeSection === 'auto-version' && (
            <AutoVersionCreator />
          )}

          {activeSection === 'advanced-tools' && (
            <AdvancedTools />
          )}

          {activeSection === 'version-management' && (
            <VersionManagement projectId="default" />
          )}

          {activeSection === 'security-audit' && (
            <SecurityAudit />
          )}

          {activeSection === 'notifications' && (
            <NotificationsManager />
          )}

          {activeSection === 'settings' && (
            <Card className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-200/50">
              <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-t-2xl">
                <CardTitle className="text-2xl font-bold text-slate-800 flex items-center space-x-3">
                  <Cog size={24} className="text-slate-600" />
                  <span>Configuración del Sistema</span>
                </CardTitle>
                <CardDescription className="text-slate-600 text-base">
                  Configura los parámetros generales del sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  <div className="bg-slate-50 p-6 rounded-xl">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">Configuración General</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="text-slate-700 font-medium">Nombre del Sistema</label>
                        <Input 
                          defaultValue="TuWebAI Dashboard" 
                          className="mt-2 bg-white border-slate-300 text-slate-800"
                        />
                      </div>
                      <div>
                        <label className="text-slate-700 font-medium">Zona Horaria</label>
                        <Select defaultValue="utc">
                          <SelectTrigger className="mt-2 bg-white border-slate-300 text-slate-800">
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
                        <label className="text-slate-700 font-medium">Idioma</label>
                        <Select defaultValue="es">
                          <SelectTrigger className="mt-2 bg-white border-slate-300 text-slate-800">
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
                    <Button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                      Guardar Configuración
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
} 
