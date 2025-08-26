import { useState, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Search, 
  Filter, 
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
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import SearchAndFilters from '@/components/SearchAndFilters';
import AdvancedAnalytics from '@/components/AdvancedAnalytics';
import { exportProjects, exportCompleteReport } from '@/utils/exportUtils';
import { ErrorMessage } from '@/components/ErrorBoundary';
import { SectionLoading } from '@/components/LoadingSpinner';
import { useDebounce } from '@/hooks/usePerformance';

import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import ProyectosNuevoModal from './ProyectosNuevo';
import { formatDateSafe } from '@/utils/formatDateSafe';

export default function ProjectsPage() {
  const { projects, loading, error, refreshData, user } = useApp();
  const navigate = useNavigate();
  const [filteredProjects, setFilteredProjects] = useState(projects);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<string>('updatedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showNuevoModal, setShowNuevoModal] = useState(false);

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Mostrar solo proyectos del cliente, o todos si es admin
  const visibleProjects = user.role === 'admin'
    ? projects
    : projects.filter(p => p.ownerEmail === user.email);

  // Actualizar proyectos filtrados cuando cambien los proyectos o el usuario
  useEffect(() => {
    setFilteredProjects(visibleProjects);
  }, [projects, user]);

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
      case 'Completado': return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'En progreso avanzado': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'En progreso': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'Sin iniciar': return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
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
  const handleExport = (projectsToExport: any[]) => {
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
  };

  // Función para exportar reporte completo
  const handleExportReport = () => {
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
  };

  // Función para ver detalles del proyecto
  const handleViewProject = (project: any) => {
    setSelectedProject(project);
    setShowProjectModal(true);
  };

  // Función para eliminar proyecto
  const handleDeleteProject = async (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;
    if (user.role !== 'admin' && project.ownerEmail !== user.email) {
      toast({
        title: 'Sin permisos',
        description: 'Solo el dueño o un admin puede borrar este proyecto.',
        variant: 'destructive'
      });
      return;
    }
    if (confirm('¿Estás seguro de que quieres eliminar este proyecto? Esta acción no se puede deshacer.')) {
      try {
        await deleteDoc(doc(firestore, 'projects', projectId));
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
  };

  if (loading) return <SectionLoading />;
  if (error) return <ErrorMessage error={error} onRetry={refreshData} />;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Mis Proyectos</h1>
          <p className="text-muted-foreground">
            Gestiona y monitorea todos tus proyectos en un solo lugar
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowAnalytics(!showAnalytics)}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Análisis
          </Button>
          <Button
            variant="outline"
            onClick={handleExportReport}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar Reporte
          </Button>
          <Button onClick={() => setShowNuevoModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Proyecto
          </Button>
        </div>
      </div>

      {/* Análisis avanzado */}
      {showAnalytics && (
        <Card>
          <CardHeader>
            <CardTitle>Análisis Avanzado</CardTitle>
          </CardHeader>
          <CardContent>
            <AdvancedAnalytics />
          </CardContent>
        </Card>
      )}

      {/* Búsqueda y filtros */}
      <SearchAndFilters
        projects={projects}
        onFilteredProjects={setFilteredProjects}
        onExport={handleExport}
        onRefresh={refreshData}
      />

      {/* Controles de vista */}
                  <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid className="h-4 w-4" />
                    </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
                    </Button>
                  </div>
        <div className="text-sm text-muted-foreground">
          Mostrando {filteredProjects.length} de {projects.length} proyectos
            </div>
      </div>

      {/* Lista de proyectos */}
      {filteredProjects.length === 0 ? (
        <Card>
          <CardContent className="pt-12 text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No hay proyectos</h3>
            <p className="text-muted-foreground mb-4">
              {projects.length === 0 
                ? 'Comienza creando tu primer proyecto'
                : 'No se encontraron proyectos con los filtros aplicados'
              }
            </p>
            {projects.length === 0 && (
              <Button onClick={() => setShowNuevoModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Crear primer proyecto
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
          {filteredProjects.map((project) => {
            const progress = calculateProjectProgress(project);
            const status = getProjectStatus(project);
            const totalComments = project.fases?.reduce((total: number, fase: any) => 
              total + (fase.comentarios?.length || 0), 0) || 0;

            return (
              <Card key={project.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">{project.name}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {project.description}
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
                              onClick={() => navigate(`/proyectos/${project.id}`)}
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
                              className="text-red-500 hover:text-red-700"
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
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Estado y progreso */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className={getStatusColor(status)}>
                        {getStatusIcon(status)}
                        <span className="ml-1">{status}</span>
                      </Badge>
                      <span className="text-sm font-medium">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>

                  {/* Información del proyecto */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Tipo:</span>
                      <p className="font-medium">{project.type}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Funcionalidades:</span>
                      <p className="font-medium">{project.funcionalidades?.length || 0}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Fases:</span>
                      <p className="font-medium">
                        {project.fases?.filter((f: any) => f.estado === 'Terminado').length || 0}/
                        {project.fases?.length || 0}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Comentarios:</span>
                      <p className="font-medium flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        {totalComments}
                      </p>
                    </div>
                  </div>

                  {/* Fechas */}
                  <div className="text-xs text-muted-foreground space-y-1">
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
                       className="flex-1"
                       onClick={() => handleViewProject(project)}
                     >
                       <Eye className="h-4 w-4 mr-2" />
                       Ver detalles
                     </Button>
                     <Button
                       variant="outline"
                       size="sm"
                       className="flex-1"
                       onClick={() => navigate(`/proyectos/${project.id}/colaboracion`)}
                     >
                       <Users className="h-4 w-4 mr-2" />
                       Colaborar
                     </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal de detalles del proyecto */}
      <Dialog open={showProjectModal} onOpenChange={setShowProjectModal}>
        <DialogContent className="max-w-3xl w-full bg-zinc-900/95 rounded-2xl shadow-2xl border border-zinc-800 p-0 overflow-hidden">
          {selectedProject && (
            <div className="flex flex-col md:flex-row">
              {/* Lado izquierdo: Info principal */}
              <div className="flex-1 p-6 space-y-6 min-w-[260px]">
                <div className="flex items-center gap-4 mb-4">
                  <div className="bg-primary/20 rounded-full p-3">
                    <FileText className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold leading-tight">{selectedProject.name}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className={getStatusColor(getProjectStatus(selectedProject)) + ' text-xs'}>
                        {getProjectStatus(selectedProject)}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{selectedProject.type}</span>
                    </div>
                  </div>
                </div>
                <div className="mb-2">
                  <h4 className="font-semibold text-sm mb-1 flex items-center gap-2"><MessageSquare className="h-4 w-4" /> Descripción</h4>
                  <p className="text-sm text-muted-foreground">{selectedProject.description || <span className="italic">Sin descripción</span>}</p>
                </div>
                <div className="mb-2">
                  <h4 className="font-semibold text-sm mb-1 flex items-center gap-2"><BarChart3 className="h-4 w-4" /> Progreso</h4>
                  <div className="flex items-center gap-2">
                    <Progress value={calculateProjectProgress(selectedProject)} className="h-2 flex-1" />
                    <span className="text-xs font-medium">{calculateProjectProgress(selectedProject)}%</span>
                  </div>
                </div>
                <div className="mb-2">
                  <h4 className="font-semibold text-sm mb-1 flex items-center gap-2"><Users className="h-4 w-4" /> Funcionalidades</h4>
                  <div className="flex flex-wrap gap-2">
                    {(selectedProject.funcionalidades && selectedProject.funcionalidades.length > 0)
                      ? selectedProject.funcionalidades.map((f: string, i: number) => (
                        <Badge key={i} variant="secondary">{f}</Badge>
                      ))
                      : <span className="text-xs text-muted-foreground italic">Sin funcionalidades</span>
                    }
                  </div>
                </div>
                <div className="mb-2">
                  <h4 className="font-semibold text-sm mb-1 flex items-center gap-2"><Calendar className="h-4 w-4" /> Fechas</h4>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Creado: {formatDateSafe(selectedProject.createdAt)}</div>
                    <div className="flex items-center gap-1"><Clock className="h-3 w-3" /> Actualizado: {formatDateSafe(selectedProject.updatedAt)}</div>
                  </div>
                </div>
                <div className="flex gap-2 mt-6">
                  <Button variant="outline" className="flex-1" onClick={() => navigate(`/proyectos/${selectedProject.id}/colaboracion`)}>
                    <Users className="h-4 w-4 mr-2" /> Colaborar
                  </Button>
                  <Button variant="outline" className="flex-1" onClick={() => navigate(`/proyectos/${selectedProject.id}`)}>
                    <Edit className="h-4 w-4 mr-2" /> Editar
                  </Button>
                </div>
              </div>
              {/* Lado derecho: Fases y comentarios */}
              <div className="flex-1 bg-zinc-950/90 p-6 space-y-6 min-w-[260px] border-l border-zinc-800">
                <h4 className="font-semibold text-base mb-2 flex items-center gap-2"><CheckSquare className="h-4 w-4" /> Fases del proyecto</h4>
                <div className="space-y-3 max-h-56 overflow-y-auto pr-2">
                  {selectedProject.fases && selectedProject.fases.length > 0 ? (
                    selectedProject.fases.map((fase: any, index: number) => (
                      <div key={fase.key} className="border rounded-lg p-3 bg-zinc-900/80">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" /> {fase.descripcion}</span>
                          <Badge variant="outline" className={getStatusColor(fase.estado)}>{fase.estado}</Badge>
                        </div>
                        {fase.fechaEntrega && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                            <Calendar className="h-3 w-3" /> Entrega: {formatDateSafe(fase.fechaEntrega)}
                          </div>
                        )}
                        {fase.comentarios && fase.comentarios.length > 0 && (
                          <div className="mt-2">
                            <h6 className="text-xs font-medium mb-1 flex items-center gap-1"><MessageSquare className="h-3 w-3" /> Comentarios ({fase.comentarios.length})</h6>
                            <div className="space-y-1 max-h-20 overflow-y-auto">
                              {fase.comentarios.map((comentario: any, idx: number) => (
                                <div key={idx} className="flex items-start gap-2 bg-zinc-800/80 p-2 rounded">
                                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                                    <User className="h-4 w-4 text-primary" />
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="font-medium text-xs">{comentario.autor}</span>
                                      <span className="text-xs text-muted-foreground">{formatDateSafe(comentario.fecha)}</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground">{comentario.texto}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-muted-foreground italic">Sin fases registradas</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ProyectosNuevoModal
        open={showNuevoModal}
        onClose={() => {
          setShowNuevoModal(false);
          refreshData();
        }}
      />
    </div>
  );
}
