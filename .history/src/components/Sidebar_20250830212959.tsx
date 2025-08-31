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
  BarChart,
  Eye,
  Key,
  ChevronRight,
  Search,
  GitBranch,
  GitCommit,
  Wrench
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useEffect, useState, useCallback } from 'react';

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
  const loadCounts = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    if (user?.role === 'admin') {
      loadCounts();
    }
  }, [user?.role]);

  const navItem = (to: string, icon: JSX.Element, label: string, count?: number, badge?: string) => (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `relative group cursor-pointer transition-all duration-300 ease-out hover:bg-gray-50 w-full
        ${isActive ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-r-4 border-blue-500' : ''}`
      }
    >
      {({ isActive }) => (
        <>
          <div className="flex items-center px-4 py-3.5 space-x-4">
            <div className={`relative p-2 rounded-xl transition-all duration-300 ${
              isActive 
                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25' 
                : 'bg-gray-100 text-gray-600 group-hover:bg-blue-100 group-hover:text-blue-600'
            }`}>
              {isActive && (
                <div className="absolute inset-0 bg-blue-400 rounded-xl animate-ping opacity-25"></div>
              )}
              <div className="transition-transform duration-300 group-hover:scale-110">
                {icon}
              </div>
            </div>
            <span className={`font-medium text-sm flex-1 ${
              isActive ? 'text-gray-900' : 'text-gray-700 group-hover:text-gray-900'
            }`}>
              {t(label)}
            </span>
            <div className="flex items-center gap-1 ml-auto">
              {count !== undefined && (
                <Badge variant="secondary" className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                  isActive 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-red-100 text-red-600 group-hover:bg-red-500 group-hover:text-white'
                }`}>
                  {count}
                </Badge>
              )}
              {badge && (
                <Badge variant="destructive" className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                  isActive 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-red-500 text-white group-hover:bg-red-600'
                }`}>
                  {badge}
                </Badge>
              )}
              {isActive && (
                <ChevronRight size={16} className="text-blue-500 animate-pulse" />
              )}
            </div>
          </div>
          {isActive && (
            <div className="absolute left-0 top-0 w-1 h-full bg-gradient-to-b from-blue-400 to-blue-600 rounded-r-full"></div>
          )}
        </>
      )}
    </NavLink>
  );

  const adminNavItem = (hash: string, icon: JSX.Element, label: string, count?: number, badge?: string) => {
    const isActive = location.pathname === '/admin' && (hash === 'dashboard' ? !window.location.hash : window.location.hash === `#${hash}`);
    return (
      <button
        onClick={() => {
          if (location.pathname !== '/admin') {
            // Si no estamos en /admin, navegar primero
            navigate('/admin');
            // Usar un timeout más largo para asegurar que la navegación se complete
            setTimeout(() => {
              if (hash === 'dashboard') {
                window.location.hash = '';
              } else {
                window.location.hash = hash;
              }
              // Forzar un re-render después de cambiar el hash
              setTimeout(() => {
                window.dispatchEvent(new HashChangeEvent('hashchange'));
              }, 100);
            }, 200);
          } else {
            // Si ya estamos en /admin, solo cambiar el hash
            if (hash === 'dashboard') {
              window.location.hash = '';
            } else {
              window.location.hash = hash;
            }
            // Forzar un re-render del componente Admin
            setTimeout(() => {
              window.dispatchEvent(new HashChangeEvent('hashchange'));
            }, 100);
          }
        }}
        className={`relative group cursor-pointer transition-all duration-300 ease-out hover:bg-gray-50 w-full
        ${isActive ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-r-4 border-blue-500' : ''}`}
      >
        <div className="flex items-center px-4 py-3.5 space-x-4">
          <div className={`relative p-2 rounded-xl transition-all duration-300 ${
            isActive 
              ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25' 
              : 'bg-gray-100 text-gray-600 group-hover:bg-blue-100 group-hover:text-blue-600'
          }`}>
            {isActive && (
              <div className="absolute inset-0 bg-blue-400 rounded-xl animate-ping opacity-25"></div>
            )}
            <div className="transition-transform duration-300 group-hover:scale-110">
              {icon}
            </div>
          </div>
          <span className={`font-medium text-sm flex-1 ${
            isActive ? 'text-gray-900' : 'text-gray-700 group-hover:text-gray-900'
          }`}>
            {t(label)}
          </span>
          <div className="flex items-center gap-1 ml-auto">
            {count !== undefined && (
              <Badge variant="secondary" className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                isActive 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-red-100 text-red-600 group-hover:bg-red-500 group-hover:text-white'
              }`}>
                {count}
              </Badge>
            )}
            {badge && (
              <Badge variant="destructive" className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                isActive 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-red-100 text-red-600 group-hover:bg-red-500 group-hover:text-white'
              }`}>
                {badge}
              </Badge>
            )}
            {isActive && (
              <ChevronRight size={16} className="text-blue-500 animate-pulse" />
            )}
          </div>
        </div>
        {isActive && (
          <div className="absolute left-0 top-0 w-1 h-full bg-gradient-to-b from-blue-400 to-blue-600 rounded-r-full"></div>
        )}
      </button>
    );
  };

  return (
    <aside className="w-64 sm:w-72 lg:w-80 bg-white border-r border-gray-100 shadow-lg flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg">
            <span className="text-white font-bold text-lg sm:text-xl">T</span>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate">TuWebAI</h1>
            <p className="text-xs sm:text-sm text-gray-500 truncate">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4">
        {user?.role === 'admin' ? (
          // Menú completo para administradores
          <nav className="flex-1 overflow-y-auto py-2 px-2">
            {/* DASHBOARD */}
            <div className="mb-6 sm:mb-8 px-2">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-2 mb-2">Dashboard</div>
              <div className="h-px bg-gradient-to-r from-gray-200 to-transparent mb-2"></div>
              <div className="space-y-1">
                {adminNavItem('dashboard', <Home size={18} />, t('Dashboard'), counts.projects)}
              </div>
            </div>

            {/* GESTIÓN */}
            <div className="mb-6 sm:mb-8 px-2">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-2 mb-2">{t('Gestión')}</div>
              <div className="h-px bg-gradient-to-r from-gray-200 to-transparent mb-2"></div>
              <div className="space-y-1">
                {adminNavItem('users', <Users size={18} />, t('Usuarios'), counts.users)}
                {adminNavItem('projects', <FolderKanban size={18} />, t('Proyectos'), counts.projects)}
                {adminNavItem('tickets', <Ticket size={18} />, t('Tickets'), counts.tickets)}
                {adminNavItem('pagos', <CreditCard size={18} />, t('Pagos'), counts.payments)}
              </div>
            </div>

            {/* ANÁLISIS */}
            <div className="mb-6 sm:mb-8 px-2">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-2 mb-2">{t('Análisis')}</div>
              <div className="h-px bg-gradient-to-r from-gray-200 to-transparent mb-2"></div>
              <div className="space-y-1">
                {adminNavItem('advanced-analytics', <BarChart size={18} />, t('Analytics Avanzado'))}
                {adminNavItem('version-management', <GitBranch size={18} />, 'Gestión de Versiones')}
              </div>
            </div>

            {/* AUTOMATIZACIÓN */}
            <div className="mb-6 sm:mb-8 px-2">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-2 mb-2">Automatización</div>
              <div className="h-px bg-gradient-to-r from-gray-200 to-transparent mb-2"></div>
              <div className="space-y-1">
                {adminNavItem('automation', <Zap size={18} />, 'Sistema de Automatización')}
                {adminNavItem('auto-version', <GitCommit size={18} />, 'Auto Versiones')}
                {adminNavItem('advanced-tools', <Wrench size={18} />, 'Herramientas Avanzadas')}
              </div>
            </div>

            {/* Sección Sistema */}
            <div className="mb-6 sm:mb-8 px-2">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-2 mb-2">Sistema</div>
              <div className="h-px bg-gradient-to-r from-gray-200 to-transparent mb-2"></div>
              <div className="space-y-1">
                {navItem('/environment', <Key size={18} />, 'Variables de Entorno')}
                {adminNavItem('notifications', <Bell size={18} />, 'Notificaciones')}
                {adminNavItem('settings', <Settings size={18} />, 'Configuración')}
              </div>
            </div>
          </nav>
        ) : (
          // Menú solo para clientes
          <nav className="flex-1 overflow-y-auto py-2 px-2">
            {/* Sección Principal */}
            <div className="mb-6 px-2">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-2 mb-2">Principal</div>
              <div className="h-px bg-gradient-to-r from-gray-200 to-transparent mb-2"></div>
              <div className="space-y-1">
                {navItem('/dashboard', <Home size={18} />, t('Dashboard'))}
                {navItem('/proyectos', <FolderKanban size={18} />, t('Proyectos'))}
              </div>
            </div>

            {/* Sección Personal */}
            <div className="mb-6 px-2">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-2 mb-2">Personal</div>
              <div className="h-px bg-gradient-to-r from-gray-200 to-transparent mb-2"></div>
              <div className="space-y-1">
                {navItem('/perfil', <User size={18} />, t('Mi Perfil'))}
                {navItem('/facturacion', <CreditCard size={18} />, t('Facturación'))}
              </div>
            </div>

            {/* Sección Soporte */}
            <div className="mb-6 px-2">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-2 mb-2">Soporte</div>
              <div className="h-px bg-gradient-to-r from-gray-200 to-transparent mb-2"></div>
              <div className="space-y-1">
                {navItem('/soporte', <HelpCircle size={18} />, t('Soporte'))}
                {navItem('/configuracion', <Settings size={18} />, t('Configuración'))}
              </div>
            </div>
          </nav>
        )}
      </div>

      {/* Footer mejorado */}
      <div className="p-3 sm:p-4 border-t border-gray-100 bg-gradient-to-r from-gray-50 to-white">
        <Button
          onClick={logout}
          variant="ghost"
          className="w-full flex items-center space-x-3 px-3 py-2 sm:py-3 text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all duration-300 group text-sm sm:text-base"
        >
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <LogOut size={16} className="sm:w-[18px] sm:h-[18px]" />
              </TooltipTrigger>
              <TooltipContent>{t('Salir')}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <span>{t('Cerrar Sesión')}</span>
        </Button>
      </div>
    </aside>
  );
}
