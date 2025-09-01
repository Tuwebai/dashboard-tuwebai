import React from 'react';
import { motion } from 'framer-motion';
import { Draggable } from 'react-beautiful-dnd';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  MessageSquare, 
  Calendar, 
  Clock, 
  Users, 
  User,
  CheckCircle,
  Play,
  Pause,
  AlertCircle,
  Globe,
  ShoppingCart,
  Briefcase,
  Home,
  Smartphone,
  Laptop,
  Palette,
  Code,
  Database,
  Zap,
  Copy,
  Archive,
  Star,
  MoreVertical,
  GripVertical,
  XCircle
} from 'lucide-react';
import { formatDateSafe } from '@/utils/formatDateSafe';

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
  type?: string;
  ownerEmail?: string;
  createdAt?: string;
  fases?: ProjectPhase[];
  approval_status?: 'pending' | 'approved' | 'rejected';
  approval_notes?: string;
  approved_at?: string;
}

interface ProjectCardProps {
  project: Project;
  user: any;
  projectCreators: Record<string, { full_name: string; email: string }>;
  onViewProject: (project: Project) => void;
  onNavigateToCollaboration?: (projectId: string) => void;
  onNavigateToEdit?: (projectId: string) => void;
  onDeleteProject?: (projectId: string) => void;
  onDuplicateProject?: (project: Project) => void;
  onArchiveProject?: (projectId: string) => void;
  onToggleFavorite?: (projectId: string) => void;
  showAdminActions?: boolean;
  index?: number;
  isDragDisabled?: boolean;
  dragMode?: boolean;
}

// Función para calcular progreso del proyecto
const calculateProjectProgress = (project: Project) => {
  if (!project.fases || project.fases.length === 0) return 0;
  const completedPhases = project.fases.filter((f: ProjectPhase) => f.estado === 'Terminado').length;
  return Math.round((completedPhases / project.fases.length) * 100);
};

// Función para obtener el estado del proyecto
const getProjectStatus = (project: Project) => {
  if (!project.fases || project.fases.length === 0) return 'Sin iniciar';
  
  const completedPhases = project.fases.filter((f: ProjectPhase) => f.estado === 'Terminado').length;
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
    default: return <AlertCircle className="h-4 w-4" />;
  }
};

// Función para obtener el icono contextual del tipo de proyecto
const getProjectTypeIcon = (type: string) => {
  switch (type?.toLowerCase()) {
    case 'landing page':
    case 'landing':
      return <Globe className="h-4 w-4" />;
    case 'ecommerce':
    case 'tienda online':
      return <ShoppingCart className="h-4 w-4" />;
    case 'corporativo':
    case 'empresa':
      return <Briefcase className="h-4 w-4" />;
    case 'portfolio':
    case 'portafolio':
      return <User className="h-4 w-4" />;
    case 'blog':
      return <MessageSquare className="h-4 w-4" />;
    case 'app móvil':
    case 'mobile':
      return <Smartphone className="h-4 w-4" />;
    case 'web app':
    case 'aplicación web':
      return <Laptop className="h-4 w-4" />;
    case 'diseño':
    case 'ui/ux':
      return <Palette className="h-4 w-4" />;
    case 'desarrollo':
    case 'programación':
      return <Code className="h-4 w-4" />;
    case 'base de datos':
    case 'database':
      return <Database className="h-4 w-4" />;
    case 'api':
    case 'backend':
      return <Zap className="h-4 w-4" />;
    default:
      return <Home className="h-4 w-4" />;
  }
};

// Función para obtener el color del tipo de proyecto
const getProjectTypeColor = (type: string) => {
  switch (type?.toLowerCase()) {
    case 'landing page':
    case 'landing':
      return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
    case 'ecommerce':
    case 'tienda online':
      return 'bg-green-500/10 text-green-600 border-green-500/20';
    case 'corporativo':
    case 'empresa':
      return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
    case 'portfolio':
    case 'portafolio':
      return 'bg-pink-500/10 text-pink-600 border-pink-500/20';
    case 'blog':
      return 'bg-orange-500/10 text-orange-600 border-orange-500/20';
    case 'app móvil':
    case 'mobile':
      return 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20';
    case 'web app':
    case 'aplicación web':
      return 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20';
    case 'diseño':
    case 'ui/ux':
      return 'bg-rose-500/10 text-rose-600 border-rose-500/20';
    case 'desarrollo':
    case 'programación':
      return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
    case 'base de datos':
    case 'database':
      return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
    case 'api':
    case 'backend':
      return 'bg-violet-500/10 text-violet-600 border-violet-500/20';
    default:
      return 'bg-slate-500/10 text-slate-600 border-slate-500/20';
  }
};

// Función para verificar si un proyecto está próximo a su fecha límite
const isProjectUrgent = (project: Project) => {
  if (!project.fases || project.fases.length === 0) return false;
  
  const now = new Date();
  const urgentPhases = project.fases.filter((fase: ProjectPhase) => {
    if (!fase.fechaEntrega || fase.estado === 'Terminado') return false;
    
    const deadline = new Date(fase.fechaEntrega);
    const daysUntilDeadline = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    return daysUntilDeadline <= 3 && daysUntilDeadline >= 0;
  });
  
  return urgentPhases.length > 0;
};

export default function ProjectCard({
  project,
  user,
  projectCreators,
  onViewProject,
  onNavigateToCollaboration,
  onNavigateToEdit,
  onDeleteProject,
  onDuplicateProject,
  onArchiveProject,
  onToggleFavorite,
  showAdminActions = false,
  index = 0,
  isDragDisabled = false,
  dragMode = false
}: ProjectCardProps) {
  const progress = calculateProjectProgress(project);
  const status = getProjectStatus(project);
  const totalComments = project.fases?.reduce((total: number, fase: ProjectPhase) => 
    total + (fase.comentarios?.length || 0), 0) || 0;
  const isUrgent = isProjectUrgent(project);
  const projectType = project.type || 'Sin tipo';
  const approvalStatus = project.approval_status || 'approved'; // Por defecto aprobado para proyectos existentes
  const isPendingApproval = approvalStatus === 'pending';
  const isRejected = approvalStatus === 'rejected';

  const cardContent = (
    <motion.div
      key={project.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ 
        y: -12,
        scale: 1.03,
        transition: { duration: 0.3, ease: "easeOut" }
      }}
      whileTap={{ scale: 0.97 }}
      className="w-full max-w-xs"
    >
      <div 
        className={`bg-white rounded-2xl shadow-lg border border-slate-200/50 hover:shadow-2xl hover:border-slate-300/50 hover:shadow-blue-500/10 transition-all duration-500 ease-out overflow-hidden relative w-full h-[420px] flex flex-col group ${
          isPendingApproval || isRejected ? 'cursor-default opacity-75' : 'cursor-pointer'
        } ${dragMode ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}`}
        onClick={() => !isPendingApproval && !isRejected && !dragMode && onViewProject(project)}
      >
        {/* Header con gradiente sutil y profesional */}
        <div className={`relative h-16 bg-gradient-to-br transition-all duration-500 ease-out group-hover:shadow-lg ${
          approvalStatus === 'rejected' 
            ? 'from-red-50 to-red-100 group-hover:from-red-100 group-hover:to-red-200' 
            : approvalStatus === 'pending'
            ? 'from-amber-50 to-orange-100 group-hover:from-amber-100 group-hover:to-orange-200'
            : isUrgent 
            ? 'from-red-50 via-orange-50 to-yellow-100 group-hover:from-red-100 group-hover:via-orange-100 group-hover:to-yellow-200' 
            : 'from-slate-50 via-blue-50 to-indigo-100 group-hover:from-slate-100 group-hover:via-blue-100 group-hover:to-indigo-200'
        } border-b border-slate-200/50 group-hover:border-slate-300/70`}>
          {/* Barra de estado sutil */}
          <div className={`absolute top-0 left-0 w-full h-1 ${
            approvalStatus === 'rejected' 
              ? 'bg-gradient-to-r from-red-500 to-red-600' 
              : approvalStatus === 'pending'
              ? 'bg-gradient-to-r from-amber-500 to-orange-500'
              : isUrgent 
              ? 'bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500' 
              : 'bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500'
          }`} />
          
          {/* Contenido del header */}
          <div className="p-4 h-full flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {dragMode && (
                  <div className="flex items-center justify-center w-5 h-5 text-slate-400 hover:text-slate-600 cursor-grab active:cursor-grabbing transition-colors duration-200">
                    <GripVertical className="h-3 w-3" />
                  </div>
                )}
                <h3 className="text-lg font-bold text-slate-900 truncate leading-tight tracking-tight">{project.name}</h3>
                {isUrgent && (
                  <Badge variant="destructive" className="text-xs px-2 py-0.5 animate-pulse shadow-sm">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Urgente
                  </Badge>
                )}
              </div>
              <p className="text-slate-600 text-sm line-clamp-1 leading-tight font-medium">
                {project.description || 'Sin descripción'}
              </p>
            </div>
            
            {/* Quick Actions Menu */}
            <div className="flex items-center gap-1 opacity-30 group-hover:opacity-100 transition-all duration-300 ml-2">
              {onToggleFavorite && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(project.id);
                  }}
                  className="h-8 w-8 p-0 text-slate-400 hover:text-yellow-500 hover:bg-yellow-50 hover:shadow-md hover:scale-110 transition-all duration-300 ease-out rounded-full"
                >
                  <Star className="h-4 w-4" />
                </Button>
              )}
              
              {user?.role === 'admin' && (
                <>
                  {onDuplicateProject && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDuplicateProject(project);
                      }}
                      className="h-8 w-8 p-0 text-slate-400 hover:text-blue-500 hover:bg-blue-50 hover:shadow-md hover:scale-110 transition-all duration-300 ease-out rounded-full"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  )}
                  {onArchiveProject && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onArchiveProject(project.id);
                      }}
                      className="h-8 w-8 p-0 text-slate-400 hover:text-orange-500 hover:bg-orange-50 hover:shadow-md hover:scale-110 transition-all duration-300 ease-out rounded-full"
                    >
                      <Archive className="h-4 w-4" />
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
        
        <div className="p-4 flex-1 flex flex-col">
          {/* Información del creador del proyecto - Solo visible para admin */}
          {user?.role === 'admin' && project.created_by && projectCreators[project.created_by] && (
            <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200/50 mb-3">
              <User className="h-3 w-3 text-slate-500" />
              <div className="flex flex-col">
                <span className="text-xs font-medium text-slate-700">
                  Creado por: {projectCreators[project.created_by].full_name}
                </span>
                <span className="text-xs text-slate-500">
                  {projectCreators[project.created_by].email}
                </span>
              </div>
            </div>
          )}

          {/* Estado, tipo y progreso en una sola línea */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {isPendingApproval ? (
                <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-300 text-xs px-3 py-1.5 font-medium shadow-sm hover:shadow-md hover:scale-105 transition-all duration-300 ease-out">
                  <Clock className="h-3 w-3 mr-1.5" />
                  Esperando Aprobación
                </Badge>
              ) : isRejected ? (
                <Badge variant="outline" className="bg-red-50 text-red-800 border-red-300 text-xs px-3 py-1.5 font-medium shadow-sm hover:shadow-md hover:scale-105 transition-all duration-300 ease-out">
                  <XCircle className="h-3 w-3 mr-1.5" />
                  Rechazado
                </Badge>
              ) : (
                <Badge variant="outline" className={`${getStatusColor(status)} text-xs px-3 py-1.5 font-medium shadow-sm hover:shadow-md hover:scale-105 transition-all duration-300 ease-out`}>
                  {getStatusIcon(status)}
                  <span className="ml-1.5">{status}</span>
                </Badge>
              )}
              
              <Badge variant="outline" className={`${getProjectTypeColor(projectType)} text-xs px-3 py-1.5 font-medium shadow-sm hover:shadow-md hover:scale-105 transition-all duration-300 ease-out`}>
                {getProjectTypeIcon(projectType)}
                <span className="ml-1.5">{projectType}</span>
              </Badge>
            </div>
            
            {!isPendingApproval && !isRejected && (
              <div className="flex items-center gap-1">
                <div className="text-sm font-bold text-slate-800">{progress}%</div>
                <div className="w-2 h-2 rounded-full bg-slate-300"></div>
              </div>
            )}
          </div>
          
          {/* Barra de progreso mejorada */}
          {!isPendingApproval && !isRejected && (
            <div className="mb-3">
              <div className="relative">
                <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ease-out ${
                      progress === 100 
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                        : progress >= 75 
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-500'
                        : progress >= 50
                        ? 'bg-gradient-to-r from-yellow-500 to-orange-500'
                        : 'bg-gradient-to-r from-slate-400 to-slate-500'
                    }`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
                {progress > 0 && (
                  <div className="absolute top-0 right-0 w-1 h-2.5 bg-white rounded-full shadow-sm"></div>
                )}
              </div>
            </div>
          )}

          {/* Metadatos del proyecto compactos */}
          {!isPendingApproval && !isRejected ? (
            <div className="grid grid-cols-3 gap-2 text-xs mb-3 flex-1">
              <div className="text-center p-2 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                <div className="font-bold text-blue-800 text-sm">{(project as any).funcionalidades?.length || 0}</div>
                <div className="text-blue-600 font-medium text-xs">Funciones</div>
              </div>
              <div className="text-center p-2 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-100">
                <div className="font-bold text-green-800 text-sm">
                  {project.fases?.filter((f: ProjectPhase) => f.estado === 'Terminado').length || 0}/{project.fases?.length || 0}
                </div>
                <div className="text-green-600 font-medium text-xs">Fases</div>
              </div>
              <div className="text-center p-2 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-100">
                <div className="font-bold text-purple-800 text-sm flex items-center justify-center gap-1">
                  <MessageSquare className="h-3 w-3" />
                  {totalComments}
                </div>
                <div className="text-purple-600 font-medium text-xs">Comentarios</div>
              </div>
            </div>
          ) : (
            <div className="mb-3 flex-1 flex items-center justify-center">
              <div className="text-center text-slate-500">
                {isPendingApproval ? (
                  <div className="space-y-2">
                    <Clock className="h-8 w-8 mx-auto text-amber-500" />
                    <p className="text-sm font-medium">Esperando aprobación</p>
                    <p className="text-xs">Los administradores revisarán tu proyecto</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <XCircle className="h-8 w-8 mx-auto text-red-500" />
                    <p className="text-sm font-medium">Proyecto rechazado</p>
                    <p className="text-xs">Contacta a los administradores</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Fechas mejor organizadas */}
          <div className="flex items-center justify-between text-xs mb-3 p-2 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex items-center gap-1.5 text-slate-600">
              <Calendar className="h-3 w-3 text-slate-500" />
              <span className="truncate font-medium">{formatDateSafe(project.created_at || project.createdAt)}</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-600">
              <Clock className="h-3 w-3 text-slate-500" />
              <span className="truncate font-medium">{formatDateSafe(project.updated_at)}</span>
            </div>
          </div>

          {/* Acciones */}
          <div className="flex gap-2 mt-auto">
            {!isPendingApproval && !isRejected && (
              <>
                {user?.role !== 'admin' && onNavigateToCollaboration && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 hover:shadow-md hover:scale-105 text-xs font-medium transition-all duration-300 ease-out"
                    onClick={(e) => {
                      e.stopPropagation();
                      onNavigateToCollaboration(project.id);
                    }}
                  >
                    <Users className="h-3 w-3 mr-1" />
                    Colaborar
                  </Button>
                )}
                
                {showAdminActions && user?.role === 'admin' && (
                  <>
                    {onNavigateToEdit && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 hover:shadow-md hover:scale-105 text-xs font-medium transition-all duration-300 ease-out"
                        onClick={(e) => {
                          e.stopPropagation();
                          onNavigateToEdit(project.id);
                        }}
                      >
                        Editar
                      </Button>
                    )}
                    {onDeleteProject && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300 hover:shadow-md hover:scale-105 text-xs font-medium transition-all duration-300 ease-out"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteProject(project.id);
                        }}
                      >
                        Eliminar
                      </Button>
                    )}
                  </>
                )}
              </>
            )}
            
            {/* Botón para proyectos rechazados */}
            {isRejected && user?.role !== 'admin' && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1 border-amber-200 text-amber-700 hover:bg-amber-50 hover:border-amber-300 hover:shadow-md hover:scale-105 text-xs font-medium transition-all duration-300 ease-out"
                onClick={async (e) => {
                  e.stopPropagation();
                  try {
                    // Importar el servicio dinámicamente para evitar dependencias circulares
                    const { projectService } = await import('@/lib/projectService');
                    await projectService.createApprovalRequest(project.id, 'Solicitud de nueva revisión del proyecto rechazado');
                    
                    // Mostrar mensaje de éxito
                    const { toast } = await import('@/hooks/use-toast');
                    toast({
                      title: 'Solicitud enviada',
                      description: 'Tu solicitud de revisión ha sido enviada a los administradores'
                    });
                  } catch (error) {
                    console.error('Error creating approval request:', error);
                    const { toast } = await import('@/hooks/use-toast');
                    toast({
                      title: 'Error',
                      description: 'No se pudo enviar la solicitud de revisión',
                      variant: 'destructive'
                    });
                  }
                }}
              >
                <MessageSquare className="h-3 w-3 mr-1" />
                Solicitar revisión
              </Button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );

  // Si está en modo drag, envolver con Draggable
  if (dragMode) {
    return (
      <Draggable 
        draggableId={project.id} 
        index={index} 
        isDragDisabled={isDragDisabled}
      >
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            className={`${snapshot.isDragging ? 'rotate-2 scale-105 shadow-2xl' : ''} transition-all duration-200`}
          >
            {cardContent}
          </div>
        )}
      </Draggable>
    );
  }

  return cardContent;
}
