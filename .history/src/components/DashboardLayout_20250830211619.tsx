import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { useAvatarSync } from '@/hooks/useAvatarSync';

interface DashboardLayoutProps {
  children: React.ReactNode;
  dashboardProps?: {
    stats?: {
      totalProjects: number;
      totalComments: number;
      inProgressProjects: number;
      completedProjects: number;
    };
    onRefresh?: () => void;
    onSearch?: (term: string) => void;
    searchTerm?: string;
  };
}

const WIDGETS = [
  { key: 'projects', label: 'Proyectos' },
  { key: 'stats', label: 'Estadísticas' },
  { key: 'team', label: 'Equipo' },
  { key: 'help', label: 'Ayuda' },
];

export default function DashboardLayout({ children, dashboardProps }: DashboardLayoutProps) {
  const { isAuthenticated, loading } = useApp();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [visibleWidgets, setVisibleWidgets] = useState<string[]>(() => {
    const saved = localStorage.getItem('dashboard_widgets');
    return saved ? JSON.parse(saved) : WIDGETS.map(w => w.key);
  });
  const location = useLocation();
  
  // SOLUCIÓN FINAL: Key dinámico basado en la ruta actual
  const routeKey = location.pathname.replace(/\//g, '-').substring(1) || 'root';

  // Sincronizar avatar automáticamente
  useAvatarSync();

  useEffect(() => {
    localStorage.setItem('dashboard_widgets', JSON.stringify(visibleWidgets));
  }, [visibleWidgets]);

  // Mostrar loading mientras se verifica la autenticación
  if (loading) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  // Redirigir solo si no está autenticado y no está cargando
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Detectar si estamos en la página de admin o dashboard del cliente
  const isAdminPage = location.pathname === '/admin';
  const isClientDashboardPage = location.pathname === '/dashboard';

  // Función para refrescar datos (solo para admin)
  const handleRefreshData = () => {
    if (isAdminPage) {
      window.location.reload();
    }
  };

  return (
    <div key={routeKey} className="h-screen bg-background flex">
      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div 
            className="fixed inset-0 bg-black/50" 
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="relative z-10">
            <Sidebar />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Topbar 
          onMenuClick={() => setIsMobileMenuOpen(true)}
          showMobileMenu={true}
          onRefreshData={isAdminPage ? handleRefreshData : undefined}
          lastUpdate={isAdminPage || isClientDashboardPage ? new Date() : undefined}
          isAdmin={isAdminPage}
          isClientDashboard={isClientDashboardPage}
          clientDashboardStats={isClientDashboardPage && dashboardProps?.stats ? dashboardProps.stats : undefined}
          onClientRefresh={isClientDashboardPage && dashboardProps?.onRefresh ? dashboardProps.onRefresh : undefined}
          onClientSearch={isClientDashboardPage && dashboardProps?.onSearch ? dashboardProps.onSearch : undefined}
          clientSearchTerm={isClientDashboardPage && dashboardProps?.searchTerm ? dashboardProps.searchTerm : ''}
        />
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
