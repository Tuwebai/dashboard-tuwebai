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
  MessageSquare,
  TrendingUp,
  FileText,
  Zap,
  Code,
  BarChart,
  Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Logo from './Logo';
import { useEffect, useState } from 'react';
import { firestore } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

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

  // Cargar contadores
  useEffect(() => {
    if (user?.role === 'admin') {
      loadCounts();
    }
  }, [user]);

  const loadCounts = async () => {
    try {
      const [usersSnap, projectsSnap, ticketsSnap, paymentsSnap] = await Promise.all([
        getDocs(collection(firestore, 'users')),
        getDocs(collection(firestore, 'projects')),
        getDocs(collection(firestore, 'tickets')),
        getDocs(collection(firestore, 'pagos'))
      ]);

      setCounts({
        users: usersSnap.size,
        projects: projectsSnap.size,
        tickets: ticketsSnap.size,
        payments: paymentsSnap.size
      });
    } catch (error) {
      console.error('Error loading counts:', error);
    }
  };

  const navItem = (to: string, icon: JSX.Element, label: string, count?: number, badge?: string) => (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-2 rounded-lg font-medium transition-colors text-base w-full
        ${isActive ? 'bg-gradient-to-r from-blue-700 to-purple-700 text-white shadow' : 'text-zinc-200 hover:bg-zinc-800 hover:text-white'}`
      }
    >
      {icon}
      <span className="truncate flex-1">{label}</span>
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
    const isActive = location.pathname === '/admin' && window.location.hash === `#${hash}`;
    return (
      <button
        onClick={() => {
          navigate('/admin');
          setTimeout(() => {
            window.location.hash = hash;
          }, 100);
        }}
        className={`flex items-center gap-3 px-4 py-2 rounded-lg font-medium transition-colors text-base w-full
        ${isActive ? 'bg-gradient-to-r from-blue-700 to-purple-700 text-white shadow' : 'text-zinc-200 hover:bg-zinc-800 hover:text-white'}`}
      >
        {icon}
        <span className="truncate flex-1">{label}</span>
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
    <aside className="h-screen w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col justify-between">
      <div>
        {/* Logo y usuario */}
        <div className="flex flex-col items-center gap-4 p-6 border-b border-zinc-800">
          {/* Logo TuWebAI */}
          <Logo size="lg" showText={true} />
          
          {/* Información del usuario */}
          <div className="flex flex-col items-center gap-2">
            <div className="h-12 w-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-2xl font-bold text-white">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="text-center">
              <div className="font-semibold text-white truncate max-w-[180px]">{user?.name}</div>
              <div className="text-xs text-zinc-400 truncate max-w-[180px]">{user?.email}</div>
            </div>
          </div>
        </div>
        {/* Menú según rol */}
        {user?.role === 'admin' ? (
          // Menú completo para admin con todas las funcionalidades avanzadas
          <nav className="flex flex-col gap-1 p-4 overflow-y-auto max-h-[calc(100vh-200px)]">
            {/* Sección Principal */}
            <div className="mb-4">
              <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider px-4 py-2 mb-2">Principal</div>
              <div className="space-y-1">
                {navItem('/admin', <BarChart3 className="h-5 w-5" />, 'Dashboard')}
                {adminNavItem('usuarios', <Users className="h-5 w-5" />, 'Usuarios', counts.users)}
                {adminNavItem('proyectos', <FolderKanban className="h-5 w-5" />, 'Proyectos', counts.projects)}
                {adminNavItem('tickets', <Ticket className="h-5 w-5" />, 'Tickets', counts.tickets)}
                {adminNavItem('pagos', <CreditCard className="h-5 w-5" />, 'Pagos', counts.payments)}
              </div>
            </div>

            {/* Sección Análisis */}
            <div className="mb-4">
              <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider px-4 py-2 mb-2">Análisis</div>
              <div className="space-y-1">
                {adminNavItem('metricas', <TrendingUp className="h-5 w-5" />, 'Métricas')}
                {adminNavItem('advanced-analytics', <BarChart className="h-5 w-5" />, 'Analytics Avanzado')}
              </div>
            </div>

            {/* Sección Sistema */}
            <div className="mb-4">
              <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider px-4 py-2 mb-2">Sistema</div>
              <div className="space-y-1">
                {adminNavItem('notifications', <Bell className="h-5 w-5" />, 'Notificaciones')}
                {adminNavItem('logs', <Database className="h-5 w-5" />, 'Logs')}
                {adminNavItem('backup', <HardDrive className="h-5 w-5" />, 'Backup')}
                {adminNavItem('settings', <Settings className="h-5 w-5" />, 'Configuración')}
              </div>
            </div>

            {/* Sección Herramientas */}
            <div className="mb-4">
              <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider px-4 py-2 mb-2">Herramientas</div>
              <div className="space-y-1">
                {adminNavItem('tools', <Code className="h-5 w-5" />, 'Herramientas Avanzadas')}
                {adminNavItem('security-audit', <Eye className="h-5 w-5" />, 'Auditoría de Seguridad')}
                {adminNavItem('chat', <MessageSquare className="h-5 w-5" />, 'Chat Admin')}
                {adminNavItem('reports', <FileText className="h-5 w-5" />, 'Reportes')}
                {adminNavItem('security', <Shield className="h-5 w-5" />, 'Seguridad')}
                {adminNavItem('performance', <Zap className="h-5 w-5" />, 'Rendimiento')}
              </div>
            </div>
          </nav>
        ) : (
          // Menú solo para clientes
          <nav className="flex flex-col gap-1 p-4">
            {navItem('/dashboard', <Home className="h-5 w-5" />, 'Dashboard')}
            {navItem('/proyectos', <FolderKanban className="h-5 w-5" />, 'Proyectos')}
            {navItem('/notificaciones', <Bell className="h-5 w-5" />, 'Notificaciones')}
            {navItem('/perfil', <User className="h-5 w-5" />, 'Mi Perfil')}
            {navItem('/facturacion', <CreditCard className="h-5 w-5" />, 'Facturación')}
            {navItem('/soporte', <HelpCircle className="h-5 w-5" />, 'Soporte')}
            {navItem('/configuracion', <Settings className="h-5 w-5" />, 'Configuración')}
          </nav>
        )}
      </div>
      {/* Botón cerrar sesión */}
      <div className="p-4 border-t border-zinc-800">
        <Button
          onClick={logout}
          variant="ghost"
          className="w-full justify-start text-zinc-400 hover:bg-red-600 hover:text-white transition-colors"
        >
          <LogOut className="h-5 w-5 mr-3" />
          Cerrar Sesión
        </Button>
      </div>
    </aside>
  );
}