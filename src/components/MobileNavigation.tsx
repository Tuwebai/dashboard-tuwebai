import React, { useState, useEffect } from 'react';
import { Menu, X, Home, User, Settings, FileText, Users, CreditCard, Bell, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApp } from '@/contexts/AppContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { MOBILE_NAV_CLASSES, TOUCH_TARGET_CLASSES } from '@/lib/breakpoints';

interface MobileNavigationProps {
  className?: string;
}

export default function MobileNavigation({ className = '' }: MobileNavigationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  // Cerrar navegación al cambiar de ruta
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  // Cerrar navegación al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (isOpen && !target.closest('.mobile-nav')) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const navigationItems = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Proyectos', href: '/proyectos', icon: FileText },
    { name: 'Equipo', href: '/team', icon: Users },
    { name: 'Facturación', href: '/facturacion', icon: CreditCard },
    { name: 'Soporte', href: '/soporte', icon: Bell },
    { name: 'Configuración', href: '/configuracion', icon: Settings },
    { name: 'Mi Perfil', href: '/perfil', icon: User }
  ];

  const isActiveRoute = (href: string) => {
    return location.pathname === href;
  };

  return (
    <>
      {/* Botón de menú */}
      <Button
        variant="ghost"
        onClick={() => setIsOpen(true)}
        className={`${MOBILE_NAV_CLASSES.menuButton} ${TOUCH_TARGET_CLASSES.icon} mobile-nav`}
        aria-label="Abrir menú de navegación"
      >
        <Menu className="w-6 h-6" />
      </Button>

      {/* Overlay */}
      {isOpen && (
        <div className={`${MOBILE_NAV_CLASSES.overlay} mobile-nav`} />
      )}

      {/* Sidebar móvil */}
      <div
        className={`${MOBILE_NAV_CLASSES.sidebar} mobile-nav ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header del sidebar */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">T</span>
            </div>
            <span className="text-lg font-semibold text-gray-900">TuWebAI</span>
          </div>
          
          <Button
            variant="ghost"
            onClick={() => setIsOpen(false)}
            className={`${MOBILE_NAV_CLASSES.closeButton} ${TOUCH_TARGET_CLASSES.icon}`}
            aria-label="Cerrar menú de navegación"
          >
            <X className="w-6 h-6" />
          </Button>
        </div>

        {/* Información del usuario */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
              {user?.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.full_name || 'Usuario'}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <User className="w-6 h-6 text-gray-500" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.full_name || 'Usuario'}
              </p>
              <p className="text-sm text-gray-500 truncate">
                {user?.email}
              </p>
            </div>
          </div>
        </div>

        {/* Navegación principal */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = isActiveRoute(item.href);
            
            return (
              <Button
                key={item.name}
                variant={isActive ? 'default' : 'ghost'}
                onClick={() => navigate(item.href)}
                className={`w-full justify-start ${TOUCH_TARGET_CLASSES.button} ${
                  isActive 
                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-5 h-5 mr-3" />
                {item.name}
              </Button>
            );
          })}
        </nav>

        {/* Footer con logout */}
        <div className="p-4 border-t border-gray-200">
          <Button
            variant="ghost"
            onClick={handleLogout}
            className={`w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700 ${TOUCH_TARGET_CLASSES.button}`}
          >
            <LogOut className="w-5 h-5 mr-3" />
            Cerrar Sesión
          </Button>
        </div>
      </div>
    </>
  );
}

// Componente de navegación inferior para móviles
export function BottomNavigation() {
  const navigate = useNavigate();
  const location = useLocation();

  const bottomNavItems = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Proyectos', href: '/proyectos', icon: FileText },
    { name: 'Equipo', href: '/team', icon: Users },
    { name: 'Perfil', href: '/perfil', icon: User }
  ];

  const isActiveRoute = (href: string) => {
    return location.pathname === href;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 lg:hidden z-40">
      <div className="flex justify-around">
        {bottomNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = isActiveRoute(item.href);
          
          return (
            <button
              key={item.name}
              onClick={() => navigate(item.href)}
              className={`flex flex-col items-center py-2 px-3 ${TOUCH_TARGET_CLASSES.button} ${
                isActive 
                  ? 'text-blue-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              aria-label={item.name}
            >
              <Icon className={`w-6 h-6 mb-1 ${isActive ? 'text-blue-600' : ''}`} />
              <span className="text-xs font-medium">{item.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Hook para detectar si estamos en móvil
export function useMobileNavigation() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
}
