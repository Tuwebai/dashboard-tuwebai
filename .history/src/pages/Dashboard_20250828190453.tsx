import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { 
  Plus, 
  MessageSquare, 
  Calendar, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Download,
  Eye,
  BarChart3,
  TrendingUp,
  Users,
  FileText,
  Send,
  Search,
  RefreshCw,
  Bell
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useTranslation } from 'react-i18next';
import { formatDateSafe } from '@/utils/formatDateSafe';
import VerDetallesProyecto from '@/components/VerDetallesProyecto';

interface ProjectPhase {
  key: string;
  estado: 'Pendiente' | 'En Progreso' | 'Terminado';
  descripcion?: string;
  fechaEntrega?: string;
  archivos?: Array<{ url: string; name: string }>;
  comentarios?: Array<{
    id: string;
    texto: string;
    autor: string;
    fecha: string;
    tipo: 'admin' | 'cliente';
  }>;
}

interface Project {
  id: string;
  name: string;
  description: string | null;
  created_by: string;
  status: string;
  created_at: string;
  updated_at: string;
  // Campos extendidos para compatibilidad
  type?: string;
  ownerEmail?: string;
  createdAt?: string;
  fases?: ProjectPhase[];
}

const FASES = [
  { key: 'ui', label: 'UI Design', icon: '🎨' },
  { key: 'maquetado', label: 'Maquetado', icon: '📱' },
  { key: 'contenido', label: 'Contenido', icon: '📝' },
  { key: 'funcionalidades', label: 'Funcionalidades', icon: '⚙️' },
  { key: 'seo', label: 'SEO', icon: '🔍' },
  { key: 'deploy', label: 'Deploy', icon: '🚀' },
];

export default function Dashboard() {
  const { user, projects, updateProject, addCommentToPhase, loading } = useApp();
  const navigate = useNavigate();
  const [comentarioInput, setComentarioInput] = useState<Record<string, string>>({});
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalInitialized, setModalInitialized] = useState(false);
  const [realTimeProjects, setRealTimeProjects] = useState<Project[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const { t } = useTranslation();


  // Proyectos visibles para el usuario actual y validación temprana
  const userProjects = realTimeProjects.filter(p => p.created_by === user?.id && p.id);
  const hasValidProjects = userProjects.length > 0;

  // Escuchar cambios en tiempo real de los proyectos del usuario
  useEffect(() => {
    if (!user) {
      setRealTimeProjects([]);
      return;
    }

    const userProjects = projects.filter(p => p.created_by === user.id);
    
    if (userProjects.length === 0) {
      setRealTimeProjects([]);
      return;
    }

    // Usar los proyectos directamente desde el contexto de Supabase
    setRealTimeProjects(userProjects);
  }, [user, projects]);

  // Limpiar estado del modal cuando se desmonte el componente
  useEffect(() => {
    return () => {
      setIsModalOpen(false);
      setSelectedProject(null);
      setModalInitialized(false);
    };
  }, []);

  // Verificar que el modal no se abra automáticamente
  useEffect(() => {
    if (isModalOpen && !modalInitialized) {
      console.warn('Modal se abrió automáticamente, cerrando...');
      setIsModalOpen(false);
      setSelectedProject(null);
    }
  }, [isModalOpen, modalInitialized]);

  // Verificar que el modal no se abra cuando no hay proyectos válidos
  useEffect(() => {
    if (isModalOpen && !hasValidProjects) {
      console.warn('Modal abierto sin proyectos válidos, cerrando...');
      setIsModalOpen(false);
      setSelectedProject(null);
      setModalInitialized(false);
    }
  }, [isModalOpen, hasValidProjects]);



  const handleComentarioChange = (projectId: string, faseKey: string, value: string) => {
    setComentarioInput(prev => ({ ...prev, [`${projectId}-${faseKey}`]: value }));
  };

  const handleComentarioSubmit = async (projectId: string, faseKey: string) => {
    if (!comentarioInput[`${projectId}-${faseKey}`]?.trim()) return;

    try {
      await addCommentToPhase(projectId, faseKey, {
        texto: comentarioInput[`${projectId}-${faseKey}`],
        autor: user?.full_name || user?.email || 'Cliente',
        tipo: 'cliente'
      });
      
      setComentarioInput(prev => ({ ...prev, [`${projectId}-${faseKey}`]: '' }));
      toast({ title: 'Comentario enviado', description: 'Tu comentario fue guardado y el admin será notificado.' });
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo enviar el comentario.', variant: 'destructive' });
    }
  };

  // Función para crear nuevo proyecto
  const handleCreateProject = () => {
    navigate('/proyectos/nuevo');
  };

  // Función para ver detalles del proyecto
  const handleViewProject = (project: Project) => {
    if (project && project.id) {
      setSelectedProject(project);
      setIsModalOpen(true);
      setModalInitialized(true);
    } else {
      console.warn('Proyecto inválido:', project);
      toast({ 
        title: 'Error', 
        description: 'No se pudo cargar la información del proyecto.', 
        variant: 'destructive' 
      });
    }
  };

  // Función para cerrar modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProject(null);
    setModalInitialized(false);
  };

  // Función para descargar archivos
  const handleDownloadFile = (fileUrl: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Función para calcular progreso del proyecto
  const calculateProjectProgress = (project: Project) => {
    if (!project || !project.fases || project.fases.length === 0) return 0;
    const completedPhases = project.fases.filter(fase => fase.estado === 'Terminado').length;
    return (completedPhases / project.fases.length) * 100;
  };

  // Función para obtener el estado general del proyecto
  const getProjectStatus = (project: Project) => {
    if (!project || !project.fases || project.fases.length === 0) return 'Pendiente';
    if (project.fases.every(fase => fase.estado === 'Terminado')) return 'Completado';
    if (project.fases.some(fase => fase.estado === 'En Progreso')) return 'En Progreso';
    return 'Pendiente';
  };

  // Función para formatear fecha
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Fecha no disponible';
    try {
      return new Date(dateString).toLocaleDateString('es-ES');
    } catch {
      return 'Fecha inválida';
    }
  };

  const getProjectProgress = (project: Project) => {
    if (!project || !project.fases || project.fases.length === 0) return 0;
    const completed = project.fases.filter((f: ProjectPhase) => f.estado === 'Terminado').length;
    return (completed / project.fases.length) * 100;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completado': return 'bg-green-100 text-green-800 border-green-200';
      case 'En Progreso': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Función para actualizar datos en tiempo real
  const refreshData = async () => {
    setLastUpdate(new Date());
    toast({ title: 'Actualizado', description: 'Datos actualizados correctamente.' });
  };

  // Si es admin, redirigir al panel de admin
  if (user?.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  // Mostrar loading mientras se cargan los datos
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 text-lg">Cargando proyectos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30">
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto">
          
          {/* Header Superior para Clientes */}
          <div className="bg-white border-b border-slate-200/50 shadow-lg">
            <div className="px-8 py-6 flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-slate-800">
                  Mi Dashboard
                </h1>
                <p className="text-slate-600 text-base font-medium mt-1">
                  Gestiona y revisa el progreso de tus proyectos web
                </p>
                <div className="text-slate-500 text-sm flex items-center space-x-2 mt-2">
                  <Clock size={16} />
                  <span>Última actualización: {lastUpdate.toLocaleTimeString()}</span>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                {/* Barra de búsqueda */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                  <Input
                    placeholder="Buscar proyectos..."
                    className="pl-10 w-64 bg-slate-50 border-slate-200 text-slate-700 placeholder-slate-400"
                  />
                </div>
                
                {/* Notificación */}
                <div className="relative">
                  <Button variant="ghost" size="sm" className="relative p-2">
                    <Bell className="h-5 w-5 text-slate-600" />
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      10
                    </span>
                  </Button>
                </div>
                
                {/* Botón actualizar */}
                <Button
                  onClick={refreshData}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all duration-300 shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Actualizar
                </Button>
                
                {/* Avatar del usuario */}
                <Avatar className="h-10 w-10 border-2 border-slate-200">
                  <AvatarImage src={user?.avatar_url} alt={user?.full_name || user?.email} />
                  <AvatarFallback className="bg-slate-100 text-slate-700">
                    {user?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
          </div>

          {/* Cards de Estadísticas Principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 px-8 py-6">
            
            {/* Card Usuarios */}
            <div className="relative group cursor-pointer">
              <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-slate-200/50 backdrop-blur-sm overflow-hidden bg-gradient-to-br from-blue-50 via-blue-25 to-indigo-50">
                <div className="flex items-center justify-center w-14 h-14 rounded-2xl mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300 bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                  <Users size={28} />
                </div>
                <div className="text-4xl font-bold text-slate-800 mb-2 group-hover:scale-105 transition-transform duration-300">
                  {hasValidProjects ? userProjects.length : 0}
                </div>
                <div className="text-lg font-semibold text-slate-600 mb-1">
                  Proyectos Activos
                </div>
                <div className="text-sm text-slate-500 flex items-center space-x-1">
                  <span className="text-green-600 font-semibold">
                    {userProjects.filter(p => getProjectStatus(p) === 'En Progreso').length}
                  </span>
                  <span>en progreso</span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-all duration-1000"></div>
              </div>
            </div>

            {/* Card Proyectos */}
            <div className="relative group cursor-pointer">
              <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-slate-200/50 backdrop-blur-sm overflow-hidden bg-gradient-to-br from-emerald-50 via-emerald-25 to-teal-50">
                <div className="flex items-center justify-center w-14 h-14 rounded-2xl mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
                  <FileText size={28} />
                </div>
                <div className="text-4xl font-bold text-slate-800 mb-2 group-hover:scale-105 transition-transform duration-300">
                  {userProjects.filter(p => getProjectStatus(p) === 'En Progreso').length}
                </div>
                <div className="text-lg font-semibold text-slate-600 mb-1">
                  En Progreso
                </div>
                <div className="text-sm text-slate-500 flex items-center space-x-1">
                  <span className="text-blue-600 font-semibold">
                    {userProjects.filter(p => getProjectStatus(p) === 'Pendiente').length}
                  </span>
                  <span>pendientes</span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-all duration-1000"></div>
              </div>
            </div>

            {/* Card Tickets */}
            <div className="relative group cursor-pointer">
              <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-slate-200/50 backdrop-blur-sm overflow-hidden bg-gradient-to-br from-amber-50 via-amber-25 to-orange-50">
                <div className="flex items-center justify-center w-14 h-14 rounded-2xl mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300 bg-gradient-to-br from-amber-500 to-amber-600 text-white">
                  <MessageSquare size={28} />
                </div>
                <div className="text-4xl font-bold text-slate-800 mb-2 group-hover:scale-105 transition-transform duration-300">
                  {userProjects.reduce((acc, p) => 
                    acc + (p.fases?.reduce((sum: number, f: ProjectPhase) => 
                      sum + (f.comentarios?.length || 0), 0) || 0), 0
                  )}
                </div>
                <div className="text-lg font-semibold text-slate-600 mb-1">
                  Comentarios
                </div>
                <div className="text-sm text-slate-500 flex items-center space-x-1">
                  <span className="text-blue-600 font-semibold">
                    {userProjects.filter(p => getProjectStatus(p) === 'Completado').length}
                  </span>
                  <span>completados</span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-all duration-1000"></div>
              </div>
            </div>

            {/* Card Progreso */}
            <div className="relative group cursor-pointer">
              <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-slate-200/50 backdrop-blur-sm overflow-hidden bg-gradient-to-br from-violet-50 via-violet-25 to-purple-50">
                <div className="flex items-center justify-center w-14 h-14 rounded-2xl mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300 bg-gradient-to-br from-violet-500 to-violet-600 text-white">
                  <TrendingUp size={28} />
                </div>
                <div className="text-4xl font-bold text-slate-800 mb-2 group-hover:scale-105 transition-transform duration-300">
                  {hasValidProjects ? Math.round(userProjects.reduce((acc, p) => acc + getProjectProgress(p), 0) / userProjects.length) : 0}%
                </div>
                <div className="text-lg font-semibold text-slate-600 mb-1">
                  Progreso General
                </div>
                <div className="text-sm text-slate-500 flex items-center space-x-1">
                  <span className="text-green-600 font-semibold">
                    {userProjects.filter(p => getProjectStatus(p) === 'Completado').length}
                  </span>
                  <span>finalizados</span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-all duration-1000"></div>
              </div>
            </div>
          </div>

          {/* Contenido Principal */}
          <div className="px-8 py-6 space-y-6">

            {/* Vista de proyectos */}
            {!hasValidProjects ? (
              <div className="bg-white rounded-2xl p-12 text-center shadow-lg border border-slate-200/50">
                <div className="space-y-4">
                  <div className="text-4xl sm:text-6xl">🚀</div>
                  <h3 className="text-lg sm:text-xl font-semibold text-slate-800">{t('No tienes proyectos aún')}</h3>
                  <p className="text-slate-600 text-sm sm:text-base">
                    {t('Comienza creando tu primer proyecto web y verás el progreso en tiempo real.')}
                  </p>
                  <Button 
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all duration-300 shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
                    onClick={() => navigate('/proyectos/nuevo')}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {t('Crear mi primer proyecto')}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {userProjects.filter(project => project && project.id).map(project => {
                  const progress = getProjectProgress(project);
                  const status = getProjectStatus(project);
                  
                  return (
                    <Card
                      key={project.id}
                      className="relative bg-white border border-slate-200/50 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer hover:scale-[1.01]"
                      onClick={() => {
                        if (project && project.id) {
                          navigate(`/proyectos/${project.id}`);
                        } else {
                          toast({ 
                            title: 'Error', 
                            description: 'Proyecto inválido', 
                            variant: 'destructive' 
                          });
                        }
                      }}
                    >
                      {/* Barra superior de gradiente animado */}
                      <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 animate-gradient-x rounded-t-2xl" />
                      <CardHeader>
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                              <CardTitle className="text-xl sm:text-2xl font-bold text-slate-800">{project.name || 'Proyecto sin nombre'}</CardTitle>
                              <div className="flex flex-wrap gap-2">
                                <Badge className={getStatusColor(status)}>{status}</Badge>
                                <Badge variant="outline" className="border-slate-300 text-slate-600">{project.type || 'Sin tipo'}</Badge>
                              </div>
                            </div>
                            <p className="text-slate-600 text-sm sm:text-base">{project.description || 'Sin descripción'}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={e => { 
                                e.stopPropagation(); 
                                if (project && project.id) {
                                  handleViewProject(project);
                                } else {
                                  toast({ 
                                    title: 'Error', 
                                    description: 'Proyecto inválido', 
                                    variant: 'destructive' 
                                  });
                                }
                              }}
                              className="border-slate-300 text-slate-700 hover:bg-slate-50 transition-all duration-200 hover:scale-105"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              {t('Ver Detalles')}
                            </Button>
                            
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={e => { 
                                e.preventDefault();
                                e.stopPropagation(); 
                                console.log('Botón Colaborar clickeado, proyecto:', project);
                                console.log('Proyecto ID:', project?.id);
                                console.log('Usuario actual:', user);
                                
                                if (project && project.id) {
                                  const url = `/proyectos/${project.id}/colaboracion-cliente`;
                                  console.log('Navegando a:', url);
                                  try {
                                    navigate(url);
                                    console.log('Navegación exitosa');
                                  } catch (error) {
                                    console.error('Error en navegación:', error);
                                    toast({ 
                                      title: 'Error de navegación', 
                                      description: 'No se pudo navegar a la página de colaboración', 
                                      variant: 'destructive' 
                                    });
                                  }
                                } else {
                                  console.error('Proyecto inválido:', project);
                                  toast({ 
                                    title: 'Error', 
                                    description: 'Proyecto inválido', 
                                    variant: 'destructive' 
                                  });
                                }
                              }}
                              onMouseDown={e => e.stopPropagation()}
                              onMouseUp={e => e.stopPropagation()}
                              className="border-slate-300 text-slate-700 hover:bg-slate-50 transition-all duration-200 hover:scale-105"
                            >
                              <Users className="h-4 w-4 mr-1" />
                              Colaborar
                            </Button>
                          </div>
                        </div>

                        {/* Barra de progreso */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-600">{t('Progreso general')}</span>
                            <span className="text-slate-700 font-medium">{Math.round(progress)}%</span>
                          </div>
                          <Progress value={progress} className="h-2" />
                        </div>
                      </CardHeader>
                      
                      <CardContent>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                          {(project.fases || []).filter(fase => fase && fase.key).map((fase: ProjectPhase) => {
                            const faseConfig = FASES.find(f => f.key === fase.key);
                            return (
                              <Card
                                key={fase.key}
                                className="relative bg-white border border-slate-200/50 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
                              >
                                {/* Barra superior de gradiente animado según estado */}
                                <div className={`absolute top-0 left-0 w-full h-1.5 rounded-t-2xl animate-gradient-x ${
                                  fase.estado === 'Terminado'
                                    ? 'bg-gradient-to-r from-green-400 via-blue-500 to-blue-700'
                                    : fase.estado === 'En Progreso'
                                    ? 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500'
                                    : 'bg-gradient-to-r from-gray-500 via-blue-500 to-blue-700'
                                }`} />
                                <CardHeader className="pb-3">
                                  <div className="flex items-center justify-between">
                                    <CardTitle className="text-base font-semibold flex items-center gap-2 text-slate-800">
                                      {/* Icono animado según estado */}
                                      {fase.estado === 'Terminado' && (
                                        <svg className="w-6 h-6 text-green-400 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                      )}
                                      {fase.estado === 'En Progreso' && (
                                        <svg className="w-6 h-6 text-blue-400 animate-spin-slow" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" /><path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" className="opacity-75" /></svg>
                                      )}
                                      {fase.estado === 'Pendiente' && (
                                        <svg className="w-6 h-6 text-gray-400 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3" /></svg>
                                      )}
                                      <span>{faseConfig?.icon || '📋'}</span>
                                      {faseConfig?.label || fase.descripcion || 'Fase'}
                                    </CardTitle>
                                    <Badge 
                                      variant="outline" 
                                      className={
                                        fase.estado === 'Terminado' ? 'bg-green-100 text-green-800 border-green-200' :
                                        fase.estado === 'En Progreso' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                                        'bg-gray-100 text-gray-800 border-gray-200'
                                      }
                                    >
                                      {fase.estado || 'Pendiente'}
                                    </Badge>
                                  </div>
                                  {fase.descripcion && (
                                    <p className="text-xs text-slate-500">{fase.descripcion}</p>
                                  )}
                                  {fase.fechaEntrega && (
                                    <div className="flex items-center gap-1 text-xs text-slate-500">
                                      <Calendar className="h-3 w-3" />
                                      {t('Entrega:')} {formatDateSafe(fase.fechaEntrega)}
                                    </div>
                                  )}
                                </CardHeader>

                                <CardContent className="space-y-3">
                                  {/* Archivos */}
                                  {fase.archivos && fase.archivos.length > 0 && (
                                    <div className="space-y-2">
                                      <Label className="text-xs font-medium text-slate-700">{t('Archivos')}</Label>
                                      <div className="flex flex-wrap gap-2">
                                        {fase.archivos.filter(file => file && file.url && file.name).map((file, idx: number) => (
                                          <div key={idx} className="flex items-center gap-1 p-2 bg-slate-50 rounded text-xs border border-slate-200">
                                            <FileText className="h-3 w-3 text-slate-500" />
                                            <a 
                                              href={file.url} 
                                              target="_blank" 
                                              rel="noopener noreferrer"
                                              className="text-blue-600 hover:underline"
                                              onClick={(e) => e.stopPropagation()}
                                            >
                                              {file.name || 'Archivo sin nombre'}
                                            </a>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Comentarios */}
                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                      <Label className="text-xs font-medium text-slate-700">
                                        {t('Comentarios')} ({(fase.comentarios || []).filter(c => c && c.id).length})
                                      </Label>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setComentarioInput(prev => ({ ...prev, [`${project.id}-${fase.key}`]: '' }))}
                                        className="border-slate-300 text-slate-700 hover:bg-slate-50 transition-all duration-200 hover:scale-105"
                                      >
                                        <MessageSquare className="h-3 w-3 mr-1" />
                                        {t('Comentar')}
                                      </Button>
                                    </div>

                                    {/* Formulario de comentario */}
                                    {comentarioInput[`${project.id}-${fase.key}`] !== undefined && (
                                      <div className="space-y-2">
                                        <Textarea
                                          value={comentarioInput[`${project.id}-${fase.key}`] || ''}
                                          onChange={e => handleComentarioChange(project.id, fase.key, e.target.value)}
                                          placeholder={t('Escribe tu comentario...')}
                                          className="min-h-[60px] text-xs border-slate-200 text-slate-700 placeholder-slate-400"
                                        />
                                        <div className="flex gap-2">
                                          <Button
                                            size="sm"
                                            onClick={() => handleComentarioSubmit(project.id, fase.key)}
                                            disabled={!comentarioInput[`${project.id}-${fase.key}`]?.trim()}
                                            className="bg-blue-600 hover:bg-blue-700 text-white"
                                          >
                                            {t('Enviar')}
                                          </Button>
                                          <Button 
                                            variant="outline" 
                                            size="sm"
                                            onClick={() => setComentarioInput(prev => ({ ...prev, [`${project.id}-${fase.key}`]: undefined }))}
                                            className="border-slate-300 text-slate-700 hover:bg-slate-50"
                                          >
                                            {t('Cancelar')}
                                          </Button>
                                        </div>
                                      </div>
                                    )}

                                    {/* Lista de comentarios */}
                                    <div className="space-y-2 max-h-32 overflow-y-auto">
                                      {(fase.comentarios || []).filter(comentario => comentario && comentario.id).map((comentario) => (
                                        <div
                                          key={comentario.id}
                                          className={`p-2 rounded text-xs ${
                                            comentario.tipo === 'admin' 
                                              ? 'bg-blue-50 border border-blue-200' 
                                              : 'bg-slate-50 border border-slate-200'
                                          }`}
                                        >
                                          <div className="flex items-center justify-between mb-1">
                                            <span className="font-medium text-slate-800">
                                              {comentario.autor || 'Usuario anónimo'}
                                            </span>
                                            <span className="text-slate-500">
                                              {formatDateSafe(comentario.fecha)}
                                            </span>
                                          </div>
                                          <p className="text-slate-700">{comentario.texto || 'Comentario sin texto'}</p>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Modal de detalle del proyecto */}
            {isModalOpen && modalInitialized && selectedProject && selectedProject.id && hasValidProjects && (
              <VerDetallesProyecto
                proyecto={selectedProject}
                onClose={() => {
                  setIsModalOpen(false);
                  setSelectedProject(null);
                  setModalInitialized(false);
                }}
                onUpdate={(updatedProject) => {
                  // Actualizar el proyecto en el estado local
                  setRealTimeProjects(prev => 
                    prev.map(p => p.id === updatedProject.id ? updatedProject : p)
                  );
                  updateProject(updatedProject.id, updatedProject);
                }}
              />
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
