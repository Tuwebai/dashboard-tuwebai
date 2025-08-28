import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import i18n from './lib/i18n';
import { AppProvider } from './contexts/AppContext';

import { ThemeProvider } from './contexts/ThemeContext';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingSpinner from './components/LoadingSpinner';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/DashboardLayout';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';

// Lazy loading de todas las páginas
const Index = lazy(() => import('./pages/Index'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const PoliticaPrivacidad = lazy(() => import('./pages/PoliticaPrivacidad'));
const TerminosCondiciones = lazy(() => import('./pages/TerminosCondiciones'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Admin = lazy(() => import('./pages/Admin'));
const Proyectos = lazy(() => import('./pages/Proyectos'));
const ProyectosNuevo = lazy(() => import('./pages/ProyectosNuevo'));

const CollaborationPage = lazy(() => import('./pages/CollaborationPage'));
const ClientCollaborationPage = lazy(() => import('./pages/ClientCollaborationPage'));

const WorkspacePage = lazy(() => import('./pages/WorkspacePage'));
const VisualBuilder = lazy(() => import('./pages/VisualBuilder'));
const Perfil = lazy(() => import('./pages/Perfil'));
const Configuracion = lazy(() => import('./pages/Configuracion'));
const Facturacion = lazy(() => import('./pages/Facturacion'));
const Soporte = lazy(() => import('./pages/Soporte'));
const Help = lazy(() => import('./pages/Help'));
const Team = lazy(() => import('./pages/Team'));
const NotFound = lazy(() => import('./pages/NotFound'));
const AdvancedAnalytics = lazy(() => import('./components/AdvancedAnalytics'));
const CustomizableDashboard = lazy(() => import('./components/CustomizableDashboard'));
const AdvancedUserManagement = lazy(() => import('./components/AdvancedUserManagement'));
const InvitationPage = lazy(() => import('./pages/InvitationPage'));
const AuthCallback = lazy(() => import('./pages/AuthCallback'));
const EnvironmentVariables = lazy(() => import('./pages/EnvironmentVariables'));

// Componente de carga optimizado
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
    <div className="text-center">
      <LoadingSpinner size="lg" />
      <p className="mt-4 text-gray-600">Cargando...</p>
    </div>
  </div>
);

// QueryClient con configuración optimizada
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos
      gcTime: 10 * 60 * 1000, // 10 minutos (reemplaza cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function AppRoutes() {
  return (
      <Routes>
      {/* Rutas públicas */}
      <Route path="/" element={<Index />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/politica-privacidad" element={<PoliticaPrivacidad />} />
        <Route path="/terminos-condiciones" element={<TerminosCondiciones />} />
      <Route path="/invite" element={<InvitationPage />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      
      {/* Rutas protegidas */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <DashboardLayout>
            <Dashboard />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/admin" element={
        <ProtectedRoute>
          <DashboardLayout>
            <Admin />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/proyectos" element={
        <ProtectedRoute>
          <DashboardLayout>
            <Proyectos />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/proyectos/nuevo" element={
        <ProtectedRoute>
          <DashboardLayout>
            <ProyectosNuevo />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      

      
      <Route path="/proyectos/:projectId/colaboracion" element={
        <ProtectedRoute>
          <DashboardLayout>
            <CollaborationPage />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/proyectos/:projectId/colaboracion-cliente" element={
        <ProtectedRoute>
          <DashboardLayout>
            <ClientCollaborationPage />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      

      
      <Route path="/workspace" element={
        <ProtectedRoute>
          <DashboardLayout>
            <WorkspacePage />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/visual-builder" element={
        <ProtectedRoute>
          <DashboardLayout>
            <VisualBuilder />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/perfil" element={
        <ProtectedRoute>
          <DashboardLayout>
            <Perfil />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/configuracion" element={
        <ProtectedRoute>
          <DashboardLayout>
            <Configuracion />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/facturacion" element={
        <ProtectedRoute>
          <DashboardLayout>
            <Facturacion />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/soporte" element={
        <ProtectedRoute>
          <DashboardLayout>
            <Soporte />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/help" element={
        <ProtectedRoute>
          <DashboardLayout>
            <Help />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/team" element={
        <ProtectedRoute>
          <DashboardLayout>
            <Team />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/environment" element={
        <ProtectedRoute>
          <DashboardLayout>
            <EnvironmentVariables />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/analytics" element={
        <ProtectedRoute>
          <DashboardLayout>
            <AdvancedAnalytics />
          </DashboardLayout>
        </ProtectedRoute>
      } />
        
      <Route path="/dashboard-custom" element={
        <ProtectedRoute>
          <DashboardLayout>
            <CustomizableDashboard />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/user-management" element={
        <ProtectedRoute>
          <DashboardLayout>
            <AdvancedUserManagement />
          </DashboardLayout>
        </ProtectedRoute>
      } />
        
      {/* Ruta 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <I18nextProvider i18n={i18n}>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <TooltipProvider>
              <AppProvider>
                <Router 
                  basename={import.meta.env.BASE_URL || '/'}
                  future={{
                    v7_startTransition: true,
                    v7_relativeSplatPath: true
                  }}
                >
                  <Suspense fallback={<PageLoader />}>
                    <AppRoutes />
                  </Suspense>
                  <Toaster />
                  <Sonner />
                </Router>
              </AppProvider>
            </TooltipProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </I18nextProvider>
    </ErrorBoundary>
  );
}

export default App;
