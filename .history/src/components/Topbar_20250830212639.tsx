import { Bell, Search, Menu, Clock, RefreshCw } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useNavigate, useLocation } from 'react-router-dom';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

import { LogOut, User as UserIcon, FolderOpen, CreditCard, Settings as SettingsIcon } from 'lucide-react';

import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { useTranslation } from 'react-i18next';
import NotificationBell from '@/components/admin/NotificationBell';

interface TopbarProps {
  onMenuClick?: () => void;
  showMobileMenu?: boolean;
  onRefreshData?: () => void;
  lastUpdate?: Date;
  isAdmin?: boolean;
  isClientDashboard?: boolean;
  clientDashboardStats?: {
    totalProjects: number;
    totalComments: number;
    inProgressProjects: number;
    completedProjects: number;
  };
  onClientRefresh?: () => void;
  onClientSearch?: (term: string) => void;
  clientSearchTerm?: string;
}

export default function Topbar({ 
  onMenuClick, 
  showMobileMenu = false, 
  onRefreshData,
  lastUpdate,
  isAdmin = false,
  isClientDashboard = false,
  clientDashboardStats,
  onClientRefresh,
  onClientSearch,
  clientSearchTerm = ''
}: TopbarProps) {
  const { t } = useTranslation();
  const { user, projects, logout } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  const isAdminPage = location.pathname === '/admin';
  const isClientDashboardPage = location.pathname === '/dashboard';

  return (
    <header className={`${isAdminPage || isClientDashboardPage ? 'h-auto' : 'h-16 sm:h-18'} bg-white border-b border-slate-200 shadow-sm`}>
      <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 sm:px-6 lg:px-8 ${isAdminPage || isClientDashboardPage ? 'py-4 sm:py-6' : 'h-full'}`}>
        <div className="flex items-center gap-4 sm:gap-6 w-full sm:w-auto">
          {/* Mobile menu button */}
          {showMobileMenu && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onMenuClick}
                    className="md:hidden text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all duration-300"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Menú</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {/* Admin Panel Header */}
          {isAdminPage ? (
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">
                Panel de Administración
              </h1>
              <p className="text-slate-600 text-sm sm:text-base font-medium mt-1">
                Gestiona usuarios, proyectos, tickets y pagos
              </p>
              {lastUpdate && (
                <div className="text-slate-500 text-xs sm:text-sm flex items-center space-x-2 mt-2">
                  <Clock size={14} className="sm:w-4 sm:h-4" />
                  <span>Última actualización: {lastUpdate.toLocaleTimeString()}</span>
                </div>
              )}
            </div>
          ) : isClientDashboardPage ? (
            /* Client Dashboard Header */
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">
                Mi Dashboard
              </h1>
              <p className="text-slate-600 text-sm sm:text-base font-medium mt-1">
                Gestiona y revisa el progreso de tus proyectos web
              </p>
              {lastUpdate && (
                <div className="text-slate-500 text-xs sm:text-sm flex items-center space-x-2 mt-2">
                  <Clock size={14} className="sm:w-4 sm:h-4" />
                  <span>Última actualización: {lastUpdate.toLocaleTimeString()}</span>
                </div>
              )}
            </div>
          ) : (
            /* Regular Search */
            <div className="relative max-w-xs sm:max-w-md w-full">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  </TooltipTrigger>
                  <TooltipContent>Buscar</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Input
                placeholder="Buscar proyectos..."
                className="pl-12 bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-500 text-sm sm:text-base rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-border transition-all duration-300 hover:bg-slate-100"
              />
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 sm:gap-6 w-full sm:w-auto mt-4 sm:mt-0">
          {/* Admin Panel Actions */}
          {isAdminPage ? (
            <div className="flex items-center space-x-2 sm:space-x-4 w-full sm:w-auto">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onRefreshData}
                      className="bg-white border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition-all duration-300 flex-1 sm:flex-none"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">Actualizar</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Recargar datos desde la base de datos</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <div className="flex items-center gap-2">
                <NotificationBell />
                {/* User Avatar and Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user?.avatar} alt={user?.full_name || user?.email} />
                        <AvatarFallback className="bg-blue-100 text-blue-600 text-sm font-semibold">
                          {user?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuItem className="flex flex-col items-start">
                      <div className="flex items-center space-x-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user?.avatar} alt={user?.full_name || user?.email} />
                          <AvatarFallback className="bg-blue-100 text-blue-600 text-sm font-semibold">
                            {user?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium leading-none">{user?.full_name || 'Usuario'}</p>
                          <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                        </div>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate('/perfil')}>
                      <UserIcon className="mr-2 h-4 w-4" />
                      <span>Mi Perfil</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/proyectos')}>
                      <FolderOpen className="mr-2 h-4 w-4" />
                      <span>Mis Proyectos</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/facturacion')}>
                      <CreditCard className="mr-2 h-4 w-4" />
                      <span>Facturación</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/configuracion')}>
                      <SettingsIcon className="mr-2 h-4 w-4" />
                      <span>Configuración</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout} className="text-red-600">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Cerrar Sesión</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ) : isClientDashboardPage ? (
            /* Client Dashboard Actions */
            <div className="flex items-center space-x-2 sm:space-x-4 w-full sm:w-auto">
              {/* Barra de búsqueda */}
              <div className="relative flex-1 sm:flex-none">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                <Input
                  placeholder="Buscar proyectos..."
                  value={clientSearchTerm}
                  onChange={(e) => onClientSearch?.(e.target.value)}
                  className="pl-10 w-full sm:w-64 bg-slate-50 border-slate-200 text-slate-700 placeholder-slate-400"
                />
              </div>
              
              {/* Notificación */}
              <div className="relative">
                <Button variant="ghost" size="sm" className="relative p-2">
                  <Bell className="h-5 w-5 text-slate-600" />
                  {clientDashboardStats && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {clientDashboardStats.totalComments > 99 ? '99+' : clientDashboardStats.totalComments}
                    </span>
                  )}
                </Button>
              </div>
              
              {/* Botón actualizar */}
              {onClientRefresh && (
                <Button
                  onClick={onClientRefresh}
                  className="px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all duration-300 shadow-sm hover:shadow-md transform hover:-translate-y-0.5 text-sm sm:text-base"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Actualizar</span>
                </Button>
              )}
            </div>
          ) : (
            /* Regular Stats */
            <div className="hidden sm:flex items-center gap-4">
              <div className="text-sm">
                <span className="text-slate-600 font-medium">{t('Proyectos')}: </span>
                <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-0 px-3 py-1.5 rounded-lg font-semibold">
                  {projects.length}
                </Badge>
              </div>
              
              {/* User Avatar and Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.avatar} alt={user?.full_name || user?.email} />
                      <AvatarFallback className="bg-blue-100 text-blue-600 text-sm font-semibold">
                        {user?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuItem className="flex flex-col items-start">
                    <div className="flex items-center space-x-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user?.avatar} alt={user?.full_name || user?.email} />
                        <AvatarFallback className="bg-blue-100 text-blue-600 text-sm font-semibold">
                          {user?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user?.full_name || 'Usuario'}</p>
                        <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                      </div>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/perfil')}>
                    <UserIcon className="mr-2 h-4 w-4" />
                    <span>Mi Perfil</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/proyectos')}>
                    <FolderOpen className="mr-2 h-4 w-4" />
                    <span>Mis Proyectos</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/facturacion')}>
                    <CreditCard className="mr-2 h-4 w-4" />
                    <span>Facturación</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/configuracion')}>
                    <SettingsIcon className="mr-2 h-4 w-4" />
                    <span>Configuración</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Cerrar Sesión</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
