import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { 
  Home, 
  FolderKanban, 
  CreditCard, 
  HelpCircle, 
  Settings, 
  BarChart3, 
  Users, 
  Ticket, 
  LogOut, 
  User,
  Bell,
  Activity,
  Database,
  HardDrive,
  Cpu,
  Shield,
  TrendingUp,
  FileText,
  Zap,
  Code,
  BarChart,
  Eye,
  Key
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Logo from './Logo';
import { useEffect, useState } from 'react';

import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabase';

export default function Sidebar() {
  const { user, logout } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const [counts, setCounts] = useState({
    users: 0,
    projects: 0,
    tickets: 0,
    payments: 0
  });
  const { t } = useTranslation();

  // Cargar contadores con Supabase
  useEffect(() => {
    if (user?.role === 'admin') {
      const loadCounts = async () => {
        try {
          // Cargar contadores desde Supabase
          const [usersResult, projectsResult, ticketsResult, paymentsResult] = await Promise.all([
            supabase.from('users').select('id', { count: 'exact' }),
            supabase.from('projects').select('id', { count: 'exact' }),
            supabase.from('tickets').select('id', { count: 'exact' }),
            supabase.from('payments').select('id', { count: 'exact' })
          ]);

          setCounts({
            users: usersResult.count || 0,
            projects: projectsResult.count || 0,
            tickets: ticketsResult.count || 0,
            payments: paymentsResult.count || 0
          });
        } catch (error) {
          console.error('Error loading counts:', error);
          // Mantener valores por defecto en caso de error
          setCounts({
            users: 0,
            projects: 0,
            tickets: 0,
            payments: 0
          });
        }
      };

      loadCounts();
    }
  }, [user]);

  const navItem = (to: string, icon: JSX.Element, label: string, count?: number, badge?: string) => (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-2 rounded-lg font-medium transition-colors text-base w-full
        ${isActive ? 'bg-gradient-to-r from-blue-700 to-purple-700 text-white shadow' : 'text-zinc-200 hover:bg-zinc-800 hover:text-white'}`
      }
    >
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{icon}</TooltipTrigger>
          <TooltipContent>{t(label.split(' ')[0])}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <span className="truncate flex-1">{t(label)}</span>
      <div className="flex items-center gap-1 ml-auto">
        {count !== undefined && (
          <Badge variant="secondary" className="text-xs min-w-[20px] justify-center">
            {count}
          </Badge>
        )}
        {badge && (
          <Badge variant="destructive" className="text-xs">
            {badge}
          </Badge>
        )}
      </div>
    </NavLink>
  );

  const adminNavItem = (hash: string, icon: JSX.Element, label: string, count?: number, badge?: string) => {
    const isActive = location.pathname === '/admin' && (hash === 'dashboard' ? !window.location.hash : window.location.hash === `#${hash}`);
    return (
      <button
        onClick={() => {
          navigate('/admin');
          setTimeout(() => {
            if (hash === 'dashboard') {
              window.location.hash = '';
            } else {
              window.location.hash = hash;
            }
          }, 100);
        }}
        className={`flex items-center gap-3 px-4 py-2 rounded-lg font-medium transition-colors text-base w-full
        ${isActive ? 'bg-gradient-to-r from-blue-700 to-purple-700 text-white shadow' : 'text-zinc-200 hover:bg-zinc-800 hover:text-white'}`}
      >
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>{icon}</TooltipTrigger>
            <TooltipContent>{t(label.split(' ')[0])}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <span className="truncate flex-1">{t(label)}</span>
        <div className="flex items-center gap-1 ml-auto">
          {count !== undefined && (
            <Badge variant="secondary" className="text-xs min-w-[20px] justify-center">
              {count}
            </Badge>
          )}
          {badge && (
            <Badge variant="destructive" className="text-xs">
              {badge}
            </Badge>
          )}
        </div>
      </button>
    );
  };

  return (
    <aside className="h-screen w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col lg:w-64 md:w-56 sm:w-48 overflow-hidden">
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Logo y usuario */}
        <div className="flex flex-col items-center gap-4 p-4 sm:p-6 border-b border-zinc-800">
          {/* Logo TuWebAI */}
          <Logo size="lg" showText={true} />
          
          {/* Información del usuario */}
          <div className="flex flex-col items-center gap-2">
            <div className="h-10 w-10 sm:h-12 sm:w-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-xl sm:text-2xl font-bold text-white">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="text-center">
              <div className="font-semibold text-white truncate max-w-[140px] sm:max-w-[180px] text-sm sm:text-base">{user?.name}</div>
              <div className="text-xs text-zinc-400 truncate max-w-[140px] sm:max-w-[180px]">{user?.email}</div>
            </div>
          </div>
        </div>
        {/* Menú según rol */}
        {user?.role === 'admin' ? (
          // Menú completo para admin con todas las funcionalidades avanzadas
          <nav className="flex flex-col gap-1 p-3 sm:p-4 overflow-y-auto max-h-[calc(100vh-200px)]">
            {/* Sección Principal */}
            <div className="mb-4">
              <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider px-4 py-2 mb-2">{t('Principal')}</div>
              <div className="space-y-1">
                {adminNavItem('dashboard', <BarChart3 className="h-5 w-5" />, t('Dashboard'))}
                {adminNavItem('usuarios', <Users className="h-5 w-5" />, t('Usuarios'), counts.users)}
                {adminNavItem('proyectos', <FolderKanban className="h-5 w-5" />, t('Proyectos'), counts.projects)}
                {adminNavItem('tickets', <Ticket className="h-5 w-5" />, t('Tickets'), counts.tickets)}
                {adminNavItem('pagos', <CreditCard className="h-5 w-5" />, t('Pagos'), counts.payments)}
              </div>
            </div>

            {/* ANÁLISIS */}
            <div className="space-y-2">
              <h3 className="px-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                {t('Análisis')}
              </h3>
              {adminNavItem('advanced-analytics', <BarChart className="h-5 w-5" />, t('Analytics Avanzado'))}
            </div>

            {/* Sección Sistema */}
            <div className="mb-4">
              <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider px-4 py-2 mb-2">Sistema</div>
              <div className="space-y-1">
                {navItem('/code-editor', <Code className="h-5 w-5" />, 'Código')}
                {navItem('/user-management', <Users className="h-5 w-5" />, 'Gestión de Usuarios')}
                {navItem('/environment', <Key className="h-5 w-5" />, 'Variables de Entorno')}
                {adminNavItem('notifications', <Bell className="h-5 w-5" />, 'Notificaciones')}
                {adminNavItem('settings', <Settings className="h-5 w-5" />, 'Configuración')}
              </div>
            </div>
          </nav>
        ) : (
          // Menú solo para clientes
          <nav className="flex flex-col gap-1 p-3 sm:p-4">
            {navItem('/dashboard', <Home className="h-5 w-5" />, t('Dashboard'))}
            {navItem('/proyectos', <FolderKanban className="h-5 w-5" />, t('Proyectos'))}

            {navItem('/perfil', <User className="h-5 w-5" />, t('Mi Perfil'))}
            {navItem('/facturacion', <CreditCard className="h-5 w-5" />, t('Facturación'))}
            {navItem('/soporte', <HelpCircle className="h-5 w-5" />, t('Soporte'))}
            {navItem('/configuracion', <Settings className="h-5 w-5" />, t('Configuración'))}
          </nav>
        )}
      </div>
      {/* Botón cerrar sesión */}
      <div className="p-4 border-t border-zinc-800 mt-auto">
        <Button
          onClick={logout}
          variant="ghost"
          className="w-full justify-start text-zinc-400 hover:bg-red-600 hover:text-white transition-colors"
        >
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <LogOut className="h-5 w-5 mr-3" />
              </TooltipTrigger>
              <TooltipContent>{t('Salir')}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          {t('Cerrar Sesión')}
        </Button>
      </div>
    </aside>
  );
}
