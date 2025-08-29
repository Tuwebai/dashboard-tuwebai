import { useState, useEffect, useCallback } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { supabase } from '@/lib/supabase';
import { 
  Plus, 
  Download, 
  BarChart3, 
  Grid, 
  List,
  Eye,
  Edit,
  Trash2,
  MessageSquare,
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  Play,
  Pause,
  FileText,
  Users,
  CheckSquare,
  User
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import SearchAndFilters from '@/components/SearchAndFilters';

import { exportProjects, exportCompleteReport } from '@/utils/exportUtils';
import { ErrorMessage } from '@/components/ErrorBoundary';
import { SectionLoading } from '@/components/LoadingSpinner';
import { useDebounce } from '@/hooks/usePerformance';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import ProyectosNuevo from './ProyectosNuevo';
import { formatDateSafe } from '@/utils/formatDateSafe';
import { userService } from '@/lib/supabaseService';

export default function ProjectsPage() {
  const { projects, loading, error, refreshData, user } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [filteredProjects, setFilteredProjects] = useState(projects);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<string>('updatedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showNuevoModal, setShowNuevoModal] = useState(false);
  const [projectCreators, setProjectCreators] = useState<Record<string, { full_name: string; email: string }>>({});

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Mostrar solo proyectos del cliente, o todos si es admin
  const visibleProjects = user.role === 'admin'
    ? projects
    : projects.filter(p => p.created_by === user.id);

  // Actualizar proyectos filtrados cuando cambien los proyectos o el usuario
  useEffect(() => {
    setFilteredProjects(visibleProjects);
  }, [visibleProjects]);

  // Función para manejar proyectos filtrados desde SearchAndFilters
  const handleFilteredProjects = useCallback((filtered: any[]) => {
    setFilteredProjects(filtered);
  }, []);

  // Limpiar estado cuando se desmonte el componente
  useEffect(() => {
    return () => {
      setFilteredProjects([]);
      setSelectedProject(null);
      setShowProjectModal(false);
      setSearchTerm('');
      setSortBy('updatedAt');
      setSortOrder('desc');
      setShowNuevoModal(false);
    };
  }, []);

  // SOLUCIÓN NUCLEAR: Forzar re-renderizado cuando cambie la ruta
  useEffect(() => {
    const handleRouteChange = () => {
      // Forzar re-renderizado del componente
      setFilteredProjects([...filteredProjects]);
    };

    // Escuchar cambios de ruta
    window.addEventListener('popstate', handleRouteChange);
    
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, [filteredProjects]);





  // Función para calcular progreso del proyecto
  const calculateProjectProgress = (project: any) => {
    if (!project.fases || project.fases.length === 0) return 0;
    const completedPhases = project.fases.filter((f: any) => f.estado === 'Terminado').length;
    return Math.round((completedPhases / project.fases.length) * 100);
  };

  // Función para obtener el estado del proyecto
  const getProjectStatus = (project: any) => {
    if (!project.fases || project.fases.length === 0) return 'Sin iniciar';
    
    const completedPhases = project.fases.filter((f: any) => f.estado === 'Terminado').length;
    const totalPhases = project.fases.length;
    
    if (completedPhases === 0) return 'Sin iniciar';
    if (completedPhases === totalPhases) return 'Completado';
    if (completedPhases > totalPhases / 2) return 'En progreso avanzado';
    return 'En progreso';
  };

  // Función para obtener el color del estado
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completado': return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'En progreso avanzado': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'En progreso': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      case 'Sin iniciar': return 'bg-slate-500/10 text-slate-600 border-slate-500/20';
      default: return 'bg-slate-500/10 text-slate-600 border-slate-500/20';
    }
  };

  // Función para obtener el icono del estado
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completado': return <CheckCircle className="h-4 w-4" />;
      case 'En progreso avanzado': return <Play className="h-4 w-4" />;
      case 'En progreso': return <Pause className="h-4 w-4" />;
      case 'Sin iniciar': return <Clock className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  // Función para exportar proyectos
  const handleExport = useCallback((projectsToExport: any[]) => {
    try {
      exportProjects(projectsToExport);
      toast({
        title: 'Exportación exitosa',
        description: 'Los proyectos han sido exportados correctamente.'
      });
    } catch (error) {
      toast({
        title: 'Error en la exportación',
        description: 'No se pudieron exportar los proyectos.',
        variant: 'destructive'
      });
    }
  }, []);

  // Función para exportar reporte completo
  const handleExportReport = useCallback(() => {
    try {
      exportCompleteReport(user, projects);
      toast({
        title: 'Reporte exportado',
        description: 'El reporte completo ha sido exportado correctamente.'
      });
    } catch (error) {
      toast({
        title: 'Error en la exportación',
        description: 'No se pudo exportar el reporte.',
        variant: 'destructive'
      });
    }
  }, [user, projects]);

  // Funciones para cambio de vista
  const handleViewModeGrid = useCallback(() => setViewMode('grid'), []);
  const handleViewModeList = useCallback(() => setViewMode('list'), []);

  // Funciones para modales
  const handleOpenNuevoModal = useCallback(() => setShowNuevoModal(true), []);
  const handleCloseNuevoModal = useCallback(() => setShowNuevoModal(false), []);

  // Funciones de navegación
  const handleNavigateToEdit = useCallback((projectId: string) => navigate(`/proyectos/${projectId}`), [navigate]);
  const handleNavigateToCollaboration = useCallback((projectId: string) => navigate(`/proyectos/${projectId}/colaboracion`), [navigate]);

  // Función para ver detalles del proyecto
  const handleViewProject = useCallback((project: any) => {
    setSelectedProject(project);
    setShowProjectModal(true);
  }, []);

    // Función para eliminar proyecto
  const handleDeleteProject = useCallback(async (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;
    if (user.role !== 'admin' && project.created_by !== user.id) {
      toast({
        title: 'Sin permisos',
        description: 'Solo el dueño o un admin puede borrar este proyecto.',
        variant: 'destructive'
      });
      return;
    }
    if (confirm('¿Estás seguro de que quieres eliminar este proyecto? Esta acción no se puede deshacer.')) {
      try {
        const { error } = await supabase
          .from('projects')
          .delete()
          .eq('id', projectId);
        
        if (error) throw error;
        
        toast({
          title: 'Proyecto eliminado',
          description: 'El proyecto ha sido eliminado correctamente.'
        });
        await refreshData();
      } catch (error) {
        toast({
          title: 'Error',
          description: 'No se pudo eliminar el proyecto.',
          variant: 'destructive'
      });
      }
    }
  }, [projects, user.role, user.email, refreshData]);

  if (loading) return <SectionLoading />;
  if (error) return <ErrorMessage error={error} onRetry={refreshData} />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30">
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header con diseño claro */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200/50">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-800">Mis Proyectos</h1>
              <p className="text-slate-600 mt-2">
                Gestiona y monitorea todos tus proyectos en un solo lugar
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="outline"
                onClick={handleExportReport}
                className="border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar Reporte
              </Button>
              <Button 
                onClick={handleOpenNuevoModal}
                className="bg-gradient-to-r from-blue-500 via-purple-600 to-fuchsia-600 hover:from-blue-600 hover:to-fuchsia-700 shadow-lg text-white font-medium"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Proyecto
              </Button>
            </div>
          </div>
        </div>



        {/* Búsqueda y filtros */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200/50">
          <SearchAndFilters
            projects={visibleProjects}
            onFilteredProjects={handleFilteredProjects}
            onExport={handleExport}
            onRefresh={refreshData}
          />
        </div>

        {/* Controles de vista */}
        <div className="bg-white rounded-2xl p-4 shadow-lg border border-slate-200/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={handleViewModeGrid}
                className={viewMode === 'grid' ? 'bg-blue-500 hover:bg-blue-600' : 'border-slate-300 text-slate-700 hover:bg-slate-50'}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={handleViewModeList}
                className={viewMode === 'list' ? 'bg-blue-500 hover:bg-blue-600' : 'border-slate-300 text-slate-700 hover:bg-slate-50'}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
            <div className="text-sm text-slate-600">
              Mostrando {filteredProjects.length} de {projects.length} proyectos
            </div>
          </div>
        </div>

        {/* Lista de proyectos */}
        {filteredProjects.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-lg border border-slate-200/50">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-slate-800">No hay proyectos</h3>
            <p className="text-slate-600 mb-4">
              {projects.length === 0 
                ? 'Comienza creando tu primer proyecto'
                : 'No se encontraron proyectos con los filtros aplicados'
              }
            </p>
            {projects.length === 0 && (
              <Button 
                onClick={handleOpenNuevoModal}
                className="bg-gradient-to-r from-blue-500 via-purple-600 hover:to-fuchsia-700 shadow-lg text-white font-medium"
              >
                <Plus className="h-4 w-4 mr-2" />
                Crear primer proyecto
              </Button>
            )}
          </div>
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
            {filteredProjects.map((project) => {
              const progress = calculateProjectProgress(project);
              const status = getProjectStatus(project);
              const totalComments = project.fases?.reduce((total: number, fase: any) => 
                total + (fase.comentarios?.length || 0), 0) || 0;

              return (
                <div key={project.id} className="bg-white rounded-2xl shadow-lg border border-slate-200/50 hover:shadow-xl transition-all duration-300 overflow-hidden relative">
                  {/* Barra superior de gradiente animado */}
                  <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-t-2xl" />
                  
                  <div className="p-6">
                    {/* Header del proyecto */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-bold text-slate-800 truncate mb-2">{project.name}</h3>
                        <p className="text-slate-600 text-sm line-clamp-2 mb-3">
                          {project.description || 'Sin descripción'}
                        </p>
                      </div>
                      <div className="flex gap-1 ml-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewProject(project)}
                                className="text-slate-600 hover:bg-slate-100"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Ver detalles</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleNavigateToEdit(project.id)}
                                className="text-slate-600 hover:bg-slate-100"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Editar proyecto</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteProject(project.id)}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Eliminar proyecto</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>

                    {/* Estado y progreso */}
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className={`${getStatusColor(status)} border-slate-200`}>
                          {getStatusIcon(status)}
                          <span className="ml-1">{status}</span>
                        </Badge>
                        <span className="text-sm font-medium text-slate-700">{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>

                    {/* Información del proyecto */}
                    <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                      <div>
                        <span className="text-slate-500">Tipo:</span>
                        <p className="font-medium text-slate-700">{project.type || 'Sin tipo'}</p>
                      </div>
                      <div>
                        <span className="text-slate-500">Funcionalidades:</span>
                        <p className="font-medium text-slate-700">{project.funcionalidades?.length || 0}</p>
                      </div>
                      <div>
                        <span className="text-slate-500">Fases:</span>
                        <p className="font-medium text-slate-700">
                          {project.fases?.filter((f: any) => f.estado === 'Terminado').length || 0}/
                          {project.fases?.length || 0}
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-500">Comentarios:</span>
                        <p className="font-medium flex items-center gap-1 text-slate-700">
                          <MessageSquare className="h-3 w-3" />
                          {totalComments}
                        </p>
                      </div>
                    </div>

                    {/* Fechas */}
                    <div className="text-xs text-slate-500 space-y-1 mb-4">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Creado: {formatDateSafe(project.createdAt)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Actualizado: {formatDateSafe(project.updatedAt)}
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 border-slate-300 text-slate-700 hover:bg-slate-50"
                        onClick={() => handleViewProject(project)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Ver detalles
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 border-slate-300 text-slate-700 hover:bg-slate-50"
                        onClick={() => handleNavigateToCollaboration(project.id)}
                      >
                        <Users className="h-4 w-4 mr-2" />
                        Colaborar
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal de detalles del proyecto */}
        <Dialog open={showProjectModal} onOpenChange={setShowProjectModal}>
          <DialogContent className="max-w-4xl w-full bg-white rounded-2xl shadow-2xl border border-slate-200/50 p-0 overflow-hidden">
            {selectedProject && (
              <div className="flex flex-col lg:flex-row">
                {/* Lado izquierdo: Info principal */}
                <div className="flex-1 p-6 space-y-6 min-w-[300px]">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-full p-3">
                      <FileText className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold leading-tight text-slate-800">{selectedProject.name}</h2>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className={`${getStatusColor(getProjectStatus(selectedProject))} border-slate-200 text-xs`}>
                          {getProjectStatus(selectedProject)}
                        </Badge>
                        <span className="text-xs text-slate-500">{selectedProject.type || 'Sin tipo'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="mb-2">
                    <h4 className="font-semibold text-sm mb-1 flex items-center gap-2 text-slate-700"><MessageSquare className="h-4 w-4" /> Descripción</h4>
                    <p className="text-sm text-slate-600">{selectedProject.description || <span className="italic text-slate-400">Sin descripción</span>}</p>
                  </div>
                  <div className="mb-2">
                    <h4 className="font-semibold text-sm mb-1 flex items-center gap-2 text-slate-700"><BarChart3 className="h-4 w-4" /> Progreso</h4>
                    <div className="flex items-center gap-2">
                      <Progress value={calculateProjectProgress(selectedProject)} className="h-2 flex-1" />
                      <span className="text-xs font-medium text-slate-700">{calculateProjectProgress(selectedProject)}%</span>
                    </div>
                  </div>
                  <div className="mb-2">
                    <h4 className="font-semibold text-sm mb-1 flex items-center gap-2 text-slate-700"><Users className="h-4 w-4" /> Funcionalidades</h4>
                    <div className="flex flex-wrap gap-2">
                      {(selectedProject.funcionalidades && selectedProject.funcionalidades.length > 0)
                        ? selectedProject.funcionalidades.map((f: string, i: number) => (
                          <Badge key={i} variant="secondary" className="bg-slate-100 text-slate-700 border-slate-200">{f}</Badge>
                        ))
                        : <span className="text-xs text-slate-400 italic">Sin funcionalidades</span>
                      }
                    </div>
                  </div>
                  <div className="mb-2">
                    <h4 className="font-semibold text-sm mb-1 flex items-center gap-2 text-slate-700"><Calendar className="h-4 w-4" /> Fechas</h4>
                    <div className="text-xs text-slate-500 space-y-1">
                      <div className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Creado: {formatDateSafe(selectedProject.createdAt)}</div>
                      <div className="flex items-center gap-1"><Clock className="h-3 w-3" /> Actualizado: {formatDateSafe(selectedProject.updatedAt)}</div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-6">
                    <Button variant="outline" className="flex-1 border-slate-300 text-slate-700 hover:bg-slate-50" onClick={() => handleNavigateToCollaboration(selectedProject.id)}>
                      <Users className="h-4 w-4 mr-2" /> Colaborar
                    </Button>
                    <Button variant="outline" className="flex-1 border-slate-300 text-slate-700 hover:bg-slate-50" onClick={() => handleNavigateToEdit(selectedProject.id)}>
                      <Edit className="h-4 w-4 mr-2" /> Editar
                    </Button>
                  </div>
                </div>
                {/* Lado derecho: Fases y comentarios */}
                <div className="flex-1 bg-gradient-to-br from-slate-50 to-blue-50/30 p-6 space-y-6 min-w-[300px] border-l border-slate-200/50">
                  <h4 className="font-semibold text-base mb-2 flex items-center gap-2 text-slate-700"><CheckSquare className="h-4 w-4" /> Fases del proyecto</h4>
                  <div className="space-y-3 max-h-56 overflow-y-auto pr-2">
                    {selectedProject.fases && selectedProject.fases.length > 0 ? (
                      selectedProject.fases.map((fase: any, index: number) => (
                        <div key={fase.key} className="border border-slate-200 rounded-lg p-3 bg-white shadow-sm">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium flex items-center gap-2 text-slate-700"><CheckCircle className="h-4 w-4 text-green-500" /> {fase.descripcion}</span>
                            <Badge variant="outline" className={`${getStatusColor(fase.estado)} border-slate-200`}>{fase.estado}</Badge>
                          </div>
                          {fase.fechaEntrega && (
                            <div className="flex items-center gap-1 text-xs text-slate-500 mb-1">
                              <Calendar className="h-3 w-3" /> Entrega: {formatDateSafe(fase.fechaEntrega)}
                            </div>
                          )}
                          {fase.comentarios && fase.comentarios.length > 0 && (
                            <div className="mt-2">
                              <h6 className="text-xs font-medium mb-1 flex items-center gap-1 text-slate-600"><MessageSquare className="h-3 w-3" /> Comentarios ({fase.comentarios.length})</h6>
                              <div className="space-y-1 max-h-20 overflow-y-auto">
                                {fase.comentarios.map((comentario: any, idx: number) => (
                                  <div key={idx} className="flex items-start gap-2 bg-slate-100 p-2 rounded">
                                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                                      <User className="h-4 w-4 text-blue-600" />
                                    </div>
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="font-medium text-xs text-slate-700">{comentario.autor}</span>
                                        <span className="text-xs text-slate-500">{formatDateSafe(comentario.fecha)}</span>
                                      </div>
                                      <p className="text-xs text-slate-600">{comentario.texto}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-slate-400 italic">Sin fases registradas</div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Modal de nuevo proyecto */}
        {showNuevoModal && (
          <ProyectosNuevo />
        )}
      </div>
    </div>
  );
}
