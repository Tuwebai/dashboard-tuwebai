import { Bell, Search, Menu } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
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

interface TopbarProps {
  onMenuClick?: () => void;
  showMobileMenu?: boolean;
}

export default function Topbar({ onMenuClick, showMobileMenu = false }: TopbarProps) {
  const { t } = useTranslation();
  const { user, projects, logout } = useApp();
  const navigate = useNavigate();


  return (
    <header className="h-16 sm:h-18 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700/50 shadow-2xl">
      <div className="flex items-center justify-between px-6 sm:px-8 h-full">
        <div className="flex items-center gap-6">
          {/* Mobile menu button */}
          {showMobileMenu && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onMenuClick}
                    className="md:hidden text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-xl transition-all duration-300"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Menú</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {/* Search */}
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
              className="pl-12 bg-slate-800/50 border-slate-600/50 text-slate-200 placeholder:text-slate-400 text-sm sm:text-base rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 hover:bg-slate-800/70"
            />
          </div>
        </div>

        <div className="flex items-center gap-6">
          {/* Stats */}
          <div className="hidden sm:flex items-center gap-4">
            <div className="text-sm">
              <span className="text-slate-400 font-medium">{t('Proyectos')}: </span>
              <Badge variant="secondary" className="bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0 px-3 py-1.5 rounded-xl font-semibold shadow-lg">
                {projects.length}
              </Badge>
            </div>
          </div>

          {/* User info */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Badge Admin */}
            {user.role === 'admin' && (
              <Badge className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-xs font-bold uppercase rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105">
                ADMIN
              </Badge>
            )}
            
            {/* Avatar */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Avatar className="h-10 w-10 sm:h-12 sm:w-12 cursor-pointer border-2 border-slate-600 hover:border-blue-500 transition-all duration-300 transform hover:scale-110 shadow-lg">
                  {user?.avatar ? (
                    <AvatarImage 
                      src={user.avatar} 
                      alt={`Avatar de ${user.full_name || user.email}`}
                    />
                  ) : null}
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold text-lg">
                    {(user?.full_name || user?.email || '').charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 bg-slate-800 border-slate-700 shadow-2xl rounded-xl">
                <DropdownMenuItem 
                  onClick={() => navigate('/perfil')}
                  className="text-slate-200 hover:text-white hover:bg-slate-700 rounded-lg transition-all duration-200"
                >
                  <UserIcon className="h-4 w-4 mr-3 text-blue-400" /> {t('Mi perfil')}
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => navigate('/proyectos')}
                  className="text-slate-200 hover:text-white hover:bg-slate-700 rounded-lg transition-all duration-200"
                >
                  <FolderOpen className="h-4 w-4 mr-3 text-emerald-400" /> {t('Mis proyectos')}
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => navigate('/facturacion')}
                  className="text-slate-200 hover:text-white hover:bg-slate-700 rounded-lg transition-all duration-200"
                >
                  <CreditCard className="h-4 w-4 mr-3 text-amber-400" /> {t('Facturación / Pagos')}
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => navigate('/soporte')}
                  className="text-slate-200 hover:text-white hover:bg-slate-700 rounded-lg transition-all duration-200"
                >
                  <SettingsIcon className="h-4 w-4 mr-3 text-purple-400" /> {t('Soporte')}
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => navigate('/configuracion')}
                  className="text-slate-200 hover:text-white hover:bg-slate-700 rounded-lg transition-all duration-200"
                >
                  <SettingsIcon className="h-4 w-4 mr-3 text-slate-400" /> {t('Configuración')}
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-slate-600" />
                <DropdownMenuItem
                  onClick={async () => {
                    await logout();
                    navigate('/login');
                  }}
                  className="text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-all duration-200"
                >
                  <LogOut className="h-4 w-4 mr-3" /> {t('Cerrar sesión')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
