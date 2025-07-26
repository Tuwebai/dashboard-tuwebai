import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AppProvider } from "@/contexts/AppContext";
import DashboardLayout from "@/components/DashboardLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { AnimatePresence, motion } from 'framer-motion';
import { NotificationProvider } from '@/contexts/NotificationContext';
import NotificationSystem from '@/components/NotificationSystem';
import { useApp } from './contexts/AppContext';
import { Suspense, lazy, useEffect } from 'react';
import ErrorBoundary from '@/components/ErrorBoundary';
import { initializeEmailJS } from '@/lib/emailConfig';

// Lazy loading de todas las páginas
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const ProjectsPage = lazy(() => import('./pages/ProjectsPage'));
const VisualBuilder = lazy(() => import('./pages/VisualBuilder'));
const NotFound = lazy(() => import('./pages/NotFound'));
const Team = lazy(() => import('./pages/Team'));
const Settings = lazy(() => import('./pages/Settings'));
const Help = lazy(() => import('./pages/Help'));
const CodeEditorPage = lazy(() => import('./pages/CodeEditorPage'));
const WorkspacePage = lazy(() => import('./pages/WorkspacePage'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));
const Perfil = lazy(() => import('./pages/Perfil'));
const Proyectos = lazy(() => import('./pages/Proyectos'));
const Facturacion = lazy(() => import('./pages/Facturacion'));
const Soporte = lazy(() => import('./pages/Soporte'));
const Configuracion = lazy(() => import('./pages/Configuracion'));
const ProyectosNuevo = lazy(() => import('./pages/ProyectosNuevo'));
const CollaborationPage = lazy(() => import('./pages/CollaborationPage'));
const Admin = lazy(() => import('./pages/Admin'));

const EditarProyecto = lazy(() => import('./pages/EditarProyecto'));

// Componente de carga
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen bg-zinc-900">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-zinc-400 text-sm">Cargando...</p>
    </div>
  </div>
);

const queryClient = new QueryClient();

function AppRoutes() {
  const { user } = useApp();
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/" element={
          user?.role === 'admin' ? <Navigate to="/admin" replace /> : <Navigate to="/dashboard" replace />
        } />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Rutas protegidas - disponibles para admin y cliente */}
        <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout><Dashboard /></DashboardLayout></ProtectedRoute>} />
        <Route path="/proyectos" element={<ProtectedRoute><DashboardLayout><ProjectsPage /></DashboardLayout></ProtectedRoute>} />
        <Route path="/proyectos/nuevo" element={<Navigate to="/proyectos" replace />} />
        <Route path="/proyectos/:projectId/colaboracion" element={<ProtectedRoute><DashboardLayout><CollaborationPage /></DashboardLayout></ProtectedRoute>} />
        <Route path="/notificaciones" element={<ProtectedRoute><DashboardLayout><NotificationsPage /></DashboardLayout></ProtectedRoute>} />
        <Route path="/perfil" element={<ProtectedRoute><DashboardLayout><Perfil /></DashboardLayout></ProtectedRoute>} />
        <Route path="/facturacion" element={<ProtectedRoute><DashboardLayout><Facturacion /></DashboardLayout></ProtectedRoute>} />
        <Route path="/soporte" element={<ProtectedRoute><DashboardLayout><Soporte /></DashboardLayout></ProtectedRoute>} />
        <Route path="/configuracion" element={<ProtectedRoute><DashboardLayout><Configuracion /></DashboardLayout></ProtectedRoute>} />

        <Route path="/proyectos/:id" element={<ProtectedRoute><DashboardLayout><EditarProyecto /></DashboardLayout></ProtectedRoute>} />
        
        {/* Ruta de admin */}
        <Route path="/admin" element={<ProtectedRoute><DashboardLayout><Admin /></DashboardLayout></ProtectedRoute>} />
        
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

const App = () => {
  // Inicializar EmailJS cuando la app se carga
  useEffect(() => {
    // Inicializar EmailJS
    const emailJSInitialized = initializeEmailJS();
    if (emailJSInitialized) {
      console.log('✅ EmailJS inicializado correctamente');
    } else {
      console.log('⚠️ EmailJS no disponible');
    }
  }, []);

  return (
    <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppProvider>
            <NotificationProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <div className="dark">
              <AppRoutes />
            </div>
          </BrowserRouter>
            </NotificationProvider>
        </AppProvider>
      </TooltipProvider>
    </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
